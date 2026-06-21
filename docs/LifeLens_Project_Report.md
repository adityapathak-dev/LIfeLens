# Project Report: LifeLens — Conversational Decision Advisor

---

## 1. Executive Summary
**LifeLens** is a conversational decision-reasoning engine designed to help students and early-career professionals navigate high-stakes choices, specifically Graduate School applications, Job Offer evaluations, and Startup viability checks. 

Rather than generating automated "answers" or directing the user on what path to follow, LifeLens structures the decision-making process. It guides users through context-sensitive data capture, conducts a targeted multi-turn AI consultation, compiles an objective Decision Dossier outlining tradeoffs, and connects the user with real-world human counseling resources when distress is detected.

---

## 2. Problem Statement
Making high-stakes life decisions (e.g., choosing a university program, accepting a job offer, or founding a startup) is increasingly stressful. Existing resources generally fail in two areas:
1.  **Generic Advice:** Search results and simple chat tools return list-based pros and cons that ignore the user's specific financial runway, risk tolerance, and geographical realities.
2.  **Over-Delegation of Agency:** Recommender systems tell the user *what* to choose, which erodes personal agency and creates over-reliance on automated systems for subjective life events.

---

## 3. The LifeLens Solution
LifeLens addresses these gaps with a structured, three-phase guided discovery flow:
*   **Context-Sensitive Intake:** A dynamic intake form that validates parameters (like exam scores, geographical regions, and savings buffers) and displays real-time progress.
*   **Objective Chat Consultation:** A conversational loop that queries specific points (prestige, cost of living, visa regulations) one question at a time.
*   **The Decision Dossier:** A compiled structured table outlining short/long-term projections, hidden tradeoffs, branch questions, and a confidence rating.

---

## 4. Technical Architecture
LifeLens is designed as a lightweight, stateless multi-service monorepo:
*   **Frontend:** React, Vite, and Vanilla CSS with custom animations, custom dropdown selectors, and auto-growing textareas.
*   **Backend:** Node.js, Express, and a custom swappable LLM client supporting Groq (Llama 3.3 70B), OpenAI (GPT-4o-Mini), and Anthropic (Claude 3.5 Sonnet).
*   **Routing:** Unified routing configured via `vercel.json` to handle relative path routing `/api/*` on Vercel.

---

## 5. Responsible AI & Safety Guardrails
*   **No-Recommendation Guardrail:** The system prompt explicitly forbids recommendations (e.g., "I recommend Option A"). Projections use conditional framing.
*   **Confidence Stamp:** Calculates a rating (low, medium, high) based on input data completeness, warning users when conclusions are drawn from sparse inputs.
*   **Counselor Handoff:** Instantly displays contact details for local human counselors (UCAS in the UK, College Board in the US, iCall in India) when user distress is detected.
