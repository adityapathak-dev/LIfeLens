# Devpost Submission Details — LifeLens

Copy and paste the sections below directly into your Devpost submission fields:

---

## 1. Project Header Info

*   **Project Name:** LifeLens
*   **Tagline:** An interactive, conversational life-decision advisor that structures complex choices so that the human decision remains fully informed.

---

## 2. About the Project (Project Story)

### Inspiration
Choosing a graduate program, evaluating a startup idea, or deciding between competing job offers are some of the most high-stakes, stressful decisions students and early-career professionals make. Today’s internet is filled with immediate, generic lists of pros and cons, which often increase anxiety rather than offering clarity. 

We were inspired to build **LifeLens**—a tool that does not tell you *what* to choose, but instead acts as a structured mirror. By asking one thoughtful question at a time and mapping your answers into an objective, data-driven Dossier, LifeLens makes the underlying trade-offs of your choices visible, preserving your agency.

### What it does
LifeLens takes the user through a clean, 3-phase guided discovery flow:
1.  **Decision Selector:** Choose between three major paths: Graduate School, Job Offer, or Startup.
2.  **Context-Specific Intake:** A dynamic form with staggered animations, interactive progress tracking, and custom dropdowns captures key location, career, and financial parameters.
3.  **Conversational Advisor & Dossier:** An interactive chat session (powered by AI) explores your choices, asking exactly one question at a time. After approximately 4 turns, the AI compiles a structured **Dossier** inline, detailing short/long-term projections, hidden tradeoffs, branch questions, and a confidence rating.

If the advisor detects distress or if you remain deeply confused, it triggers a **Responsible AI Counselor Card**, connecting you directly with real-world human counseling (UCAS in the UK, College Board in the US, iCall in India) based on your location.

### How we built it
*   **Frontend:** Built with **React** and **Vite** for lightning-fast loads. We designed a premium aesthetic using pure **Vanilla CSS**, integrating custom animations, theme-aware spring dropdown selectors, and auto-growing textareas.
*   **Backend:** A **Node.js** and **Express** API handles stateless session compilation, LLM system prompt wrapping, and regional counselor matching.
*   **Inference:** Powered by a swappable LLM client running **Groq (Llama 3.3 70B)** for blazing-fast inference, with fallback support for **OpenAI (GPT-4o-Mini)** and **Anthropic (Claude 3.5 Sonnet)**.
*   **Deployment:** Fully deployed on **Vercel** as a multi-service monorepo using unified service routing.

### Challenges we faced
*   **Stateless Chat Integrity:** Implementing multi-turn JSON-structured conversational steps in a stateless REST API required carefully bootstrapping the intake parameters into the hidden message history on each call.
*   **Sibling Stacking Contexts:** Handling absolute dropdown overlays in a highly animated form created z-index clipping issues. We resolved this by elevating parent focus contexts (`:focus-within` and `:has(.open)`) dynamically.
*   **Regional Dynamic Lookup:** Implementing country-sensitive placeholder text and preserving the full master competitive exam database (marking degree matches as "Best Match" without hiding other options) required designing custom React filtering logic.

### What we learned
We learned how to design human-in-the-loop AI applications that prioritize user agency rather than generating decisions for them. We also gained deep experience configuring polyglot/multi-service monorepos on Vercel using `vercel.json` routing.

### What's next for LifeLens
We plan to integrate live salary benchmarking APIs, expand real-time college database integrations, and partner with university wellness centers to directly embed human advisor bookings inside the counselor fallback system.

---

## 3. Built With

`React.js`, `Vite`, `Node.js`, `Express.js`, `Groq API`, `Llama-3.3-70b-versatile`, `OpenAI API`, `GPT-4o-Mini`, `Claude-3.5-Sonnet`, `Vercel`, `Vanilla CSS`, `Git`, `Mermaid.js`

---

## 4. "Try it out" Links

*   **GitHub Repository:** https://github.com/adityapathak-dev/LIfeLens.git
*   **Demo URL:** *(Paste your Vercel deployment URL here)*
