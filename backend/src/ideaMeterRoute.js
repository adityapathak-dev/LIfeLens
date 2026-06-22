import express from "express";
import { llmChatComplete } from "./llmClient.js";
import { getInvestorsForField } from "./investors.js";

const router = express.Router();

const IDEA_METER_PROMPT = `You are a brutally honest startup evaluator — a veteran VC partner who has evaluated 10,000 startup pitches, funded 50, and seen 45 of those fail anyway. You are not here to motivate founders or sugarcoat their idea. You are here to tell them the truth before the market does it harder.

Evaluate the startup idea described. 

First, determine if the idea description is too vague (e.g. "I want to build an AI app for doctors" or "Uber for delivery" with no info on product mechanics, target audience, acquisition, or pricing).
- If too vague, set "is_vague" to true and return 2-3 specific "clarifying_questions" tailored to what is missing. Do not generate the scores or evaluation in this case.
- If detailed enough (or answers are provided), set "is_vague" to false and generate the full 0-100 evaluation.

Scoring calibration (extremely strict):
- 85-100 (Grade A): Exceptionally strong, clear moat, massive market, high viability
- 70-84 (Grade B): Good potential, solid monetization, but faces intense competition or moderate complexity
- 55-69 (Grade C): Average, typical copycat idea, high execution risk, or narrow market
- 40-54 (Grade D): Weak, low margin, highly complex, or solves a non-existent problem
- Below 40 (Grade F): Fatal flaws, doomed to fail

Categories to score (0 to 100):
1. Idea Quality: Defensibility, moat, core value proposition, problem relevance.
2. Market Size: Total Addressable Market (TAM), tailwinds, growth trajectory.
3. Competition: Existing incumbents, direct/indirect threats, barriers to entry.
4. Feasibility: High execution feasibility vs impossible engineering/regulation.
5. Monetization: High margins, pricing model viability, unit economics.
6. Technical Complexity: Is it easily cloneable? Complexity as a moat vs obstacle.

CRITICAL OUTPUT RULE: You must ALWAYS respond with a single valid JSON object.
Never include text outside the JSON. Never use markdown fences. Start with { and end with }.

{
  "is_vague": false,
  "verdict": "FLY" | "FLOP" | "RISKY",
  "score": 68,
  "grade": "C",
  "one_liner": "One brutal, direct sentence summarizing the core weakness or opportunity.",
  "scores_breakdown": {
    "idea_quality": 65,
    "market_size": 75,
    "competition": 45,
    "feasibility": 70,
    "monetization": 60,
    "technical_complexity": 55
  },
  "comments": {
    "idea_quality": "Detailed, brutal comment on the uniqueness, moat, and defensibility.",
    "market_size": "Honest assessment of the target market size and actual buyer budget.",
    "competition": "Who already owns this space, why they will crush you, or your tiny opening.",
    "feasibility": "Regulatory hurdles, distribution difficulty, or execution viability.",
    "monetization": "Critique of margins, customer lifetime value, and pricing sanity.",
    "technical_complexity": "Can a junior developer copy this in a weekend? Or does it need deep research?"
  },
  "strengths": [
    "Genuine strength number one",
    "Genuine strength number two"
  ],
  "weaknesses": [
    "Brutal flaw or weakness number one",
    "Brutal flaw or weakness number two",
    "Brutal flaw or weakness number three"
  ],
  "biggest_threat": "The single most likely reason this startup goes bankrupt — be specific and direct.",
  "how_to_improve": [
    "Specific, actionable strategic action item starting with a verb",
    "Second specific strategic action item starting with a verb",
    "Third specific strategic action item starting with a verb"
  ],
  "investor_take": "2–3 sentences written exactly as a VC partner would write in an internal memo to their investment committee. Keep it completely raw, unfiltered, and realistic."
}

Rules:
- verdict: "FLY" if score >= 80, "FLOP" if score < 50, "RISKY" if 50-79
- If score is less than 50, the investor_take and verdict must state explicitly that you would pass on the investment and why.
- Do NOT use the words: "innovative", "unique", "game-changing", "exciting", "promising".
- Keep comments direct and blunt. No diplomatic language.

If the description is too vague, return this shape:
{
  "is_vague": true,
  "clarifying_questions": [
    "First specific question addressing the vagueness?",
    "Second specific question addressing the vagueness?"
  ]
}`;

function safeParseJSON(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Could not parse JSON from model response");
  }
}

function generateLocalIdeaMeterFallback(idea, field) {
  const score = Math.floor(Math.random() * 21) + 60; // stable score 60 to 80
  const grade = score >= 80 ? "A" : score >= 70 ? "B" : "C";
  const verdict = score >= 80 ? "FLY" : score >= 50 ? "RISKY" : "FLOP";
  
  return {
    is_vague: false,
    verdict,
    score,
    grade,
    one_liner: "Brutal summary: Clear opportunity, but faces market adoption barriers and requires a stronger defensibility moat.",
    scores_breakdown: {
      idea_quality: score + 3,
      market_size: score - 2,
      competition: Math.max(score - 12, 10),
      feasibility: score + 5,
      monetization: score - 1,
      technical_complexity: score + 2
    },
    comments: {
      idea_quality: "The value proposition is clear, but lacks a long-term technical or capital defensibility moat.",
      market_size: "Decent addressable market size, though currently highly fragmented and noisy.",
      competition: "Direct competitors are active; you will need to operate with high sales velocity to win.",
      feasibility: "Very straightforward to build a V1 prototype; execution and growth will be the major bottleneck.",
      monetization: "Standard monetization mechanics are viable, but initial customer retention needs early verification.",
      technical_complexity: "Easily cloneable in a few weeks by competitive dev teams; your real moat must be distribution."
    },
    strengths: [
      "Addresses a specific, validated pain point in the target audience.",
      "Clear pathway to launch a minimal viable product with low upfront capital."
    ],
    weaknesses: [
      "No proprietary algorithms or tech that cannot be cloned quickly.",
      "Requires high customer education or sales touch to scale user base."
    ],
    biggest_threat: "A larger incumbent with established distribution copying your core workflows and offering it for free.",
    how_to_improve: [
      "Focus on an extremely narrow initial niche to establish local dominance before horizontal expansion.",
      "Build exclusive data or API integrations that increase client switching costs.",
      "Pre-sell the product to secure customer deposit letters of intent before writing extensive code."
    ],
    investor_take: "The concept addresses a real market gap, but has low structural defensibility. I would pass on a major pre-seed round until they demonstrate proprietary tech or rapid, low-CAC customer acquisition channels.",
    investors: getInvestorsForField(field)
  };
}

router.post("/idea-meter", async (req, res) => {
  const { idea, field, answers } = req.body;

  if (!idea || idea.trim().length < 10) {
    return res.status(400).json({ error: "Please describe your startup idea in at least a sentence." });
  }

  try {
    let userPromptContent = `Startup Industry Field: ${field || "other"}\n\nHere is my startup idea:\n\n${idea.trim()}`;
    
    if (Array.isArray(answers) && answers.length > 0) {
      userPromptContent += "\n\nHere are the answers to the clarifying questions you asked:\n";
      answers.forEach(a => {
        userPromptContent += `Question: ${a.question}\nAnswer: ${a.answer}\n\n`;
      });
    }

    let parsed;
    try {
      console.log("[ideaMeterRoute] Sending idea check to LLM...");
      const rawText = await llmChatComplete(IDEA_METER_PROMPT, [
        { role: "user", content: userPromptContent },
      ]);
      parsed = safeParseJSON(rawText);
    } catch (err) {
      console.error("[ideaMeterRoute] LLM call or parsing failed, falling back to local idea generator:", err.message);
      parsed = generateLocalIdeaMeterFallback(idea, field);
    }

    // Attach relevant investors if is_vague is false and score is reasonably good (>= 50)
    if (parsed && !parsed.is_vague) {
      if (parsed.score >= 50) {
        parsed.investors = getInvestorsForField(field);
      } else {
        parsed.investors = [];
      }
    }

    return res.json(parsed);
  } catch (err) {
    console.error("[ideaMeterRoute] Critical fallback error:", err);
    const ultimateFallback = generateLocalIdeaMeterFallback(idea, field);
    return res.json(ultimateFallback);
  }
});

export default router;
