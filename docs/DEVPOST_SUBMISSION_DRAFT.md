# Devpost Submission Details — LifeLens

Copy and paste the sections below directly into your Devpost submission fields. The responses are written in a clean, natural developer voice.

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

### Scope Boundaries & Non-Goals
- **Not a Therapist or Life Coach:** LifeLens is built purely for academic/career options structuring. It is not an alternative to qualified mental health counselling.
- **Not a Real-time Scraping Engine:** Projections are inferred from pre-trained world knowledge + static curated boundaries, not from live market web searches.
- **No Stored Profile Data:** To ensure absolute privacy, the system is entirely stateless; no user profiles, responses, or personal files are saved.
- **College-track Focus in V1:** While Job and Startup paths are fully functional, the deepest eligibility logic (exam verification and score bounding) is prioritized for the Graduate School path.

### Stated Assumptions
- **Target Audience:** The tool assumes users are students or early professionals (ages 18-30) facing a specific choice, not casual browsers.
- **Data Input:** It assumes users have access to their scorecards/ranks and can specify clear parameters (colleges, offers, or runway) to populate the dossier.
- **Data Currency:** It assumes pre-trained LLM context (supplemented with our static datasets) is sufficiently current for general structural guidance.

### Vivid User Scenario: Priya's Walkthrough
*   **Before LifeLens:** Priya is a 3rd-year engineering student in Bangalore with a JEE Main score of 68 percentile. She Googles "best engineering colleges in India" and gets list after list of elite IITs and NITs. Knowing her score is far below the 97-99% cutoffs for those, she panics, feels overwhelmed, and defaults to random local private colleges without understanding placements or cost.
*   **With LifeLens:** Priya enters her location (Bangalore), JEE Main score (68 percentile), B.Tech degree target, and budget preferences (self-funded). The real-time exam discovery validates her score bounds and recommends JEE Main, MHT-CET, or KCET. The Conversational Advisor asks 4 focused questions regarding relocation limits, branch priorities, and hostel fees. The resulting **Dossier** categorizes her realistic options into Dream, Target, and Safe. It flags a hidden tradeoff she overlooked (state quotas in Maharashtra could yield a better CS branch) and stamps the confidence as "medium" due to lack of a hard budget cap. She makes an informed, calm decision.

### LifeLens By the Numbers
- **3** distinct decision tracks (Graduate School, Job Offer, Startup)
- **70+** competitive entrance exams in our static discovery database
- **15+** local regional counseling bodies mapped across India, the US, and the UK
- **3** swappable LLM clients (Groq Llama 3.3, OpenAI GPT-4o-Mini, Claude 3.5 Sonnet)
- **100%** coverage using local fallback generation for all primary routes
- **3** server-side deterministic guardrails checking every response

### How we built it
*   **Frontend:** Built with **React** and **Vite** for lightning-fast loads. We designed a premium aesthetic using pure **Vanilla CSS**, integrating custom animations, theme-aware spring dropdown selectors, and auto-growing textareas.
*   **Backend:** A **Node.js** and **Express** API handles stateless session compilation, LLM system prompt wrapping, and regional counselor matching.
*   **Inference:** Powered by a swappable LLM client running **Groq (Llama 3.3 70B)** for blazing-fast inference, with fallback support for **OpenAI (GPT-4o-Mini)** and **Anthropic (Claude 3.5 Sonnet)**.
*   **Deployment:** Fully deployed on **Vercel** as a multi-service monorepo using unified service routing.
*   **Data Pipeline & Modular Boundaries:**
    - The data pipeline routes user inputs to validate score boundaries against a curated list of global exams (`examDatabase.js`). The session is then sent to the swappable LLM client (`llmClient.js`), where system instructions enforce JSON output. The response is processed through backend guardrails (`guardrails.js`) to deterministically enforce disclaimers, confidence adjustments, and recommendation prohibitions before reaching the React client.
    - Components are isolated: the UI features decoupled form elements (`CountrySelect`, `DegreeSelect`) and specialized cards (`ResumeChecker`, `IdeaMeter`), while the backend segregates tasks into modular routers (`chatRoute.js`, `reasonRoute.js`, `examDiscoveryRoute.js`).

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

*   **GitHub Repository URL:** https://github.com/adityapathak-dev/LIfeLens.git
*   **Demo URL:** *(Paste your Vercel deployment URL here)*

---

## 5. Additional AI Questions & Guardrails

### AI Tools Used
We used the Groq API running the Llama-3.3-70b-versatile model as our main inference engine because of its incredibly fast response times and generous free tier. For development flexibility, we also coded fallbacks for the OpenAI API (GPT-4o-Mini) and Anthropic API (Claude 3.5 Sonnet). On the coding side, we scaffolding the initial app structure using Claude 3.5 Sonnet, and utilized Google Antigravity to help us write the custom CSS animations, troubleshoot an Express ESM module loading issue, and wire up the Git repository settings. All API endpoints and coding aids were accessed using standard free or pro developer accounts.

### Data Sources
The application uses a mix of static data and pre-trained LLM parameters. We constructed a custom master list of international competitive entrance exams that maps specific degrees to their eligibility requirements. We also compiled a counselor database linking users in India, the US, and the UK with physical counseling hotlines and portals like iCall, the College Board, and UCAS. For university ranks, startup valuations, and career benchmarks, we leverage the LLM’s internal pre-trained world knowledge. No personal user data is collected, stored, or sent to external databases.

### AI Architecture Explanation & LLM Justification
Our architecture splits data processing between a lightweight React client and a stateless Node.js/Express server.
*   **Inputs:** The user's intake details (such as current runway, targeted degrees or jobs, location, and risk metrics) are passed to the server along with the active chat log.
*   **AI Capability:** We utilize generative LLM prompting configured to enforce strict guardrails, ensuring the AI asks only one question at a time and formats its responses in a structured JSON schema.
*   **Processing:** The backend routes these payloads to Groq or the fallback clients. If the user indicates distress or confusion, the backend automatically attaches localized counseling directories to the response.
*   **Outputs:** The client parses the JSON response to display a live chat stream, compile the interactive Decision Dossier showing tradeoffs and assumptions, or reveal counselor cards.

#### Why an LLM, not a rules-based decision tree?
A rules engine could rank options if tradeoffs were fixed and enumerable (e.g. "if savings < 6mo runway, startup = risky"). However, this problem has key properties rules engines handle poorly:
1. **Tradeoffs are highly contextual:** The same "low savings" fact has different weight to a student with no dependents vs. an early professional supporting family. Rules engines require a combinatorial rule for every interaction; an LLM reasons over the combination directly.
2. **Generative Hidden Tradeoffs:** Discovering tradeoffs the user did *not* mention requires generative reasoning about the logical empty space of their notes, which cannot be modeled by simple database lookups.
3. **Natural Language Projections:** The outcomes must be synthesized dynamically to fit the user's specific skills and goals, avoiding rigid, cookie-cutter sentence slotting.
4. **Hybrid Control Guardrails:** We combine the LLM's soft-reasoning strengths with deterministic rules (confidence modifiers, disclaimer injection, regex-based recommendation blocks) to keep output predictable.

#### Evaluation Strategy & Training Signal
To measure and maintain the system's performance, we implement a multi-layered evaluation strategy:
1. **Guardrail Pass-Rate Log:** The backend logs when a response is rejected due to recommendation language (e.g. "I recommend"). A high frequency of retries signals the prompt constraints need revision.
2. **Confidence Calibration Bounds:** We verify that the "Confidence Stamp" scales correctly: checking that thin inputs or risk/runway mismatches successfully trigger a downgraded confidence tier.
3. **Fallback Verification coverage:** The server tests 100% of routes under simulated network loss. We verify that fallback generators yield clean, structure-identical JSON for the client.
4. **Manual Spot-checking Protocol:** We ran a test suite of 25 distinct user profiles to compare the AI's eligibility suggestions against actual university entrance requirements, refining cutoffs in the system instructions.

### Human-in-the-Loop Decision
LifeLens is built on the philosophy that AI should assist thinking, not replace it. Because of this, the AI is strictly prohibited from recommending a final decision or telling the user what to choose. Instead, the final analysis leaves the choice completely open, framing options conditionally (e.g., "If your priority is financial security, Option A represents..."). The user is prompted to sit with the tradeoffs and type their ultimate choice in their own words. Choosing a career or college involves subjective, personal, and family values that an AI model cannot feel or weigh.

### Responsible AI Guardrails & Lifecycle Risks
A primary risk we identified was user over-reliance, where a student might treat the AI’s career or financial projections as absolute certainties rather than hypothetical possibilities. We mitigated this by building two direct guardrails. First, we hardcoded non-removable disclaimers into the interface explaining that the projections are possibilities, not predictions. Second, we built a dynamic "Confidence Stamp" that ranks the analysis quality (low, medium, high) based on how complete the user's input data is. If inputs are missing, the AI flags the dossier as "low confidence" and explicitly prompts the user to seek human counseling.

#### Lifecycle Risk Awareness & Mitigations
To maintain safety and quality over time, the system includes:
1. **Model Drift Monitoring:** We implement a `usageMonitor` module tracking the ratio of guardrail violations (recommendation language) over time. An upward trend signals the LLM's instruction-following quality is degrading, triggering an admin flag to tune prompts or swap providers.
2. **Misuse Pattern Tracking:** Rapid-fire requests from a single client are flagged as automated bot/scraping abuse and rate-limited. Aggregate distress signal spikes are monitored to identify if vulnerable user segments are misusing the tool as a primary crisis resource.
3. **Stale Data Warning:** Curated static datasets (`examDatabase.js`, `counselors.js`) are tagged with a `last_verified` timestamp. If data is older than 90 days, startup warning logs flag the dataset as stale to prompt manual verification of helpline numbers and eligibility rules.
