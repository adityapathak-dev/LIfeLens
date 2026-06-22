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
  const { decision_type, history, country, field, colleges, context } = req.body;

  if (!decision_type || !CHAT_SYSTEM_PROMPTS[decision_type]) {
    return res
      .status(400)
      .json({ error: "Invalid or missing decision_type. Must be grad_school, job, or startup." });
  }

  if (!Array.isArray(history) || history.length === 0) {
    return res.status(400).json({ error: "history must be a non-empty array of {role, content} objects." });
  }

  let systemPrompt = CHAT_SYSTEM_PROMPTS[decision_type];

  if (context) {
    let contextStr = "\n\nCRITICAL CONTEXT INFORMATION (DO NOT ASK FOR THESE AGAIN):\n";
    if (context.userCountry) contextStr += `- Current Country: ${context.userCountry}\n`;
    if (context.userState) contextStr += `- Current State/Province: ${context.userState}\n`;
    if (context.userCity) contextStr += `- Current City: ${context.userCity}\n`;
    if (context.country) contextStr += `- Target Country/Market: ${context.country}\n`;

    if (decision_type === "grad_school") {
      if (context.targetDegree) contextStr += `- Target Degree: ${context.targetDegree}\n`;
      if (context.streamCategory) contextStr += `- Stream Category: ${context.streamCategory}\n`;
      if (context.colleges) contextStr += `- Colleges under consideration: ${context.colleges}\n`;
      if (context.financialSituation) contextStr += `- Financial situation/Budget: ${context.financialSituation}\n`;
      if (context.runway) contextStr += `- Savings buffer: ${context.runway} months\n`;
      if (context.locationPreference) contextStr += `- Location preferences: ${context.locationPreference}\n`;
    } else if (decision_type === "job") {
      if (context.city) contextStr += `- Target City/Region: ${context.city}\n`;
      if (context.role) contextStr += `- Target Role/Job Title: ${context.role}\n`;
      if (context.companies) contextStr += `- Companies/Offers under consideration: ${context.companies}\n`;
      if (context.skills) contextStr += `- User Skills/Tech Stack: ${context.skills}\n`;
      if (context.currentSituation) contextStr += `- Current Work/Student Situation: ${context.currentSituation}\n`;
      if (context.runway) contextStr += `- Savings buffer: ${context.runway} months\n`;
      if (context.locationPreference) contextStr += `- Location preferences: ${context.locationPreference}\n`;
    } else if (decision_type === "startup") {
      if (context.field) contextStr += `- Industry Field/Sector: ${context.field}\n`;
      if (context.myRole) contextStr += `- User Role in Startup: ${context.myRole}\n`;
      if (context.description) contextStr += `- Startup Description: ${context.description}\n`;
      if (context.fundingStage) contextStr += `- Funding Stage: ${context.fundingStage}\n`;
      if (context.runway) contextStr += `- Savings buffer: ${context.runway} months\n`;
      if (context.locationPreference) contextStr += `- Location preferences: ${context.locationPreference}\n`;
      if (context.riskTolerance) contextStr += `- Risk Tolerance: ${context.riskTolerance}/5\n`;
    }

    contextStr += `
You MUST NOT ask the user for any of the details listed above. You already have this information. Continue the conversation directly, deep diving into other aspects depending on what is missing to generate a full analysis. Ensure that any URLs returned are actual, official websites. Do not use generic domain placeholders.
`;
    systemPrompt = systemPrompt + contextStr;
  }

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
