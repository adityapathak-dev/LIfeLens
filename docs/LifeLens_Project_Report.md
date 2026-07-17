# Project Report: LifeLens — Conversational Decision Advisor

---

## 1. Executive Summary
**LifeLens** is a conversational decision-reasoning engine designed to help students and early-career professionals navigate high-stakes choices, specifically Graduate School applications, Job Offer evaluations, and Startup viability checks. 

Rather than generating automated "answers" or directing the user on what path to follow, LifeLens structures the decision-making process. It guides users through context-sensitive data capture, conducts a targeted multi-turn AI consultation, compiles an objective Decision Dossier outlining tradeoffs, and connects the user with real-world human counseling resources when distress is detected.

The project has been fortified with Firebase Authentication, Sarvam AI Indic language support, a strict ATS resume checker, and robust cybersecurity defenses (Helmet, rate-limiting, and input sanitization).

---

## 2. Problem Statement
Making high-stakes life decisions (e.g., choosing a university program, accepting a job offer, or founding a startup) is increasingly stressful. Existing resources generally fail in two areas:
1.  **Generic Advice:** Search results and simple chat tools return list-based pros and cons that ignore the user's specific financial runway, risk tolerance, and geographical realities.
2.  **Over-Delegation of Agency:** Recommender systems tell the user *what* to choose, which erodes personal agency and creates over-reliance on automated systems for subjective life events.

---

## 3. The LifeLens Decision Tracks & Flow

LifeLens addresses these gaps with a structured, three-phase guided discovery flow:

### 🎓 Graduate School Advisor & Exam Discovery
*   **Context Intake:** Collects targeted degrees, countries, and competitive scores (JEE, SAT, GRE, BITSAT, IELTS, TOEFL).
*   **Static & Dynamic Validation:** Enforces score range validation (bounds checking) and pulls country-specific eligibility cutoffs.
*   **Exam Recommendation:** Recommends specific exams (flagging "Best Match") depending on the target degree stream.

### 💼 Job Offer Evaluator & Strict ATS Resume Checker
*   **Document Parsing:** Parses resumes in PDF, DOCX, and TXT formats directly in-memory (no disk writes) via `pdf-parse` and `mammoth`.
*   **Honest ATS Grading:** Evaluates resumes strictly without grade inflation (penalizing basic template projects, enforcing metric quantification).
*   **Job Matches & Salary Benchmarks:** Recommends real-world entry roles with salary structures presented in Lakhs Per Annum (LPA) for Indian candidates or international formats, accompanied by a 3-6 month upskilling roadmap.

### 🚀 Startup Advisor & Idea Meter
*   **Idea Meter Checks:** Evaluates startup ideas on total addressable market (TAM), feasibility, defensibility, unit economics, and tech complexity.
*   **Fly/Flop/Risky Verdicts:** Scores ideas strictly (0-100) and prints a blunt VC-style memo review.
*   **Investor Matchmaking:** Automatically suggests relevant venture capitalists and accelerator programs (Blume, Surge, Y Combinator) based on the startup's field.

### 💬 Conversational Advisor & Decision Dossier
*   **Multi-Turn Consult:** Guides the user through a 3-to-4 turn dialogue focusing on relocation limits, financial buffers, and lifestyle goals.
*   **The Decision Dossier:** Compiles short/long-term projections, hidden tradeoffs, branch questions, and a confidence rating.

---

## 4. Technical Architecture & Tech Stack

LifeLens is built as a lightweight, secure, stateless multi-service monorepo:

*   **Frontend:** React, Vite, and Vanilla CSS. Implements theme-aware spring dropdown selectors, dynamic progress bars, and auto-growing textareas.
*   **Backend:** Node.js and Express. Handles REST endpoints, request validations, and prompt compiling.
*   **Authentication & Session Memory:** Firebase Auth (Google Sign-In + Email/Password) gates the main intake interface, keeping users connected securely. Client-side state managers preserve the active user's conversation session history and details, passing them back to the backend endpoints on each turn so that the AI maintains consistent memory of who they are, their score cutoffs, and target pathways.
*   **Structured Reference Backing:** Uses structured curated datasets (`examDatabase.js`, `counselors.js`, `investors.js`) that map over 70 global exams, VC target fields, and regional helpline connections (e.g. iCall in India, UCAS in the UK, College Board in the US) depending on the candidate's active parameters.
*   **AI Models & Providers:** Features a swappable client (`llmClient.js`) supporting **OpenAI (GPT-4o-Mini)**, **Groq (Llama 3.3 70B)**, and **Anthropic (Claude 3.5 Sonnet)**. Implements automatic timeout handling (12 seconds) and resilient provider fallbacks.
*   **Indic Language Support:** Integrated **Sarvam AI (`sarvam-2b-v0.5` completions)** to allow natural conversations and translations in Indian languages like Hindi, Telugu, Tamil, Marathi, and Kannada.

---

## 5. Security & Hardening Safeguards
The backend has been hardened against OWASP Top 10 vulnerabilities:
*   **Secure Headers:** Managed via `helmet` to set strict Content Security Policies and frame-loading rules.
*   **Traffic Protections:** Dual-layer rate limiting limits global requests (200 / 15 mins) and downstream LLM operations (15 / minute).
*   **Input Sanitization:** Strips control characters and enforces character-length limits (100–2000 characters) across all input streams.
*   **MIME Protection:** Restricts file uploads strictly to validated file extensions (.pdf, .txt, .docx) to prevent arbitrary binary code execution.
*   **Safe Errors:** Silences development stack traces in production to prevent system directory leakage.

---

## 6. Responsible AI & Safety Guardrails
*   **No-Recommendation Guardrail:** The system prompt explicitly forbids recommendations (e.g., "I recommend Option A"). Projections use conditional framing.
*   **Confidence Stamp:** Calculates a rating (low, medium, high) based on input data completeness, warning users when conclusions are drawn from sparse inputs.
*   **Counselor Handoff:** Instantly displays contact details for local human counselors (UCAS in the UK, College Board in the US, iCall in India) when user distress is detected.
