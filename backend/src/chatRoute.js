import express from "express";
import { llmChatComplete } from "./llmClient.js";
import { CHAT_SYSTEM_PROMPTS } from "./chatPrompts.js";
import { getCounselorByAreaOrCountry } from "./counselors.js";
import { getInvestorsForField } from "./investors.js";

const router = express.Router();

function safeParseJSON(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to extract the outermost JSON object
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Could not parse JSON from model response");
  }
}

/**
 * POST /api/chat
 * Body: {
 *   decision_type: "grad_school" | "job" | "startup",
 *   history: [{role: "user"|"assistant", content: string}],
 *   country: string (optional — used for counselor lookup)
 *   field: string (optional — used for startup investor lookup)
 * }
 *
 * The server is stateless — full conversation history is sent by the client
 * each turn. The LLM sees the complete history and the system prompt.
 */
router.post("/chat", async (req, res) => {
  const { decision_type, history, country, field, colleges } = req.body;

  if (!decision_type || !CHAT_SYSTEM_PROMPTS[decision_type]) {
    return res
      .status(400)
      .json({ error: "Invalid or missing decision_type. Must be grad_school, job, or startup." });
  }

  if (!Array.isArray(history) || history.length === 0) {
    return res.status(400).json({ error: "history must be a non-empty array of {role, content} objects." });
  }

  const systemPrompt = CHAT_SYSTEM_PROMPTS[decision_type];

  try {
    const rawText = await llmChatComplete(systemPrompt, history);

    let parsed;
    try {
      parsed = safeParseJSON(rawText);
    } catch {
      return res.status(502).json({
        error: "Model returned malformed JSON.",
        raw: rawText.slice(0, 500),
      });
    }

    const response = {
      message: parsed.message || "I'm not sure how to respond. Could you say more?",
      is_analysis: Boolean(parsed.is_analysis),
      analysis: parsed.analysis || null,
      offer_counselor: Boolean(parsed.offer_counselor),
      suggested_options: Array.isArray(parsed.suggested_options) ? parsed.suggested_options : [],
      counselor: null,
    };

    // If it's a startup analysis, inject the field-specific investors.
    if (response.is_analysis && decision_type === "startup" && response.analysis) {
      response.analysis.investors = getInvestorsForField(field);
    }

    // Always attach counselor info when analysis is shown or when explicitly flagged.
    // The frontend decides whether to surface the counselor card.
    if (response.is_analysis || response.offer_counselor) {
      response.counselor = getCounselorByAreaOrCountry(colleges, country);
    }

    return res.json(response);
  } catch (err) {
    console.error("[chatRoute]", err);
    return res.status(500).json({ error: "Internal error during chat." });
  }
});


export default router;
