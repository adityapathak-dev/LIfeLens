import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { llmComplete } from "./llmClient.js";
import { runGuardrails } from "./guardrails.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SYSTEM_PROMPT = fs.readFileSync(path.join(__dirname, "system_prompt.txt"), "utf-8");

const router = express.Router();

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

  if (!requestPayload?.paths || requestPayload.paths.length < 2) {
    return res.status(400).json({ error: "At least two paths are required." });
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
        throw new Error("Guardrails safety failure");
      }
    } catch (err) {
      console.error("[reasonRoute] Reasoning pipeline error, serving local fallback:", err.message);
      parsed = generateLocalReasoningFallback(requestPayload);
      result = { safe: true, data: parsed };
    }

    return res.json(result.data);
  } catch (err) {
    console.error("[reasonRoute] Critical fallback exception:", err);
    const ultimateFallback = generateLocalReasoningFallback(requestPayload);
    return res.json(ultimateFallback);
  }
});

export default router;
