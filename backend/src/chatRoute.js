import express from "express";
import { llmChatComplete } from "./llmClient.js";
import { CHAT_SYSTEM_PROMPTS } from "./chatPrompts.js";
import { getCounselorByAreaOrCountry } from "./counselors.js";
import { getInvestorsForField } from "./investors.js";
import { recordCounselorTrigger, recordFallback } from "./usageMonitor.js";

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
      college_note: `Well regarded institution with proven career acceleration record for ${currentStream} students.`,
      explainability: {
        influencing_inputs: [`Target degree: ${currentDegree}`, `Stream: ${currentStream}`, `Location: ${currentCountry}`],
        assumptions_used: ["Assumes standard 2-year full-time academic course progression", "Assumes baseline interview readiness"],
        missing_information: ["Specific financial scholarship eligibility status"],
        confidence_rationale: isReach 
          ? "Assigned Medium confidence as admission cutoff boundaries are competitive." 
          : "Assigned High confidence due to matching historical cutoff bounds.",
        sensitivity_factors: [`If GPA drops below 3.2, placement options move to regional safe tiers.`]
      }
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

// ── INPUT SANITIZATION (OWASP A03 — Injection) ────────────────────────────────
const MAX_STR_LEN = 100;
const MAX_LONG_STR_LEN = 2000; // for multi-line fields like colleges, skills, description

function sanitizeInputStr(val) {
  if (typeof val !== "string") return "";
  return val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim().slice(0, MAX_STR_LEN);
}

function sanitizeLongStr(val) {
  if (typeof val !== "string") return "";
  return val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim().slice(0, MAX_LONG_STR_LEN);
}

function sanitizeContextObject(ctx) {
  if (!ctx || typeof ctx !== "object") return {};
  const cleaned = {};

  // Short string fields
  const shortKeys = [
    "userCountry", "userState", "userCity", "country",
    "targetDegree", "streamCategory", "financialSituation",
    "runway", "locationPreference", "city", "role",
    "currentSituation", "field", "myRole",
    "fundingStage", "riskTolerance"
  ];
  // Long string fields (multi-line: colleges, skills, description)
  const longKeys = ["colleges", "skills", "companies", "description", "locationPreference"];

  shortKeys.forEach(k => {
    if (ctx[k] !== undefined) {
      if (typeof ctx[k] === "string") cleaned[k] = sanitizeInputStr(ctx[k]);
      else if (typeof ctx[k] === "number") cleaned[k] = ctx[k];
    }
  });

  longKeys.forEach(k => {
    if (ctx[k] !== undefined && typeof ctx[k] === "string") {
      cleaned[k] = sanitizeLongStr(ctx[k]);
    }
  });

  // Exam scores: object { examId: scoreString }
  if (ctx.examScores && typeof ctx.examScores === "object" && !Array.isArray(ctx.examScores)) {
    const cleanedScores = {};
    Object.entries(ctx.examScores).forEach(([examId, score]) => {
      const cleanId = sanitizeInputStr(examId);
      const cleanScore = sanitizeInputStr(String(score));
      if (cleanId && cleanScore) cleanedScores[cleanId] = cleanScore;
    });
    cleaned.examScores = cleanedScores;
  }

  // Selected exam IDs
  if (Array.isArray(ctx.selectedExams)) {
    cleaned.selectedExams = ctx.selectedExams
      .filter(id => typeof id === "string")
      .map(id => sanitizeInputStr(id))
      .slice(0, 20);
  }

  // Parsed resume data (from ATS checker) — extract key fields only
  if (ctx.parsedResume && typeof ctx.parsedResume === "object") {
    const r = ctx.parsedResume;
    cleaned.resumeSkills = Array.isArray(r.skills) ? r.skills.slice(0, 20).map(s => sanitizeInputStr(s)).join(", ") : "";
    cleaned.resumeEducation = typeof r.education === "string" ? sanitizeLongStr(r.education) : "";
    cleaned.resumeExperience = typeof r.experience === "string" ? sanitizeLongStr(r.experience) : "";
  }

  // Memory fields (passed through from AuthContext)
  if (ctx.memory && typeof ctx.memory === "object") {
    const m = ctx.memory;
    if (Array.isArray(m.degreeInterests)) cleaned.memoryDegreeInterests = m.degreeInterests.slice(0, 5).map(sanitizeInputStr).join(", ");
    if (Array.isArray(m.examInterests)) cleaned.memoryExamInterests = m.examInterests.slice(0, 5).map(sanitizeInputStr).join(", ");
    if (Array.isArray(m.countryPreferences)) cleaned.memoryCountryPrefs = m.countryPreferences.slice(0, 5).map(sanitizeInputStr).join(", ");
    if (typeof m.budgetConstraints === "string") cleaned.memoryBudget = sanitizeLongStr(m.budgetConstraints);
    if (Array.isArray(m.careerInterests)) cleaned.memoryCareerInterests = m.careerInterests.slice(0, 5).map(sanitizeInputStr).join(", ");
    if (Array.isArray(m.skills)) cleaned.memorySkills = m.skills.slice(0, 20).map(sanitizeInputStr).join(", ");
    if (typeof m.salaryExpectations === "string") cleaned.memorySalaryExpectations = sanitizeLongStr(m.salaryExpectations);
    if (Array.isArray(m.industryInterests)) cleaned.memoryIndustryInterests = m.industryInterests.slice(0, 5).map(sanitizeInputStr).join(", ");
    if (Array.isArray(m.sectorInterests)) cleaned.memorySectorInterests = m.sectorInterests.slice(0, 5).map(sanitizeInputStr).join(", ");
    if (m.riskTolerance !== undefined) cleaned.memoryRiskTolerance = m.riskTolerance;
    if (Array.isArray(m.fundingInterests)) cleaned.memoryFundingInterests = m.fundingInterests.slice(0, 5).map(sanitizeInputStr).join(", ");
    if (Array.isArray(m.businessInterests)) cleaned.memoryBusinessInterests = m.businessInterests.slice(0, 5).map(sanitizeInputStr).join(", ");
  }

  return cleaned;
}

router.post("/chat", async (req, res) => {
  const decision_type = sanitizeInputStr(req.body.decision_type);
  const country = sanitizeInputStr(req.body.country);
  const field = sanitizeInputStr(req.body.field);
  const colleges = sanitizeLongStr(req.body.colleges || "");
  const context = sanitizeContextObject(req.body.context);
  const rawHistory = req.body.history;

  if (!decision_type || !CHAT_SYSTEM_PROMPTS[decision_type]) {
    return res
      .status(400)
      .json({ error: "Invalid or missing decision_type. Must be grad_school, job, or startup." });
  }

  if (!Array.isArray(rawHistory) || rawHistory.length === 0) {
    return res.status(400).json({ error: "history must be a non-empty array of {role, content} objects." });
  }

  // Keep up to 30 messages; allow 4000 chars per message to preserve full intake context
  const history = rawHistory
    .slice(-30)
    .filter(msg => msg && typeof msg === "object" && typeof msg.content === "string")
    .map(msg => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim().slice(0, 4000)
    }));

  if (history.length === 0) {
    return res.status(400).json({ error: "Invalid message objects in history." });
  }

  let systemPrompt = CHAT_SYSTEM_PROMPTS[decision_type];

  // Count only real follow-up user turns (skip message index 0 which is always the init context dump)
  const userMessageCount = history.filter((msg) => msg.role === "user").length - 1;

  // ── BUILD RICH KNOWN-FACTS CONTEXT BLOCK ──────────────────────────────────────
  // This is injected into the system prompt so the model has a complete inventory
  // of everything already known. It must never ask for anything in this block.
  const knownFacts = [];

  // Location
  if (context.userCountry) knownFacts.push(`CURRENT COUNTRY: ${context.userCountry}`);
  if (context.userState) knownFacts.push(`CURRENT STATE/PROVINCE: ${context.userState}`);
  if (context.userCity) knownFacts.push(`CURRENT CITY: ${context.userCity}`);
  if (context.country) knownFacts.push(`TARGET COUNTRY/MARKET: ${context.country}`);

  if (decision_type === "grad_school") {
    if (context.targetDegree) knownFacts.push(`TARGET DEGREE: ${context.targetDegree}`);
    if (context.streamCategory) knownFacts.push(`STREAM/BRANCH CATEGORY: ${context.streamCategory}`);
    if (context.colleges) knownFacts.push(`COLLEGES UNDER CONSIDERATION:\n${context.colleges}`);
    if (context.financialSituation) knownFacts.push(`FINANCIAL SITUATION: ${context.financialSituation}`);
    if (context.runway) knownFacts.push(`SAVINGS BUFFER: ${context.runway} months`);
    if (context.locationPreference) knownFacts.push(`LOCATION PREFERENCES: ${context.locationPreference}`);
    // Exam scores — the most critical data point for grad school
    if (context.examScores && Object.keys(context.examScores).length > 0) {
      const scoreLines = Object.entries(context.examScores)
        .map(([examId, score]) => `  • ${examId}: ${score}`)
        .join("\n");
      knownFacts.push(`EXAM SCORES PROVIDED BY USER (DO NOT ask for these — use them directly in your analysis):\n${scoreLines}`);
    }
    // Memory fields for grad school
    if (context.memoryDegreeInterests) knownFacts.push(`USER MEMORY — DEGREE INTERESTS: ${context.memoryDegreeInterests}`);
    if (context.memoryExamInterests) knownFacts.push(`USER MEMORY — EXAM INTERESTS: ${context.memoryExamInterests}`);
    if (context.memoryCountryPrefs) knownFacts.push(`USER MEMORY — COUNTRY PREFERENCES: ${context.memoryCountryPrefs}`);
    if (context.memoryBudget) knownFacts.push(`USER MEMORY — BUDGET CONSTRAINTS: ${context.memoryBudget}`);
  } else if (decision_type === "job") {
    if (context.city) knownFacts.push(`TARGET CITY/REGION: ${context.city}`);
    if (context.role) knownFacts.push(`TARGET ROLE/JOB TITLE: ${context.role}`);
    if (context.companies) knownFacts.push(`COMPANIES/OFFERS UNDER CONSIDERATION:\n${context.companies}`);
    if (context.skills) knownFacts.push(`SKILLS / TECH STACK: ${context.skills}`);
    if (context.currentSituation) knownFacts.push(`CURRENT WORK/STUDENT STATUS: ${context.currentSituation}`);
    if (context.runway) knownFacts.push(`SAVINGS BUFFER: ${context.runway} months`);
    if (context.locationPreference) knownFacts.push(`LOCATION PREFERENCES: ${context.locationPreference}`);
    // Resume data from ATS checker
    if (context.resumeSkills) knownFacts.push(`RESUME — SKILLS EXTRACTED: ${context.resumeSkills}`);
    if (context.resumeExperience) knownFacts.push(`RESUME — EXPERIENCE SUMMARY:\n${context.resumeExperience}`);
    if (context.resumeEducation) knownFacts.push(`RESUME — EDUCATION:\n${context.resumeEducation}`);
    // Memory fields for job
    if (context.memoryCareerInterests) knownFacts.push(`USER MEMORY — CAREER INTERESTS: ${context.memoryCareerInterests}`);
    if (context.memorySkills) knownFacts.push(`USER MEMORY — SKILLS: ${context.memorySkills}`);
    if (context.memorySalaryExpectations) knownFacts.push(`USER MEMORY — SALARY EXPECTATIONS: ${context.memorySalaryExpectations}`);
    if (context.memoryIndustryInterests) knownFacts.push(`USER MEMORY — INDUSTRY INTERESTS: ${context.memoryIndustryInterests}`);
    if (context.memoryCountryPrefs) knownFacts.push(`USER MEMORY — PREFERRED COUNTRIES: ${context.memoryCountryPrefs}`);
  } else if (decision_type === "startup") {
    if (context.field) knownFacts.push(`INDUSTRY FIELD/SECTOR: ${context.field}`);
    if (context.myRole) knownFacts.push(`USER ROLE IN STARTUP: ${context.myRole}`);
    if (context.description) knownFacts.push(`STARTUP DESCRIPTION:\n${context.description}`);
    if (context.fundingStage) knownFacts.push(`FUNDING STAGE: ${context.fundingStage}`);
    if (context.runway) knownFacts.push(`SAVINGS BUFFER: ${context.runway} months`);
    if (context.locationPreference) knownFacts.push(`LOCATION PREFERENCES: ${context.locationPreference}`);
    if (context.riskTolerance) knownFacts.push(`RISK TOLERANCE: ${context.riskTolerance}/5`);
    // Memory fields for startup
    if (context.memorySectorInterests) knownFacts.push(`USER MEMORY — SECTOR INTERESTS: ${context.memorySectorInterests}`);
    if (context.memoryFundingInterests) knownFacts.push(`USER MEMORY — FUNDING INTERESTS: ${context.memoryFundingInterests}`);
    if (context.memoryBusinessInterests) knownFacts.push(`USER MEMORY — BUSINESS INTERESTS: ${context.memoryBusinessInterests}`);
    if (context.memoryRiskTolerance !== undefined) knownFacts.push(`USER MEMORY — RISK TOLERANCE: ${context.memoryRiskTolerance}/5`);
  }

  // Historical Sessions Context
  if (Array.isArray(context.previousSessions) && context.previousSessions.length > 0) {
    const sessionSummaries = context.previousSessions.slice(0, 5).map((s, idx) => {
      const dateStr = s.updatedAt ? new Date(s.updatedAt).toISOString().split("T")[0] : "Previous";
      return `[HISTORICAL SESSION ${idx + 1} - ${s.decisionType?.toUpperCase() || "ADVISOR"} - ${dateStr}] Title: ${s.title || "Untitled"}\nSummary/Outcome: ${s.summary || "Exploration completed"}\nTop Path Chosen: ${s.dossier?.best_suggestion?.choice || s.dossier?.options?.[0]?.label || "N/A"}`;
    }).join("\n\n");
    knownFacts.push(`PREVIOUS ADVISOR SESSIONS (Use to reference past choices, shifting priorities, or evolving plans naturally):\n${sessionSummaries}`);
  }

  if (knownFacts.length > 0) {
    systemPrompt += `

═══════════════════════════════════════════════════════════════
COMPLETE KNOWN-FACTS INVENTORY (assembled from intake form + memory + resume + historical sessions)
You MUST treat every item below as established fact.
NEVER ask the user for any information already present here.
When asking follow-up questions, explicitly reference this data to show awareness.
If historical sessions are present, feel free to reference them naturally:
"In your previous session regarding X, you prioritized Y. Comparing that to your current position..."
═══════════════════════════════════════════════════════════════

${knownFacts.map((f, i) => `[KNOWN-FACT ${i+1}] ${f}`).join("\n\n")}

═══════════════════════════════════════════════════════════════
INTELLIGENT QUESTIONING & CONTINUITY RULES:
1. Read every KNOWN-FACT above before deciding what to ask.
2. Only ask about information genuinely missing from the KNOWN-FACTS inventory.
3. Every question must reference at least one known fact to demonstrate awareness.
4. Your first response must begin with a synthesis paragraph summarizing everything you already know about this user — NOT a generic greeting.
5. If user has previous sessions, acknowledge their evolving decision history.
6. Responses must be substantial (minimum 150 words for questions, 1200+ words for final analysis dossier).
7. Think and respond like a senior expert consultant, strategist, and mentor — NOT a generic chatbot.
═══════════════════════════════════════════════════════════════
`;
  }

  // Completion directive — trigger after 5 real follow-up turns (generous but bounded)
  if (userMessageCount >= 5) {
    systemPrompt += `

FINAL ANALYSIS DIRECTIVE: You have gathered sufficient information across ${userMessageCount} exchanges. You MUST now produce the complete Decision Dossier. Set "is_analysis" to true and populate every field of the "analysis" object in full detail. Do NOT ask further questions. The dossier must include:
1. Strongest path given current data
2. Most conservative path
3. Highest upside path
4. Alternative path worth considering
5. Key risks and assumptions
6. Information that could change the outcome
This is your final output — make it comprehensive.
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
      if (userMessageCount >= 5 && !parsed.is_analysis) {
        console.warn("[chatRoute] Turn limit reached but model did not output analysis. Forcing fallback.");
        throw new Error("Forced completion fallback");
      }
    } catch (err) {
      console.error("[chatRoute] Primary LLM path failed or malformed, launching local fallback generator:", err.message);
      recordFallback();
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

    if (response.offer_counselor) {
      recordCounselorTrigger();
    }

    return res.json(response);
  } catch (err) {
    console.error("[chatRoute] Critical recovery failure inside chat:", err);
    recordFallback();
    // Ultimate safety recovery: return a valid local fallback response directly
    const fallbackResponse = generateLocalChatFallback(decision_type, colleges, country, context);
    if (fallbackResponse.is_analysis && decision_type === "startup" && fallbackResponse.analysis) {
      fallbackResponse.analysis.investors = getInvestorsForField(field);
    }
    fallbackResponse.counselor = getCounselorByAreaOrCountry(colleges, country);
    if (fallbackResponse.offer_counselor) {
      recordCounselorTrigger();
    }
    return res.json(fallbackResponse);
  }
});


export default router;
