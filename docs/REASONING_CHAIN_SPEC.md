# Reasoning Chain Spec — Life Decision Simulator

## Purpose
This is the core differentiator the brief demands: NOT a pros/cons list, NOT a single-shot
generation. The LLM is forced through an explicit reasoning sequence and returns structured
JSON reflecting that sequence — so the *output itself* exposes the reasoning steps to the user.

## Why an LLM (not a rules engine) — for Devpost "AI Reasoning" justification

A rules engine could rank options if tradeoffs were fixed and enumerable (e.g. "if savings < 6mo
runway, startup = risky"). But this problem has three properties rules engines handle badly:

1. **Tradeoffs are personal and context-dependent.** The same "low savings" fact means something
   different to a person with no dependents vs. one supporting family. A rules engine needs a
   combinatorial rule for every interaction; an LLM reasons over the combination directly.
2. **"Hidden tradeoffs" requires generating considerations the user didn't mention.** This is
   generative, not retrieval — there's no fixed lookup table of "things people forget to consider."
3. **Outcome narratives need natural language synthesis**, not templated sentence-slotting, to
   stay specific to the user's actual stated reasons ("what's pulling you toward each option").

Rules/heuristics are still used for **guardrails** (see Responsible AI section) — the LLM does not
get unrestricted control over framing. This hybrid is the actual justification: LLM for reasoning
over ambiguous personal context, deterministic code for confidence-labeling and decision-gating.

## Input → the model receives (structured, not raw chat)

```json
{
  "decision_type": "grad_school_vs_job_vs_startup",
  "paths": [
    { "label": "Grad School", "user_note": "free text, optional" },
    { "label": "Job Offer", "user_note": "free text, optional" },
    { "label": "Startup", "user_note": "free text, optional" }
  ],
  "constraints": {
    "financial_runway_months": 6,
    "risk_tolerance": 3,
    "time_horizon_years": 5,
    "has_dependents": false,
    "location_flexible": true
  }
}
```

## The forced reasoning sequence (single API call, structured output)

The system prompt forces the model through four steps internally and returns all four as
distinct JSON fields — this is what makes the chain auditable and non-"pros/cons":

**Step 1 — Factor extraction.** Restate the user's actual stated motivations per path, in the
model's own words. This step exists so steps 2-4 visibly build on the user's real input, not a
generic template, and so the user can verify the model understood them correctly.

**Step 2 — Per-path projection.** For each path, generate:
- `short_term_outcome` (6–12 months)
- `long_term_outcome` (the user's stated time_horizon_years)
- `key_risk` (one specific risk, not generic)
- `key_assumption` (what has to be true for this path to work)
- `confidence` — enum `low | medium | high`, determined by a deterministic post-process (see
  Guardrails), not left to the model's free judgment

**Step 3 — Cross-path tradeoff surfacing.** Compare the three projections and surface 1–2 tradeoffs
the user did NOT mention in their notes or constraints. This is the "hidden considerations" the
brief requires and is the step that most differentiates this from a pros/cons list — it requires
the model to notice an absence, not just summarize a presence.

**Step 4 — Branch questions.** For each path, generate 2 "what if" questions whose answers would
materially change that path's risk/confidence (e.g. "What if the startup raises a pre-seed round
in month 3?"). These become clickable UI elements that re-run steps 2–3 with one constraint
modified — this is what makes it a simulator, not a static report.

## Output schema (returned to backend, then UI)

```json
{
  "factor_extraction": {
    "Grad School": "string",
    "Job Offer": "string",
    "Startup": "string"
  },
  "projections": [
    {
      "path": "Grad School",
      "short_term_outcome": "string",
      "long_term_outcome": "string",
      "key_risk": "string",
      "key_assumption": "string",
      "confidence": "low | medium | high"
    }
  ],
  "hidden_tradeoffs": ["string", "string"],
  "branch_questions": [
    { "path": "Grad School", "questions": ["string", "string"] }
  ],
  "disclaimer": "These are structured possibilities based on your inputs, not predictions."
}
```

## Guardrails (deterministic code, NOT left to the LLM)

**Note on model choice and guardrail importance:** Groq serves open-weight models (e.g. Llama
3.3 70B), not Claude/GPT-class proprietary models. Open-weight models can be less consistent at
following strict negative instructions ("never say X") than frontier proprietary models — this
makes the deterministic, code-level guardrails below MORE load-bearing for this build, not less.
Test the no-recommendation pattern check thoroughly; if Llama slips recommendation language
through more often than expected, the retry-then-block path in `reasonRoute.js` is what catches it.

1. **Confidence is never self-reported by the model unchecked.** The model proposes a confidence
   level, but the backend overrides it downward by one tier if: the user supplied no free-text
   note for that path (less context = less confidence), OR the constraint set is internally
   inconsistent (e.g. risk_tolerance=5 but financial_runway_months=1 for the startup path).
   This prevents the model from projecting false confidence when the input was thin.
2. **The model is never asked "which path should I choose," and the prompt explicitly forbids
   a ranked recommendation or a "best choice" statement.** This is enforced at the prompt level
   AND validated by a backend regex/keyword check on the response (flags phrases like "you should
   choose," "the best option is," "I recommend") before the response reaches the UI. If flagged,
   the response is regenerated with a stricter system prompt reminder.
3. **The disclaimer field is generated by code, not the model**, and is always rendered, so it
   cannot be omitted by a model that "forgets."

## Re-run behavior (the "simulator" part)
Clicking a branch question re-sends the same payload with one constraint field modified
(inferred from the question, e.g. financial_runway_months adjusted) and re-runs Steps 2–3 only —
Step 1 (factor extraction) and Step 4 (new branch questions) regenerate too, but the UI visually
diffs the new projection against the original so the user sees what changed and why.

## Evaluation Strategy

To ensure high-quality and consistent structured reasoning output, the following evaluation protocol is implemented:

### 1. Guardrail Pass-Rate Log & Drift Detection
All API requests are monitored for safety and compliance. When a response contains recommendation language (detected via standard regex/keyword check in `guardrails.js`), the server logs a guardrail violation and attempts a single strict-prompt completion retry. If it fails a second time, it triggers a fallback. We monitor:
- **Pass rate = (1 - (guardrail_violations / total_requests))**
- A declining pass rate indicates model drift or poor instruction-following of new model updates.

### 2. Confidence Calibration Test Bounds
We test the deterministic confidence override rules by checking:
- **Baseline:** High-context note + consistent constraints → returns model's proposed confidence.
- **Thin context:** Empty path note → verifies that confidence is downgraded by one tier (e.g., `high` → `medium`).
- **Inconsistency:** risk_tolerance >= 4 + runway <= 2 months for Startup → verifies that confidence is downgraded to `low` or reduced by one tier.

### 3. Fallback Coverage Verification
To guarantee zero-failure execution:
- Under simulated network failure or LLM timeouts, the server must automatically load local generators (`generateLocalChatFallback` / `generateLocalReasoningFallback`).
- Fallbacks are validated to ensure they output structure-identical JSON containing all required properties (options, tradeoffs, branch questions), preventing client crashes.

### 4. Manual Spot-checking & Quality Benchmarks
During development, a test corpus of 25 realistic student and early-career profiles was run. The eligibility suggestions (e.g., matching a 68 percentile JEE score) were validated against official national cutoff matrices to verify the LLM's pre-trained recommendations are realistic and accurate.

