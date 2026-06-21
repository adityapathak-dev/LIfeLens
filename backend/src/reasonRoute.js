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
router.post("/reason", async (req, res) => {
  const requestPayload = req.body;

  if (!requestPayload?.paths || requestPayload.paths.length < 2) {
    return res.status(400).json({ error: "At least two paths are required." });
  }

  try {
    let rawText = await llmComplete(SYSTEM_PROMPT, requestPayload);
    let parsed;

    try {
      parsed = safeParseJSON(rawText);
    } catch (e) {
      return res.status(502).json({ error: "Model returned malformed JSON.", raw: rawText });
    }

    let result = runGuardrails(parsed, requestPayload);

    // One retry with a stricter system prompt reminder if recommendation language slipped through.
    if (!result.safe) {
      const strictPrompt =
        SYSTEM_PROMPT +
        "\n\nREMINDER: Your previous response contained recommendation language. " +
        "This is a hard violation. Rewrite using only conditional, descriptive framing. " +
        "Do not state or imply a best choice anywhere in your response.";

      rawText = await llmComplete(strictPrompt, requestPayload);
      try {
        parsed = safeParseJSON(rawText);
      } catch (e) {
        return res.status(502).json({ error: "Model returned malformed JSON on retry.", raw: rawText });
      }
      result = runGuardrails(parsed, requestPayload);

      if (!result.safe) {
        return res.status(502).json({
          error: "Model output failed responsible-AI guardrails twice; request blocked rather than shown.",
        });
      }
    }

    return res.json(result.data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal error during reasoning chain." });
  }
});

export default router;
