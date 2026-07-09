# LifeLens — Conversational Life Decision Advisor

> **Structuring complex choices so that the human decision remains fully informed.**

**LifeLens** (formerly *Second Brain*) is a conversational decision-reasoning advisor built for students and early professionals weighing major life paths. Instead of immediately dumping simplistic pros and cons, LifeLens guides users through an interactive, multi-turn exploration of critical details (prestige, financial runway, lifestyle preferences, post-grad visa regulations) before synthesising a structured **Dossier/Analysis** inline and connecting them with professional counselors.

It offers dedicated paths for three major decision categories:
*   🎓 **Graduate School** (University shortlists, degree goals, financial runway)
*   💼 **Job Offer** (Role evaluations, compensation packaging, skills matching)
*   🚀 **Startup** (Idea viability checks, sector analysis, risk tolerance)

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client [React Frontend + Vite]
        A[Decision Selector] --> B[Dynamic Context Intake]
        B -->|Staggered Load & Progress Bar| C[Interactive Chat Interface]
        C -->|Dossier Display| D[Structured Analysis Dossier]
        C -->|Distress Detection| E[Counselor Handoff Card]
    end

    subgraph Server [Node.js + Express]
        F[stateless /api/chat Route]
        G[Real-time Exam Discovery /api/exams]
        H[Idea Meter /api/idea-meter]
        I[Resume ATS Evaluator /api/resume]
    end

    subgraph LLM_Client [Swappable Inference Clients]
        J[Groq Llama 3.3 70B]
        K[OpenAI GPT-4o-Mini]
        L[Anthropic Claude 3.5 Sonnet]
    end

    Client -->|User Context + Chat History| Server
    Server -->|Context Bootstrap + Guardrails| LLM_Client
    LLM_Client -->|Structured JSON Response| Server
    Server -->|Sanitized JSON Response| Client
```

---

## ✨ Key Features

### 1. Merged Premium UI/UX
*   **Staggered Entrance Animations:** Inputs slide up with staggered fade-in sequences on mount for a fluid user experience.
*   **Dynamic Progress Tracking:** Sequential progress bars show filled/total inputs specific to the active decision path in real-time.
*   **Auto-Growing Textareas:** Text areas (Colleges, Companies, Description, and Skills) grow dynamically to fit text, eliminating scrollbars.
*   **Theme-Aware Custom Selects:** Dropdowns are backed by custom React select elements with smooth spring popovers and click-outside close handlers.

### 2. Intelligent Data Validations
*   **Real-time Exam Discovery:** Dynamic lookup based on selected country and target degree (e.g., matching JEE/BITSAT for B.Tech in India, SAT/GRE in the USA).
*   **Score Bounds Validation:** Sanitizes scores/ranks and displays instant feedback if scores are out of bounds.
*   **Preserved Master Exam Database:** Degree selection recommends specific exams (flagging them as "Best Match") without hiding others.

### 3. Human-in-the-Loop & Safety Guardrails
*   **No-Recommendation Guardrail:** The AI is strictly barred from telling you what to choose; it makes the tradeoffs visible using conditional framing.
*   **Distress Handoff:** Instantly connects the user to professional, localized academic or career counselors (UCAS in the UK, College Board in the US, iCall in India).
*   **Confidence Stamp:** Downgrades the analysis rating (`low`/`medium`/`high`) if crucial details are left empty.

---

## 🎯 Scope Boundaries & Assumptions

### Scope Boundaries & Non-Goals
- **Not a Therapist/Crisis Center:** Built for career/academic choice-structuring only. Real-world counseling referrals are hardcoded bypass mechanisms.
- **Not a Live Scraping Engine:** Projections leverage LLM pre-trained context + our static curated datasets rather than real-time web-scraping APIs.
- **Strict Privacy Model:** The service is completely stateless; no user data, uploads, or logs are stored in databases.
- **College-track Priority in V1:** Deeper validations (bounds checking, course-to-exam mapping) are prioritized for the Graduate School path.

### Key Stated Assumptions
- **Target User:** Early-career professionals & students (ages 18-30) facing a specific decision.
- **Availability of Info:** Users have access to their credentials/scores and can specify competing offers or target colleges.
- **LLM Context Currency:** Pre-trained world knowledge of LLMs is relied upon for general market projections (disclosed clearly).

---

## 🔀 Data Pipeline & Sources

### Architecture Flow

```mermaid
flowchart TD
    A[User Intake Input] --> B[examDiscoveryRoute.js]
    B -->|Check Score Bounds| C[examDatabase.js Curated Database]
    A -->|Submit Form Context| D[stateless chatRoute.js / reasonRoute.js]
    D -->|Context Bootstrapping| E[llmClient.js Swappable Client]
    E -->|JSON Prompt Constraints| F[LLM Inference Groq/OpenAI/Anthropic]
    F -->|Return Structured JSON| G[guardrails.js Validation Pipeline]
    G -->|Confidence Override & Disclaimer Check| H[Client Side React App]
    H -->|Render Dossier UI / Counselor Referral| I[User Interface]
```

### Curated Reference Databases Used
- **`examDatabase.js`** (Curated static dataset): Links over 70 global entrance exams (JEE, SAT, GRE, MCAT, etc.) to target degrees, conducting bodies, and exact score bounds.
- **`counselors.js`** (Curated static directory): Maps user locations (cities in India, states in US, national bodies in UK) to physical counseling hotlines.
- **`investors.js`** (Curated static directory): Maps startup categories to relevant venture capitals and accelerator hubs.

---

## 🧩 Modular Component Boundaries

To ensure clean development separation and ease of maintenance, the monorepo is split into decoupled components:

### Frontend (React + Vite)
- **`DecisionSelector.jsx`**: Core landing page pathway selection card router.
- **`ContextIntake.jsx`**: Dynamic multi-stage context collector featuring progress bars and custom select controls.
- **`ChatAdvisor.jsx`**: Multi-turn chat interface coordinating text streaming and Dossier panel rendering.
- **`ResumeChecker.jsx` & `IdeaMeter.jsx`**: Isolated auxiliary feature cards that leverage standalone backend routes.

### Backend (Node + Express)
- **`server.js`**: Application entry point registering middleware (rate-limiting/abuse tracking) and routers.
- **`usageMonitor.js`**: In-memory logger tracking active requests, abuse states, model drift ratios, and data verification limits.
- **`chatRoute.js` & `reasonRoute.js`**: Handlers managing stateless conversation building and guardrail integration.
- **`guardrails.js`**: Regex compiler blocking recommendation terms, performing confidence overrides, and injecting disclaimers.
- **`llmClient.js`**: Decoupled multi-provider API coordinator with instant fallback capability.

---

## 📂 Project Structure

```bash
├── backend/
│   ├── src/
│   │   ├── chatPrompts.js      # System instructions for each decision path
│   │   ├── chatRoute.js        # Stateless Express chat endpoint
│   │   ├── counselors.js       # Country-to-counselor lookup directory
│   │   ├── examDatabase.js     # Master competitive exam dataset
│   │   ├── examDiscoveryRoute.js # Real-time exam lookup & recommendation logic
│   │   ├── llmClient.js        # Swappable LLM clients (Groq/OpenAI/Anthropic)
│   │   └── server.js           # Server initializer (Runs on port 4000)
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main React entry point
│   │   ├── ChatAdvisor.jsx     # Multi-turn chat & dossier interface
│   │   ├── ContextIntake.jsx   # Staggered intake forms & progress bars
│   │   ├── CountrySelect.jsx   # Custom country autocomplete dropdown
│   │   ├── DegreeSelect.jsx    # Custom degree selector component
│   │   ├── ResumeChecker.jsx   # AI Resume ATS evaluation card
│   │   ├── IdeaMeter.jsx       # Interactive AI Startup idea validator
│   │   └── styles.css          # Premium design system & CSS rules
└── docs/                       # Technical specs & handoff documentation
```

---

## 🚀 Running the Application Locally

### 1. Run the Backend Server
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   *Open `.env` and fill in your API key (`GROQ_API_KEY` is highly recommended and pre-configured for free-tier Llama 3.3 inference).*
4. Start the server:
   ```bash
   npm start
   ```
   *The backend will run on `http://localhost:4000`.*

### 2. Run the Frontend Development Server
1. Navigate to the `frontend/` directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Launch the development server:
   ```bash
   npm run dev
   ```
   *The client will start on `http://localhost:5173` and proxy request endpoints to the Node backend.*
