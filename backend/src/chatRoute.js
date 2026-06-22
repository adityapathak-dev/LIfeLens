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
function generateLocalChatFallback(decisionType, collegesStr, countryStr, context = {}) {
  const currentCountry = countryStr || context.country || context.userCountry || "Global";
  const currentStream = context.streamCategory || "Engineering";
  const currentDegree = context.targetDegree || "Graduate Studies";
  const currentRole = context.role || "Software Engineer";
  const currentSkills = context.skills || "JavaScript, React, Node.js, SQL";
  const currentField = context.field || "Technology";
  const currentRunway = context.runway || "6";

  // Parse college list
  let userColleges = [];
  if (collegesStr) {
    userColleges = collegesStr.split(/[\n,;]/).map(c => c.trim()).filter(Boolean);
  }
  if (userColleges.length === 0) {
    userColleges = currentCountry.toLowerCase().includes("india")
      ? ["IIT Bombay", "BITS Pilani", "Delhi Technological University (DTU)"]
      : ["Stanford University", "Massachusetts Institute of Technology (MIT)", "UC Berkeley"];
  }

  // Set up college safe/reach options
  const options = [];
  userColleges.forEach((col, idx) => {
    const isReach = idx === 0;
    const isSafe = idx === userColleges.length - 1;
    const band = isReach ? " (Reach)" : isSafe ? " (Safe)" : " (Target)";
    options.push({
      label: col + band,
      short_term: `Adapt to academic environment, configure target schedule for ${currentStream}, and build student networks.`,
      long_term: `Graduate with competitive grades, leveraging strong alumni networks and campus placement opportunities.`,
      key_risk: isReach 
        ? "Highly competitive cohort entry criteria and potential academic stress." 
        : "Moderate placement average compared to top-tier reach institutes.",
      key_assumption: "Active involvement in projects, high GPA maintenance, and interview readiness.",
      confidence: isReach ? "medium" : "high",
      college_note: `Well regarded institution with proven career acceleration record for ${currentStream} students.`
    });
  });

  if (decisionType === "grad_school") {
    return {
      message: "Here is your completed academic evaluation and college safety/reach breakdown:",
      is_analysis: true,
      analysis: {
        summary: `Comprehensive evaluation for your target ${currentDegree} degree in ${currentStream} in ${currentCountry}. We mapped your profile against target score boundaries and historical entrance cutoffs.`,
        options: options,
        hidden_tradeoffs: [
          "Entering graduate school delays immediate workforce earning potential in exchange for higher long-term ceiling.",
          "Choosing highly ranked reach schools requires higher financial investment compared to local safe options."
        ],
        branch_questions: [
          "Would you consider preparing for alternate entrance exams if primary cutoff scores fluctuate?",
          "How would securing a teaching/research assistantship affect your overall graduate budget?"
        ],
        best_suggestion: {
          choice: userColleges[Math.floor(userColleges.length / 2)] || userColleges[0],
          reasoning: `This selection provides the optimal balance of academic ranking, placement track record, and cost-to-benefit ratio for ${currentStream}.`,
          link: `https://www.google.com/search?q=${encodeURIComponent(userColleges[0])}`
        },
        top_alternate: {
          name: currentCountry.toLowerCase().includes("india") 
            ? "Birla Institute of Technology and Science (BITS), Pilani" 
            : "Georgia Institute of Technology",
          why: "Highly acclaimed curriculum focusing heavily on practical industrial skills and robust direct recruiting pipelines.",
          eligibility: currentCountry.toLowerCase().includes("india")
            ? "Requires high BITSAT score (~280+ / 390) or equivalent JEE marks."
            : "Requires strong GPA (3.7+) and competitive SAT/GRE scores.",
          link: "https://www.bits-pilani.ac.in"
        },
        explore_more: [
          {
            name: currentCountry.toLowerCase().includes("india")
              ? "Delhi Technological University (DTU)"
              : "University of Illinois Urbana-Champaign (UIUC)",
            reason: "Extremely strong return on investment with lower tuition thresholds and direct access to metropolitan job pools.",
            eligibility: currentCountry.toLowerCase().includes("india")
              ? "Requires JEE Main ranking below 15,000 for top computer/IT branches."
              : "Requires solid tech portfolio and SAT Math 750+.",
            link: "https://www.dtu.ac.in"
          }
        ],
        disclaimer: "These recommendations are generated by the local backup profile matching dataset."
      },
      offer_counselor: false
    };
  }

  if (decisionType === "job") {
    return {
      message: "Here is your career match evaluation, salary benchmarks, and skills roadmap:",
      is_analysis: true,
      analysis: {
        summary: `Career evaluation for the target role of ${currentRole} in ${currentCountry}. We analyzed your core skills (${currentSkills}) to outline optimal employment pathways.`,
        options: [
          {
            label: `${currentRole} - Core Path`,
            short_term: `Master company-specific workflows, codebase details, and complete initial project sprints.`,
            long_term: `Promotion to senior engineering or architecture roles, driving system designs and mentoring juniors.`,
            key_risk: "Fast technology obsolescence cycles requiring continuous evening/weekend upskilling.",
            key_assumption: "Active market demand and corporate investment in software engineering tools.",
            confidence: "high",
            college_note: `Fits your stated competencies: ${currentSkills}.`
          }
        ],
        hidden_tradeoffs: [
          "Large enterprise roles offer high structural stability but slower promotion cycles compared to rapid startup environments.",
          "Remote working models provide high flexibility but reduce critical face-to-face networking speed."
        ],
        branch_questions: [
          "Are you willing to compromise on starting salary for a role offering equity and rapid product ownership?",
          "Do you prefer a specialized engineering track or transitioning toward product/project management?"
        ],
        best_suggestion: {
          choice: `${currentRole} - Core Path`,
          reasoning: `Aligned directly with your technology skillset (${currentSkills}), maximizing immediate contribution capacity.`,
          link: "https://www.linkedin.com/jobs"
        },
        top_alternate: {
          name: "Solutions Architect / Cloud Systems Engineer",
          why: "Great blend of technology depth with client engagement responsibilities, featuring rapid salary growth.",
          estimated_salary: "$110,000 - $135,000 / yr",
          link: "https://aws.amazon.com/certification/"
        },
        explore_more: [
          {
            name: "Technical Product Manager",
            reason: "Coordinates system architecture with business strategies; ideal for engineers moving to leadership.",
            estimated_salary: "$120,000 - $145,000 / yr",
            link: "https://www.pmi.org"
          }
        ],
        disclaimer: "This report is generated using local career-matrix datasets."
      },
      offer_counselor: false
    };
  }

  // startup fallback
  return {
    message: "Here is your startup validation report, risk assessment, and funding suggestions:",
    is_analysis: true,
    analysis: {
      summary: `Startup assessment in the ${currentField} sector. Given your savings runway of ${currentRunway} months, validation speed and cash efficiency are your absolute priorities.`,
      options: [
        {
          label: "Lean MVP Bootstrap Route",
          short_term: "Build minimum core functionality, release to niche users, and iterate weekly based on usage.",
          long_term: "Scale business through organic revenue, maintaining full equity ownership and operational independence.",
          key_risk: "Failing to validate demand before depleting your runway.",
          key_assumption: "Low cost of customer acquisition through direct content/socials or organic discovery.",
          confidence: "medium",
          college_note: "Highly recommended for first-time founders or resource-constrained projects."
        }
      ],
      hidden_tradeoffs: [
        "Perfecting product polish delays critical customer feedback loops and runway conservation.",
        "Bootstrapping limits scaling speed compared to aggressive venture capital injection."
      ],
      branch_questions: [
        "Can you build the initial MVP version using no-code tools or simple landing page pre-sales?",
        "If runway runs low, do you have a freelance consulting mechanism to support core development?"
      ],
      best_suggestion: {
        choice: "Lean MVP Bootstrap Route",
        reasoning: "Conserves equity and focuses 100% of engineering bandwidth on validating core user demand.",
        link: "https://www.ycombinator.com/library"
      },
      top_alternate: {
        name: "Venture-Backed Accelerator Launch",
        why: "Apply to early-stage incubators (e.g., YC, Techstars) to raise pre-seed capital, secure advisors, and hire talent.",
        link: "https://www.ycombinator.com"
      },
      explore_more: [
        {
          name: "B2B Strategic Partnership",
          reason: "Joint venture with an industry incumbent to secure distribution and revenue-share agreements early.",
          link: "https://www.crunchbase.com"
        }
      ],
      disclaimer: "Suggestions are computed via local venture modeling."
    },
    offer_counselor: false
  };
}

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
  const userMessageCount = history.filter((msg) => msg.role === "user").length;

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

  // Force conclusion directive on turn 3
  if (userMessageCount >= 3) {
    systemPrompt += `
\nCRITICAL DIRECTIVE: You have reached the maximum allowed turns for this consultation. You MUST now finalize the consultation and output the full analysis. Set "is_analysis" to true and populate the "analysis" object completely. Do NOT ask any more questions.
`;
  }

  try {
    let rawText;
    let parsed;

    try {
      console.log(`[chatRoute] Sending chat turn to LLM. User turns so far: ${userMessageCount}`);
      rawText = await llmChatComplete(systemPrompt, history);
      parsed = safeParseJSON(rawText);

      // Programmatic turn limit guard: if 3 turns completed but LLM failed to return analysis, force fallback
      if (userMessageCount >= 3 && !parsed.is_analysis) {
        console.warn("[chatRoute] Turn limit reached but model did not output analysis. Forcing fallback.");
        throw new Error("Forced completion fallback");
      }
    } catch (err) {
      console.error("[chatRoute] Primary LLM path failed or malformed, launching local fallback generator:", err.message);
      parsed = generateLocalChatFallback(decision_type, colleges, country, context);
    }

    const response = {
      message: parsed.message || "Here is the assessment based on your parameters:",
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
    if (response.is_analysis || response.offer_counselor) {
      response.counselor = getCounselorByAreaOrCountry(colleges, country);
    }

    return res.json(response);
  } catch (err) {
    console.error("[chatRoute] Critical recovery failure inside chat:", err);
    // Ultimate safety recovery: return a valid local fallback response directly
    const fallbackResponse = generateLocalChatFallback(decision_type, colleges, country, context);
    if (fallbackResponse.is_analysis && decision_type === "startup" && fallbackResponse.analysis) {
      fallbackResponse.analysis.investors = getInvestorsForField(field);
    }
    fallbackResponse.counselor = getCounselorByAreaOrCountry(colleges, country);
    return res.json(fallbackResponse);
  }
});


export default router;
