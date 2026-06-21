# Second Brain — Conversational Life Decision Advisor

Second Brain is a conversational decision-reasoning advisor for students and early professionals weighing major life paths — specifically Graduate School selection, Job Offers, and Startup decisions. It guides users through an interactive, multi-turn exploration of details (reputation, location, lifestyle, post-grad visa rules), before outputting a structured Dossier of short/long term outcomes, risks, assumptions, and connecting them to professional counselors.

## Run the Application

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env and configure your keys (Groq is recommended & configured for free-tier usage)
npm start
```
Runs on `http://localhost:4000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173` (or `5174`), proxies `/api` requests to the backend.

---

## Code Architecture & Key Files

- **`backend/src/chatPrompts.js`** — System prompts for each decision category (`grad_school`, `job`, `startup`). Dictates the conversation approach (one question at a time) and the strict output JSON schema.
- **`backend/src/chatRoute.js`** — The stateless `/api/chat` Express route. Handles chat state, executes LLM calls, parses JSON responses, and attaches localized counselor contact details.
- **`backend/src/counselors.js`** — Country-to-counselor lookup mapping (e.g. iCall for India/defaults, UCAS for the UK, College Board for the US).
- **`backend/src/llmClient.js`** — Swappable LLM wrapper client supporting Groq, OpenAI, and Anthropic providers.
- **`frontend/src/App.jsx`** — Main React entry point coordinating the 3-phase flow (`select` → `intake` → `chat`).
- **`frontend/src/ChatAdvisor.jsx`** — Conversational chat interface displaying interactive message logs, inline Dossiers, and counselor reference cards.
- **`frontend/src/ContextIntake.jsx`** — Dynamic form capturing customized context depending on the selected decision type.
- **`frontend/src/styles.css`** — Premium styling with responsive layouts, interactive elements, custom card animations, and typing bubbles.
- **`docs/DEVPOST_SUBMISSION_DRAFT.md`** — Completed field templates for the final Hackathon submission.

---

## Quick API Test (Using curl)

You can verify the backend API is working directly from the command line:

```bash
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "decision_type": "grad_school",
    "history": [
      {
        "role": "user",
        "content": "I am trying to decide on graduate school.\nCountry: India\nStream / Program: Computer Science\nColleges I am considering: IIT Bombay, BITS Pilani\nFinancial situation: student-loan"
      }
    ],
    "country": "India"
  }'
```
Expect a JSON response containing the initial advisor conversational message:
`{"message": "...", "is_analysis": false, "analysis": null, "offer_counselor": false, "counselor": null}`
