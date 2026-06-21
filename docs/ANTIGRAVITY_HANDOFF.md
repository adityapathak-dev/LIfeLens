# Antigravity Handoff — Finish & Ship "Second Brain"

Codebase: unzip `second-brain-mvp.zip` and open the `second-brain/` folder as the project root.
Provider: **OpenAI GPT** (key already added by user to `backend/.env`).

Execute the following steps in order. Stop and report back if any step fails — do not skip
ahead on a failure.

---

## Step 1 — Verify env is correctly set

Open `backend/.env`. Confirm it contains:
```
LLM_PROVIDER=openai
OPENAI_API_KEY=<the key the user already added>
OPENAI_MODEL=gpt-4o-mini
PORT=4000
```
If `LLM_PROVIDER` is missing or set to something else, set it to `openai`. Do not touch
`OPENAI_API_KEY` — assume the user has already filled it in correctly.

## Step 2 — Install and start backend

```bash
cd backend
npm install
npm start
```
Confirm it logs `Second Brain backend listening on :4000` with no errors. If `npm install` fails,
report the exact error — do not attempt unrelated fixes.

## Step 3 — Health check

```bash
curl http://localhost:4000/api/health
```
Expect `{"ok":true}`. If this fails, the server isn't running — go back to Step 2.

## Step 4 — Live reasoning test (uses real API quota — run once, read output carefully)

```bash
curl -X POST http://localhost:4000/api/reason \
  -H "Content-Type: application/json" \
  -d '{
    "paths": [
      {"label": "Grad School", "user_note": "Want to deepen ML knowledge before specializing"},
      {"label": "Job Offer", "user_note": "Steady income, decent team, mid-size company"},
      {"label": "Startup", "user_note": ""}
    ],
    "constraints": {
      "financial_runway_months": 4,
      "risk_tolerance": 4,
      "time_horizon_years": 5,
      "has_dependents": false,
      "location_flexible": true
    }
  }'
```

**Validate the JSON response against these checks — all must pass:**
- [ ] Response has `factor_extraction`, `projections`, `hidden_tradeoffs`, `branch_questions`, `disclaimer` keys
- [ ] `projections` has exactly 3 entries, one per path
- [ ] The "Startup" path's `confidence` is `"low"` or `"medium"`, NOT `"high"` (it has no user_note, so the backend guardrail in `guardrails.js` must have downgraded it — this is the responsible-AI feature working)
- [ ] No projection text contains phrases like "you should," "I recommend," "the best option" (the guardrail blocks these — if you see them, the guardrail failed and Step 9 below needs attention)
- [ ] `disclaimer` field is present and non-empty

If any check fails, read `backend/src/guardrails.js` and `backend/src/reasonRoute.js` before
changing anything — the logic is already implemented and tested; a failure here most likely means
a parsing issue with this specific model's output format, not a missing feature.

## Step 5 — Install and start frontend (new terminal, keep backend running)

```bash
cd frontend
npm install
npm run dev
```
Open the printed local URL (usually `http://localhost:5173`).

## Step 6 — Manual UI walkthrough

1. Confirm the intake form renders with three path text areas (Grad School / Job Offer / Startup)
   and the constraint fields (runway, risk tolerance, time horizon, dependents, location).
2. Fill in the same test data as Step 4, click "Open the case."
3. Confirm three result columns render with outcome blocks, a risk block, and a confidence stamp
   per path.
4. Confirm the "Hidden tradeoffs you didn't mention" box appears below the columns.
5. Click one of the dashed "↻" branch question buttons under any path. Confirm it re-runs and
   updates the results, and that a "← back to original case" button appears.
6. Scroll to "Your next step," type a sentence, click "Record my decision." Confirm the
   confirmation message appears.

**If any of these fail, check the browser console first** — most likely cause is the Vite proxy
in `frontend/vite.config.js` not pointing to the right backend port, or the backend not running.

## Step 7 — Mobile/responsive check

Resize browser to ~380px width or use devtools device mode. Confirm the three-column layout
collapses to a single column (this is handled by the `@media (max-width: 880px)` rule in
`styles.css` — should work automatically, just verify visually).

## Step 8 — Fill in Devpost draft placeholders

Open `docs/DEVPOST_SUBMISSION_DRAFT.md`. Find and replace every `[bracketed placeholder]`:
- Confirm OpenAI model used and whether on free trial credit or paid
- Describe what Antigravity specifically did in the build (this step, verification, any bug
  fixes made) — for the "Tools Used" disclosure field, be accurate, not generous

## Step 9 — If a guardrail check failed in Step 4

Only do this if Step 4 actually failed. The retry logic in `reasonRoute.js` already attempts one
stricter regeneration automatically. If it's still failing:
1. Read `backend/src/system_prompt.txt` — the no-recommendation rule is stated there
2. Check whether GPT-4o-mini's response format matches the expected schema in
   `docs/REASONING_CHAIN_SPEC.md` exactly — field names are case-sensitive
3. Do not weaken the guardrail to make it pass. If the model's output format needs adjusting,
   adjust the parsing in `reasonRoute.js`'s `safeParseJSON`, not the safety check itself.

## Step 10 — Report status

Summarize: which steps passed, which failed, what was changed (if anything), and whether the app
is ready for the pitch video recording. Do not silently fix and move on without reporting changes
made to guardrails, prompts, or schema — those are judged deliverables, not just code.

---

## Things NOT to do
- Do not add a recommendation/ranking feature, even if it seems like it would "help" — it is
  explicitly forbidden by the brief's human-in-the-loop requirement.
- Do not remove or weaken the confidence-downgrade or recommendation-language guardrails to make
  tests pass faster.
- Do not switch `LLM_PROVIDER` away from `openai` without telling the user first.
- Do not commit `.env` (it contains the real API key) — confirm `.gitignore` excludes it if a git
  repo is initialized.
