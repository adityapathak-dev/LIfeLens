/**
 * Deterministic guardrails — NOT left to the LLM's judgment.
 * Implements the three guardrails specified in docs/REASONING_CHAIN_SPEC.md.
 */

const FORBIDDEN_RECOMMENDATION_PATTERNS = [
  /you should\b/i,
  /i recommend/i,
  /the best option/i,
  /best choice/i,
  /go with\b/i,
  /i'd suggest/i,
  /i would (choose|pick|go)/i,
];

export function stripInternalCoT(obj) {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map(stripInternalCoT);
  }
  const forbiddenKeys = ["chain_of_thought", "cot", "internal_reasoning", "thinking", "scratchpad", "system_cot"];
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!forbiddenKeys.includes(key.toLowerCase())) {
      cleaned[key] = stripInternalCoT(value);
    }
  }
  return cleaned;
}

/**
 * Guardrail 2: scans all free-text fields (including explainability fields) in the
 * parsed response for recommendation language. Returns true if a violation is found.
 */
export function containsRecommendationLanguage(parsed) {
  const stringsToCheck = [];

  Object.values(parsed.factor_extraction || {}).forEach((v) => stringsToCheck.push(v));
  (parsed.projections || []).forEach((p) => {
    stringsToCheck.push(p.short_term_outcome, p.long_term_outcome, p.key_risk, p.key_assumption);
  });
  (parsed.hidden_tradeoffs || []).forEach((t) => {
    if (typeof t === "string") stringsToCheck.push(t);
    else if (t && typeof t === "object") stringsToCheck.push(t.description);
  });

  // Also scan explainability blocks inside options
  (parsed.options || []).forEach((opt) => {
    stringsToCheck.push(opt.short_term, opt.long_term, opt.key_risk, opt.key_assumption, opt.college_note);
    if (opt.explainability) {
      const exp = opt.explainability;
      (exp.influencing_inputs || []).forEach((s) => stringsToCheck.push(s));
      (exp.assumptions_used || []).forEach((s) => stringsToCheck.push(s));
      (exp.missing_information || []).forEach((s) => stringsToCheck.push(s));
      (exp.sensitivity_factors || []).forEach((s) => stringsToCheck.push(s));
      if (exp.confidence_rationale) stringsToCheck.push(exp.confidence_rationale);
    }
  });

  const joined = stringsToCheck.filter(Boolean).join(" \n ");
  return FORBIDDEN_RECOMMENDATION_PATTERNS.some((pattern) => pattern.test(joined));
}

/**
 * Guardrail 1: confidence override.
 * Downgrades model-proposed confidence by one tier when input context was thin
 * or internally inconsistent, so the model can't project false confidence on
 * weak input.
 */
const TIER_ORDER = ["low", "medium", "high"];

function downgrade(confidence) {
  const idx = TIER_ORDER.indexOf((confidence || "medium").toLowerCase());
  if (idx <= 0) return "low";
  return TIER_ORDER[idx - 1];
}

export function applyConfidenceOverride(parsed, requestPayload) {
  const pathNoteMap = {};
  (requestPayload.paths || []).forEach((p) => {
    pathNoteMap[p.label] = (p.user_note || "").trim().length > 0;
  });

  const { risk_tolerance, financial_runway_months } = requestPayload.constraints || {};
  const inconsistent =
    typeof risk_tolerance === "number" &&
    typeof financial_runway_months === "number" &&
    risk_tolerance >= 4 &&
    financial_runway_months <= 2;

  parsed.projections = (parsed.projections || []).map((proj) => {
    const hasNote = pathNoteMap[proj.path];
    let confidence = proj.confidence;

    if (!hasNote) confidence = downgrade(confidence);
    if (inconsistent) confidence = downgrade(confidence);

    return { ...proj, confidence };
  });

  return parsed;
}

/**
 * Guardrail 3: disclaimer is injected by code, always, regardless of model output.
 */
export function injectDisclaimer(parsed) {
  parsed.disclaimer =
    "These are structured possibilities based on what you shared, not predictions. " +
    "You are the one who decides — this tool will never tell you which path to choose.";
  return parsed;
}

/**
 * Full guardrail pipeline. Returns { safe: boolean, data: object, retriedReason?: string }
 */
export function runGuardrails(parsed, requestPayload) {
  const sanitized = stripInternalCoT(parsed);
  if (containsRecommendationLanguage(sanitized)) {
    return { safe: false, data: sanitized, retriedReason: "recommendation_language_detected" };
  }
  const withConfidence = applyConfidenceOverride(sanitized, requestPayload);
  const withDisclaimer = injectDisclaimer(withConfidence);
  return { safe: true, data: withDisclaimer };
}
