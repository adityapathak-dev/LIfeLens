import express from "express";
import multer from "multer";
import mammoth from "mammoth";
import { llmChatComplete } from "./llmClient.js";

const router = express.Router();

// Store file in memory — no disk writes
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ["application/pdf", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"];
    const ext = file.originalname.split(".").pop().toLowerCase();
    if (allowed.includes(file.mimetype) || ["pdf", "txt", "docx", "doc"].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, TXT, or DOCX files are supported."));
    }
  },
});

async function extractText(buffer, mimetype, filename) {
  const ext = filename?.split(".").pop().toLowerCase();

  // Plain text
  if (mimetype === "text/plain" || ext === "txt") {
    return buffer.toString("utf-8");
  }

  // Word Document (.docx / .doc)
  if (mimetype.includes("word") || mimetype.includes("officedocument.wordprocessingml") || ext === "docx" || ext === "doc") {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || "";
    } catch (err) {
      console.error("[resumeRoute] mammoth error:", err.message);
      return buffer.toString("latin1").replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/ {4,}/g, " ").trim();
    }
  }

  // PDF
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.text || "";
  } catch (err) {
    console.error("[resumeRoute] pdf-parse error:", err.message);
    const raw = buffer.toString("latin1");
    const readable = raw.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/ {4,}/g, " ").trim();
    return readable;
  }
}

const SKILL_EXTRACT_PROMPT = `You are a professional resume parser. Perform a semantic, template-agnostic classification of the raw resume text. Identify, classify, and extract key information into a structured format regardless of layout, section titles, ordering, or design.

Extract:
1. Contact information (name, email, phone, links/socials).
2. Education details.
3. Work/internship experiences.
4. Personal or academic projects.
5. Technical and professional skills (normalize strictly as a flat array of strings).
6. Certifications or licenses.
7. Honors, awards, or achievements.
8. Leadership roles or activities.

CRITICAL OUTPUT RULE: Respond ONLY with a single valid JSON object. No markdown fences. Start with { and end with }.

{
  "contact": {
    "name": "Candidate Name",
    "email": "email@address.com",
    "phone": "+1-234-567-890",
    "links": ["github.com/profile", "linkedin.com/in/profile"]
  },
  "education": [
    "University Name - Degree (Year)"
  ],
  "experience": [
    "Company Name - Role (Dates): Responsibilities"
  ],
  "projects": [
    "Project Title - Stack: Description"
  ],
  "skills": ["Python", "React", "Docker"],
  "certifications": [
    "AWS Certified Solutions Architect"
  ],
  "achievements": [
    "1st Place at Global AI Hackathon (2024)"
  ],
  "leadership": [
    "President of Computer Science Club"
  ]
}`;

const ATS_CHECK_PROMPT = `You are an expert ATS (Applicant Tracking System) resume evaluator and senior technical recruiter. Perform a semantic, template-agnostic document analysis of the raw resume text provided. Do not rely on fixed section titles; instead, identify and classify information regardless of layout, formatting, section names, ordering, or design.

Evaluate the resume text provided. Return a single valid JSON object.

Scoring breakdown criteria (0-100):
- ATS Compatibility: Checks for blocked fonts, multi-column tables, graphics, or layout parser failures.
- Formatting & Structure: Standard margins, spacing, alignment, font sizes, chronological structure.
- Content Quality: Strong action verbs, active tone, clear statements, lack of buzzwords/typos.
- Experience Quality: Progression of roles, details of responsibilities, and clear professional scoping.
- Project Quality: Clearly described projects showcasing stack, technical depth, and outcomes.
- Skills Strength: Depth of tech/professional skills, classification, and completeness.
- Impact & Quantification: Quantified achievements, percentages, metrics, or revenue/time savings.
- Readability: Wordiness, flow, spacing, page count feasibility, readability indexes.
- Recruiter Appeal: First-glance visual hierarchy, suitability, professional summary power.

CRITICAL OUTPUT RULE: Respond ONLY with a single valid JSON object. No markdown fences. Start with { and end with }.

{
  "extracted_data": {
    "contact_info": "Contact details found in the resume",
    "education": ["Extracted education credentials, universities, degrees, graduation years"],
    "experience": ["Extracted work history, positions, companies, dates"],
    "projects": ["Extracted personal/academic projects and stack"],
    "skills": ["Extracted technologies, frameworks, soft skills, languages"],
    "certifications": ["Extracted certifications, course licenses"],
    "achievements": ["Extracted awards, honors, competitions, hackathons"],
    "research": ["Extracted research activities, academic research, labs"],
    "leadership": ["Extracted leadership roles, club presidencies, mentoring"],
    "publications": ["Extracted papers, patents, journal entries"],
    "volunteering": ["Extracted volunteer work, community service"],
    "other_content": ["Any other relevant sections, languages, interests, or courses"]
  },
  "overall_score": 72,
  "category_scores": {
    "ats_compatibility": 80,
    "formatting_structure": 75,
    "content_quality": 70,
    "experience_quality": 60,
    "project_quality": 85,
    "skills_strength": 80,
    "impact_quantification": 50,
    "readability": 85,
    "recruiter_appeal": 75
  },
  "strengths": [
    "One sentence describing a clear strength of this resume"
  ],
  "weaknesses": [
    "One sentence describing a clear weakness or risk in this resume"
  ],
  "improvements": [
    {
      "problem": "Briefly state the specific problem (e.g., Missing metrics in bullet points, Repetitive wording, Formatting issue, Unclear projects).",
      "why_matters": "Why this specific issue prevents the candidate from passing resume screens.",
      "recommended_fix": "How to resolve this issue in the resume.",
      "example_improvement": "A concrete before-and-after rewrite or direct structural change demonstrating the fix."
    }
  ],
  "template_recommendation": {
    "ats_safe": "Yes / No / Partial (Explain why)",
    "recruiter_friendly": "Yes / No (Explain why)",
    "industry_appropriate": "Yes / No (Explain why)",
    "verdict": "Keep current template / Improve current template / Switch template",
    "overleaf_templates": [
      {
        "name": "Jake's Resume LaTeX Template",
        "link": "https://www.overleaf.com/latex/templates/jakes-resume/uzgkmszrysqd",
        "reason": "De-facto industry standard for tech resumes, clean single-column structure.",
        "safety_assessment": "Safe / High Compatibility"
      }
    ]
  },
  "ats_analysis": {
    "parsed_role": "Extracted current/target professional role from the content",
    "verdict": "One short sentence detailing if this resume is ATS optimized or prone to parsing failure.",
    "keyword_gaps": [
      "Important keyword or core skill that should be present for this role but was missing"
    ]
  }
}

Rules:
- improvements must contain at least 4 detailed objects covering specific issues (weak bullet points, repetitive wording, ATS layout, low-impact descriptions, missing metrics, missing keywords, etc.).
- overleaf_templates must include at least 2 real, working LaTeX Overleaf template URLs or official university resume resources.
- Infer any missing information from context (e.g. if graduation year is missing but they are in 3rd year of college, mention graduation year is expected around 2027).`;

/* ── POST /api/resume/parse ──────────────────────────────────────── */
router.post("/resume/parse", upload.single("resume"), async (req, res) => {
  console.log("[resumeRoute/parse] Stage 1: Received request", {
    file: req.file ? { name: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype } : null,
    body: req.body
  });

  if (!req.file) {
    console.warn("[resumeRoute/parse] File upload failed: No file provided");
    return res.status(400).json({
      error: "No file uploaded. Please upload a PDF, DOCX, or TXT file.",
      diagnostics: { stage: "File validation", message: "No file object found in request." }
    });
  }

  const country = req.body.country || "";
  let text = "";

  // Stage 2: Text extraction
  try {
    console.log("[resumeRoute/parse] Stage 2: Extracting text from file...");
    text = await extractText(req.file.buffer, req.file.mimetype, req.file.originalname);
    console.log(`[resumeRoute/parse] Text extraction complete. Character length: ${text?.length || 0}`);
  } catch (extractErr) {
    console.error("[resumeRoute/parse] Text extraction failed:", extractErr);
    return res.status(500).json({
      error: "File text extraction failed.",
      diagnostics: {
        stage: "Text extraction",
        message: extractErr.message,
        stack: extractErr.stack,
        failurePoint: "During extractText call"
      }
    });
  }

  if (!text || text.trim().length < 50) {
    console.warn("[resumeRoute/parse] Text extraction returned insufficient or empty text.");
    return res.status(422).json({
      error: "Could not extract readable text from the file. Please verify it is a text-based document.",
      diagnostics: {
        stage: "Text extraction validation",
        message: `Extracted text length is too short: ${text?.trim().length || 0} characters.`
      }
    });
  }

  const trimmedText = text.trim().slice(0, 3500);
  let rawResult = "";

  // Stage 3: LLM Call
  try {
    console.log("[resumeRoute/parse] Stage 3: Sending request to LLM...");
    rawResult = await llmChatComplete(SKILL_EXTRACT_PROMPT, [
      { role: "user", content: `Resume text:\n\n${trimmedText}` },
    ]);
    console.log("[resumeRoute/parse] LLM response received successfully.");
  } catch (llmErr) {
    console.error("[resumeRoute/parse] LLM processing failed:", llmErr);
    return res.status(500).json({
      error: `LLM API request failed: ${llmErr.message}`,
      diagnostics: {
        stage: "LLM processing",
        message: llmErr.message,
        stack: llmErr.stack,
        code: llmErr.code || null,
        status: llmErr.status || null,
        failurePoint: "Before LLM call returned / During llmChatComplete"
      }
    });
  }

  // Stage 4: JSON Parsing
  let parsed;
  try {
    console.log("[resumeRoute/parse] Stage 4: Parsing JSON response from LLM...");
    const cleaned = rawResult.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(cleaned.match(/\{[\s\S]*\}/)?.[0] || cleaned);
    console.log("[resumeRoute/parse] JSON response parsed successfully.");
  } catch (jsonErr) {
    console.error("[resumeRoute/parse] JSON parsing of LLM response failed. Raw response:", rawResult);
    return res.status(502).json({
      error: "LLM response parsing failed.",
      diagnostics: {
        stage: "JSON parsing",
        message: jsonErr.message,
        stack: jsonErr.stack,
        rawResponse: rawResult,
        failurePoint: "After LLM call, parsing raw output"
      }
    });
  }

  // Stage 5: Standardized Response Build
  try {
    console.log("[resumeRoute/parse] Stage 5: Returning standardized response...");
    return res.json({
      success: true,
      parsedResume: {
        contact: parsed.contact || {},
        education: parsed.education || [],
        experience: parsed.experience || [],
        projects: parsed.projects || [],
        skills: parsed.skills || [],
        certifications: parsed.certifications || [],
        achievements: parsed.achievements || [],
        leadership: parsed.leadership || [],
        resumeText: trimmedText,
        country: country
      }
    });
  } catch (err) {
    console.error("[resumeRoute/parse] Final response building failed:", err);
    return res.status(500).json({
      error: "Final response generation failed.",
      diagnostics: {
        stage: "Response builder",
        message: err.message,
        stack: err.stack
      }
    });
  }
});

/* ── POST /api/resume/check ──────────────────────────────────────── */
router.post("/resume/check", async (req, res) => {
  console.log("[resumeRoute/check] Stage 1: Received request", {
    hasParsedResume: !!req.body.parsedResume,
    targetRole: req.body.targetRole
  });

  const { parsedResume, targetRole } = req.body;

  if (!parsedResume || !parsedResume.resumeText || parsedResume.resumeText.trim().length < 50) {
    console.warn("[resumeRoute/check] Validation failed: Missing parsedResume or resumeText");
    return res.status(400).json({
      error: "Structured parsedResume object with resumeText is required.",
      diagnostics: {
        stage: "Payload validation",
        message: `parsedResume present: ${!!parsedResume}, resumeText length: ${parsedResume?.resumeText?.trim().length || 0}`
      }
    });
  }

  const resumeText = parsedResume.resumeText;
  const country = parsedResume.country || "";
  let countryPrompt = "";

  // Country evaluation standards inject
  const lowerCountry = country.toLowerCase();
  if (lowerCountry.includes("united states") || lowerCountry.includes("usa") || lowerCountry.includes("us")) {
    countryPrompt = "\nUSA ATS STANDARDS:\n- Grade heavily on achievement-driven bullet points using the XYZ formula (e.g., 'Accomplished X as measured by Y, by doing Z').\n- Bullet points must start with strong active verbs.\n- Demand quantified metrics and impact in every role.";
  } else if (lowerCountry.includes("india") || lowerCountry.includes("in")) {
    countryPrompt = "\nINDIA ATS STANDARDS:\n- Focus on technical skill moats, developer frameworks, and internship experience.\n- Evaluate projects and academic credentials. Highlight placement readiness.";
  } else if (lowerCountry.includes("germany") || lowerCountry.includes("de")) {
    countryPrompt = "\nGERMANY CV STANDARDS:\n- Rate formatting structure, clear tabular CV chronological order.\n- Look for a professional summary section and structured headers.";
  } else if (lowerCountry.includes("united kingdom") || lowerCountry.includes("uk")) {
    countryPrompt = "\nUK CV STANDARDS:\n- Grade the balance between a specific skills list and chronological career achievements.\n- Keep sentences clear and punchy.";
  } else {
    countryPrompt = "\nGENERAL CV STANDARDS:\n- Assess formatting, clear metrics, active verbs, and skill alignments.";
  }

  const context = `Target role: ${targetRole || "General / Not specified"}\nCountry: ${country || "Not specified"}\n\nResume text:\n\n${resumeText.trim().slice(0, 3500)}`;
  let rawResult = "";

  // Stage 3: LLM Call
  try {
    console.log("[resumeRoute/check] Stage 2: Sending request to LLM...");
    rawResult = await llmChatComplete(ATS_CHECK_PROMPT + countryPrompt, [
      { role: "user", content: context },
    ]);
    console.log("[resumeRoute/check] LLM response received successfully.");
  } catch (llmErr) {
    console.error("[resumeRoute/check] LLM processing failed:", llmErr);
    return res.status(500).json({
      error: `LLM API request failed: ${llmErr.message}`,
      diagnostics: {
        stage: "LLM processing",
        message: llmErr.message,
        stack: llmErr.stack,
        code: llmErr.code || null,
        status: llmErr.status || null,
        failurePoint: "Before LLM call returned / During llmChatComplete"
      }
    });
  }

  // Stage 4: JSON Parsing
  let parsed;
  try {
    console.log("[resumeRoute/check] Stage 3: Parsing JSON response from LLM...");
    const cleaned = rawResult.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(cleaned.match(/\{[\s\S]*\}/)?.[0] || cleaned);
    console.log("[resumeRoute/check] JSON response parsed successfully.");
  } catch (jsonErr) {
    console.error("[resumeRoute/check] JSON parsing of LLM response failed. Raw response:", rawResult);
    return res.status(502).json({
      error: "LLM response parsing failed.",
      diagnostics: {
        stage: "JSON parsing",
        message: jsonErr.message,
        stack: jsonErr.stack,
        rawResponse: rawResult,
        failurePoint: "After LLM call, parsing raw output"
      }
    });
  }

  return res.json(parsed);
});

export default router;
