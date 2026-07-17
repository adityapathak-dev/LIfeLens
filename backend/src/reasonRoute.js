import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { llmComplete } from "./llmClient.js";
import { runGuardrails } from "./guardrails.js";
import { recordGuardrailViolation, recordFallback } from "./usageMonitor.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SYSTEM_PROMPT = fs.readFileSync(path.join(__dirname, "system_prompt.txt"), "utf-8");

const router = express.Router();

// ── INPUT VALIDATION (OWASP A03 — Injection, A04 — Insecure Design) ───────────
const MAX_LABEL_LEN    = 100;
const MAX_NOTE_LEN     = 1000;
const MAX_PATHS        = 5;

function sanitizeStr(val, maxLen) {
  if (typeof val !== "string") return "";
  // Strip control characters, then trim & truncate
  return val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim().slice(0, maxLen);
}

function validateReasonBody(body) {
  const errors = [];

  if (!Array.isArray(body?.paths)) {
    errors.push("paths must be an array.");
  } else {
    if (body.paths.length < 2) errors.push("At least two paths are required.");
    if (body.paths.length > MAX_PATHS) errors.push(`A maximum of ${MAX_PATHS} paths is supported.`);

    body.paths.forEach((p, i) => {
      if (typeof p?.label !== "string" || p.label.trim().length === 0)
        errors.push(`paths[${i}].label must be a non-empty string.`);
      // Sanitize in-place
      p.label     = sanitizeStr(p.label, MAX_LABEL_LEN);
      p.user_note = sanitizeStr(p.user_note ?? "", MAX_NOTE_LEN);
    });
  }

  if (body?.constraints !== undefined && typeof body.constraints !== "object") {
    errors.push("constraints must be an object.");
  }

  if (body?.constraints) {
    const { risk_tolerance, financial_runway_months } = body.constraints;
    if (risk_tolerance !== undefined && (typeof risk_tolerance !== "number" || risk_tolerance < 0 || risk_tolerance > 10))
      errors.push("constraints.risk_tolerance must be a number between 0 and 10.");
    if (financial_runway_months !== undefined && (typeof financial_runway_months !== "number" || financial_runway_months < 0 || financial_runway_months > 600))
      errors.push("constraints.financial_runway_months must be a number between 0 and 600.");
  }

  return errors;
}

function safeParseJSON(text) {
  // Strip accidental markdown fences in case the model adds them despite instructions.
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

/**
 * POST /api/reason
 * Body: { paths: [{label, user_note}], constraints: {...} }
 *
 * Runs the four-step reasoning chain (single LLM call), then applies
 * deterministic guardrails. If the model violates the no-recommendation
 * rule, retries once with a stricter reminder appended to the system prompt.
 */
function generateLocalReasoningFallback(requestPayload) {
  const paths = requestPayload.paths || [];
  
  const factor_extraction = {};
  const projections = [];
  const branch_questions = [];

  paths.forEach((p) => {
    factor_extraction[p.label] = p.user_note || `Seeking to explore path options for ${p.label}.`;
    
    projections.push({
      path: p.label,
      short_term_outcome: "Initial learning phase, setup of daily work routine, and starting network acquisition.",
      long_term_outcome: "Achievement of operational baseline targets and growth in the selected domain.",
      key_risk: "Opportunity cost and potential initial friction during adaptation phase.",
      key_assumption: "Your active commitment and consistent effort levels over the first year.",
      confidence: "medium"
    });

    branch_questions.push({
      path: p.label,
      questions: [
        `What if primary revenue/earning targets for ${p.label} are delayed by 3 months?`,
        `What if your interest or lifestyle preference shifts away from ${p.label} after 6 months?`
      ]
    });
  });

  return {
    factor_extraction,
    projections,
    hidden_tradeoffs: [
      "Every committed path reduces your agility to pivot to unforeseen opportunities elsewhere in the short term.",
      "Direct lifestyle alignment trade-offs: high autonomy paths typically carry higher cash flow volatility."
    ],
    branch_questions
  };
}

router.post("/reason", async (req, res) => {
  const requestPayload = req.body;

  // Validate + sanitize all user input before touching LLM
  const validationErrors = validateReasonBody(requestPayload);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: validationErrors.join(" ") });
  }

  try {
    let rawText;
    let parsed;
    let result;

    try {
      console.log("[reasonRoute] Initiating reasoning completion...");
      rawText = await llmComplete(SYSTEM_PROMPT, requestPayload);
      parsed = safeParseJSON(rawText);
      result = runGuardrails(parsed, requestPayload);

      // One retry with a stricter system prompt reminder if recommendation language slipped through.
      if (!result.safe) {
        console.warn("[reasonRoute] Responsible-AI guardrails failed, retrying once with strict prompt...");
        recordGuardrailViolation();
        const strictPrompt =
          SYSTEM_PROMPT +
          "\n\nREMINDER: Your previous response contained recommendation language. " +
          "This is a hard violation. Rewrite using only conditional, descriptive framing. " +
          "Do not state or imply a best choice anywhere in your response.";

        rawText = await llmComplete(strictPrompt, requestPayload);
        parsed = safeParseJSON(rawText);
        result = runGuardrails(parsed, requestPayload);
      }
      
      if (!result.safe) {
        console.warn("[reasonRoute] Guardrails failed twice, falling back to local reasoning generator.");
        recordGuardrailViolation();
        throw new Error("Guardrails safety failure");
      }
    } catch (err) {
      console.error("[reasonRoute] Reasoning pipeline error, serving local fallback:", err.message);
      recordFallback();
      parsed = generateLocalReasoningFallback(requestPayload);
      result = { safe: true, data: parsed };
    }

    return res.json(result.data);
  } catch (err) {
    // Never expose internal error details to the client
    console.error("[reasonRoute] Critical fallback exception:", err);
    recordFallback();
    const ultimateFallback = generateLocalReasoningFallback(requestPayload);
    return res.json(ultimateFallback);
  }
});

export default router;
