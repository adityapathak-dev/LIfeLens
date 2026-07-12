import express from "express";
import { llmChatComplete } from "./llmClient.js";
import { EXAM_DATABASE } from "./examDatabase.js";

const router = express.Router();

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

function getNormalizedCountryName(countryInput) {
  if (!countryInput) return "";
  const s = countryInput.toLowerCase().trim().replace(/[.,]/g, "");
  const MAP = {
    india: "India", "in": "India",
    "united states": "United States", "usa": "United States", "us": "United States", america: "United States", "united states of america": "United States",
    "united kingdom": "United Kingdom", "uk": "United Kingdom", england: "United Kingdom", britain: "United Kingdom", scotland: "United Kingdom", wales: "United Kingdom",
    canada: "Canada",
    australia: "Australia", "aus": "Australia",
    germany: "Germany", deutschland: "Germany",
    singapore: "Singapore", "sg": "Singapore",
    uae: "United Arab Emirates", "united arab emirates": "United Arab Emirates", dubai: "United Arab Emirates", "abu dhabi": "United Arab Emirates",
    china: "China",
  };
  if (MAP[s]) return MAP[s];
  const first = s.split(/[\s,]+/)[0];
  return MAP[first] || null;
}

function getStaticPathways(country) {
  const pathways = {
    "India": [
      "Applications for Engineering (JEE) open in Nov (Session 1) and Feb (Session 2).",
      "Medical admission (NEET UG) registration typically starts in Feb/March for May exam.",
      "Most PG programs (GATE, CAT) have registration windows between Aug and Oct."
    ],
    "United States": [
      "Early Decision/Early Action deadlines are typically November 1st.",
      "Regular Decision deadlines are usually January 1st or January 15th.",
      "Requires online application via Common App or Coalition App, including essays."
    ],
    "United Kingdom": [
      "UCAS undergraduate application deadline is late January (October 15th for Oxford/Cambridge/Medicine).",
      "Requires a Personal Statement, one academic reference, and predicted grades."
    ],
    "Canada": [
      "Primary application deadlines run from January to March for the September intake.",
      "Requires submission of academic transcripts and language proficiency credentials."
    ],
    "Australia": [
      "Semester 1 starts in February (deadlines in Nov/Dec); Semester 2 starts in July (deadlines in May/June).",
      "Direct application via university websites or state tertiary admission centers."
    ]
  };
  return pathways[country] || [
    "Verify specific university deadlines (typically 6-9 months before semester start).",
    "Submit complete academic transcripts, certificates, and standardized test scores."
  ];
}

function getStaticVisaRequirements(country) {
  const visa = {
    "India": [
      "International students require a valid Student Visa issued by the Indian Mission abroad.",
      "Requires an admission offer letter from a recognized Indian educational institution."
    ],
    "United States": [
      "Requires an F-1 Student Visa.",
      "Must receive Form I-20 from a SEVP-approved school and pay the SEVIS I-901 fee.",
      "Must show proof of sufficient funds to cover tuition and living costs."
    ],
    "United Kingdom": [
      "Requires a Student Visa (formerly Tier 4).",
      "Must receive a Confirmation of Acceptance for Studies (CAS) from a licensed sponsor.",
      "Requires meeting the English language requirement and demonstrating financial maintenance."
    ],
    "Canada": [
      "Requires a Study Permit.",
      "Must have a Letter of Acceptance (LOA) from a Designated Learning Institution (DLI).",
      "Requires showing financial sufficiency and passing a medical exam/security check."
    ],
    "Australia": [
      "Requires a Student Visa (Subclass 500).",
      "Must hold a Confirmation of Enrolment (CoE) from an Australian university.",
      "Must meet the Genuine Student (GS) requirement and show OSHC health cover."
    ]
  };
  return visa[country] || [
    "Apply for a student visa at the target country's embassy or consulate.",
    "Must obtain a formal university acceptance confirmation letter (e.g. I-20, CAS, CoE).",
    "Prepare bank statements showing proof of financial capability."
  ];
}

const DISCOVERY_PROMPT = `You are an expert research system that discovers major competitive entrance exams, language requirements, aptitude tests, and admission pathways for higher education, professional jobs, or international visas.

Given:
- Country: [Country Name]
- Course Category: [Engineering / Medical / Science / Management / Law / Design / etc.]
- Target Degree: [e.g. B.Tech, MBA, MBBS, B.Des, LLB, etc.]

Your job is to:
1. Validate if the country name is a real, valid country. If it is invalid, gibberish, or a placeholder, you MUST return valid_country: false and a clean, direct error message.
2. If valid, research and compile ALL major competitive exams, entrance tests, language proficiency tests, and admission qualifications available in that country.
3. For each exam, provide score validation metadata (min_val, max_val, score_type like 'percentile', 'rank', 'gpa', 'score') and a boolean "recommended" field indicating if this exam is directly relevant to or required for the specified Course Category and Target Degree.

CRITICAL OUTPUT RULE: Respond ONLY with a single valid JSON object. No markdown fences. Start with { and end with }.

{
  "valid_country": true,
  "error": "",
  "exams": [
    {
      "id": "exam_id",
      "label": "Exam Name",
      "courses": "Eligible Courses (e.g. B.Tech / B.E)",
      "score_type": "percentile | score | rank | gpa",
      "min_val": 0,
      "max_val": 100,
      "hint": "Range description",
      "conducting_body": "Conducting Body Name",
      "website": "Official Website URL",
      "recommended": true | false
    }
  ],
  "admission_pathways": [
    "Typical application window is Oct - Jan.",
    "Submit transcripts, references, and exam scores."
  ],
  "visa_requirements": [
    "Requires proof of English proficiency (IELTS/TOEFL) for non-native students.",
    "Needs financial proof/bank statements showing living cost coverage."
  ]
}
`;

/**
 * POST /api/exams/discover
 * Body: { country: string, category: string, degree: string }
 * Returns dynamic list of exams and pathways or country validation error.
 */
router.post("/exams/discover", async (req, res) => {
  const { country, category, degree } = req.body;

  if (!country || country.trim().length < 2) {
    return res.json({
      valid_country: false,
      error: "Please enter a valid country name.",
      exams: [],
      admission_pathways: [],
      visa_requirements: []
    });
  }

  try {
    const normCountry = getNormalizedCountryName(country);
    
    // If it's a known country in our database
    if (normCountry) {
      console.log(`[examDiscoveryRoute] Querying static database: Country=${normCountry}, Category=${category}, Degree=${degree}`);
      
      const filtered = EXAM_DATABASE.filter(exam => {
        // Match country OR "International" (IELTS, TOEFL)
        const countryMatch = exam.country.toLowerCase() === normCountry.toLowerCase() || exam.country.toLowerCase() === "international";
        return countryMatch;
      });

      if (filtered.length > 0) {
        console.log(`[examDiscoveryRoute] Static database matches found: ${filtered.length} exams.`);
        const exams = filtered.map(exam => {
          // recommended if category matches OR target degree is in eligible courses
          const isRecommended = Boolean(
            (category && exam.category.toLowerCase() === category.toLowerCase()) ||
            (degree && exam.eligibleCourses && exam.eligibleCourses.some(c => c.toLowerCase().includes(degree.toLowerCase())))
          );
          
          return {
            id: exam.id,
            label: exam.name,
            courses: exam.eligibleCourses.join(" / "),
            score_type: exam.score_type,
            min_val: exam.min_val,
            max_val: exam.max_val,
            hint: exam.hint,
            conducting_body: exam.conductingBody,
            website: exam.website,
            recommended: isRecommended
          };
        });

        // Sort so recommended exams appear at the top
        exams.sort((a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0));

        const admission_pathways = getStaticPathways(normCountry);
        const visa_requirements = getStaticVisaRequirements(normCountry);

        return res.json({
          valid_country: true,
          error: "",
          exams,
          admission_pathways,
          visa_requirements
        });
      }
    }

    // Fallback: dynamic LLM research
    console.log(`[examDiscoveryRoute] Falling back to LLM research: Country=${country}, Category=${category}, Degree=${degree}`);
    const userMessage = `Country: ${country.trim()}\nCourse Category: ${category || "General"}\nTarget Degree: ${degree || "All"}`;

    const rawText = await llmChatComplete(DISCOVERY_PROMPT, [
      { role: "user", content: userMessage }
    ]);

    let parsed;
    try {
      parsed = safeParseJSON(rawText);
    } catch {
      return res.status(502).json({
        error: "Model returned malformed discovery JSON.",
        raw: rawText.slice(0, 500),
      });
    }

    if (parsed.exams && Array.isArray(parsed.exams)) {
      parsed.exams = parsed.exams.map(e => ({
        id: e.id || e.label?.toLowerCase().replace(/\s+/g, "_"),
        label: e.label || e.name || "Exam",
        courses: e.courses || e.eligibleCourses || "All courses",
        score_type: e.score_type || "score",
        min_val: e.min_val !== undefined ? e.min_val : 0,
        max_val: e.max_val !== undefined ? e.max_val : 100,
        hint: e.hint || `Range: ${e.min_val} - ${e.max_val}`,
        conducting_body: e.conducting_body || e.conductingBody || "Unknown",
        website: e.website || "",
        recommended: e.recommended !== undefined ? Boolean(e.recommended) : false
      }));
      // Sort so recommended exams appear at the top
      parsed.exams.sort((a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0));
    }

    return res.json(parsed);
  } catch (err) {
    console.error("[examDiscoveryRoute] Error:", err);
    return res.status(500).json({ error: "Failed to perform exam discovery." });
  }
});

export default router;
