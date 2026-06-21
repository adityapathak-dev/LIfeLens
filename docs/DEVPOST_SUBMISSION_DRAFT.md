# Devpost Submission — Drafted Fields

## Project Description

**Second Brain** is a conversational decision-reasoning advisor for students and early professionals weighing major life paths — specifically Graduate School selection, Job Offers, and Startup decisions. 

Unlike traditional platforms that immediately dump lists of pros and cons, Second Brain takes the user through a structured **three-phase guided discovery**:
1. **Decision Selector:** The user selects their specific situation (Grad School, Job, or Startup).
2. **Context-Specific Intake:** A dynamic form captures essential background parameters (location, runway, potential options, risk tolerance, etc.).
3. **Conversational Advisor & Dossier:** An interactive chat session where the AI acts as a dedicated advisor (Academic, Career, or Startup Advisor). The advisor asks one question at a time to explore details (reputation, location, lifestyle, post-grad visa rules). After approximately 4 turns, the AI synthesizes a structured **Dossier/Analysis** inline, showing short-term and long-term projections, risk assessments, assumptions, and confidence ratings.

If the user is still confused or distressed, the tool connects them directly to localized, real-world counselors (such as iCall in India, UCAS in the UK, and College Board in the US) based on their country.

The tool never tells the user what to choose; it makes the underlying structure of the decision visible so that the human choice remains fully informed.

---

## AI Architecture Explanation

### 1. Inputs
- **Phase 1 Select:** Captures the category of the decision (`grad_school`, `job`, or `startup`).
- **Phase 2 Context Intake:** Custom form fields tailored to the decision type:
  - *Grad School:* Country, stream/program, colleges list, financial situation, runway (months), location flexibility.
  - *Job Offer:* Country/city, role/title, companies/offers, current situation, runway (months), dependents.
  - *Startup:* Country/market, startup description, user's role, funding stage, runway (months), risk tolerance (1–5).
- **Phase 3 Chat:** The intake form details are formatted into an invisible context bootstrap message. Subsequent inputs are standard conversational text responses from the user.

### 2. AI Capability Used & Prompts
- We utilize a swappable LLM client running **Groq** (`llama-3.3-70b-versatile`) as the primary inference provider (with OpenAI `gpt-4o-mini` and Anthropic `claude-sonnet-4-6` fallback integrations).
- The system prompt dictates strict behavioral guardrails:
  - Maintain a supportive, objective, and warm tone.
  - Guide the user by asking **exactly one focused question** per message.
  - Evaluate options honestly using embedded world knowledge (e.g. university rankings, industry compensation standards, startup success probabilities).
  - Enforce a **no-recommendation guardrail** (refrain from directing the user on what choice to make).
  - Format every reply as a strict, single JSON object containing: `message`, `is_analysis` (boolean), `analysis` (the final dossier JSON schema once 4 turns are complete), and `offer_counselor` (boolean).

### 3. Processing
- The Node/Express backend provides a stateless `/api/chat` route. The client sends the full conversation history to the backend on each turn.
- The backend passes the messages list and the matching system prompt to the LLM.
- The backend parses the LLM's response. If the LLM generates markdown fences or text wrappers, a robust parser sanitizes it.
- If the response includes `is_analysis: true` or `offer_counselor: true`, the backend automatically resolves and appends counselor reference details based on the user's input country.

### 4. Outputs
- **Interactive Chat Log:** Renders a clean chat interface with typing animation indicators.
- **Dossier Card:** If `is_analysis` is true, an inline dossier is revealed inside the assistant's final response:
  - *Summary:* A concise overview of the student's primary friction points.
  - *Options Breakdown:* Columns listing short-term outcomes, long-term projections, key risks, assumptions, confidence stamps, and advisor reputation notes.
  - *Hidden Tradeoffs:* Unmentioned considerations that the user should factor in.
  - *Branch Questions:* Core "what if" prompts worth sitting with.
- **Counselor Card:** Renders contact information (name, phone, hours, website, type) of a professional counseling service corresponding to the user's location.

---

## Human-in-the-Loop Design

- **The decision the AI does not make:** The system prompt explicitly forbids recommendation language (e.g., "you should choose," "I recommend," "the best option is"). Projections use conditional framing: *"If your priority is X, Option A tends to offer..."*
- **Counselor fallback:** Generative AI is excellent for structuring thoughts, but it is not a therapist or a professional mental health counselor. If the AI detects distress or if the user is still confused after the analysis, the app surfaces a direct link and phone line to a real human academic/career counselor in their country.
- **Final Decision Reflection:** The user is prompted at the end to write down their final thoughts in their own words. The output of the advisor is an aid to clarity, not a final choice generator.

---

## Responsible AI Guardrails & Mitigations

1. **Confidence Downgrading:** The confidence stamp (`low`, `medium`, `high`) is calculated by the advisor model based on input completeness. If details are missing, the confidence is set to `low`.
2. **Fixed Code-Enforced Disclaimers:** Disclaimers warning that the projections are structured possibilities (not predictions) are hardcoded into the frontend and backend, preventing the LLM from omitting them.
3. **Counselor Hand-off:** Automatically triggers when the student expresses feeling overwhelmed or distressed, connecting them to actual human support lines (e.g., iCall in India, UCAS in the UK, College Board in the US).

---

## Data Disclosure

- Second Brain does not store, log, or reuse user data. Inputs are processed live during the single session and discarded. No user-identifying data is transmitted.

---

## Tools Used

- **Inference Models:** Groq (`llama-3.3-70b-versatile`), OpenAI (`gpt-4o-mini`), and Anthropic (`claude-sonnet-4-6`). Groq is the active provider for the demo environment.
- **Frontend Stack:** React + Vite, styled using premium Vanilla CSS featuring fluid grids, dark mode glassmorphism variables, and keyframe bounce animations.
- **Backend Stack:** Node.js + Express.
- **AI Coding Assistance:** Scaffolding done with Claude (Anthropic). Google Antigravity was utilized for final handoff, environment variable troubleshooting (diagnosing an ESM module loading order issue with `dotenv`), adding multi-turn stateless chat endpoints, creating the counselor lookup module, and implementing the multi-step React frontend app flow.
