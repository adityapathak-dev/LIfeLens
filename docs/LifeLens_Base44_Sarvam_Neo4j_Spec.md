# LifeLens Specification: Re-architecting with Base44, Sarvam AI, and Neo4j

This document details the blueprint for rebuilding the **LifeLens** application using a modern Indic-first stack: **Base44** (AI No-Code App Builder), **Sarvam AI** (Indic LLM & Translation), and **Neo4j** (Graph Database). 

It is structured to be handed over directly to developers or fed as prompts into code generation tools.

---

## 1. Stack Overview & Roles

| Technology | Purpose | Role in LifeLens |
|---|---|---|
| **Base44** | Frontend & Backend Orchestration | Generates the responsive React/Vite UI pages (Decision Selector, Context Intake, Chat Interface, Dossier panels) and runs the Node.js/Express middleware routes. |
| **Sarvam AI** | Indic LLM Inference & Translation | Powers the Conversational Advisor, enabling natural multilingual dialogue (Hindi, Tamil, Telugu, Kannada, etc.) and high-performance text-to-text completions. |
| **Neo4j** | Graph Database Storage & Querying | Replaces static flat JS arrays. Models user decisions, competitive exams, salary benchmarks, colleges, and regional counselors as a connected graph of nodes and relationships. |

---

## 2. Neo4j Graph Database Schema

Instead of querying flat files, LifeLens uses a graph layout to dynamically traverse pathways, check eligibility thresholds, and recommend target alternatives.

### Graph Data Model

```
(User) -[:EVALUATING]-> (Option)
(Option) -[:REQUIRES_EXAM]-> (Exam)
(Option) -[:IN_LOCATION]-> (Location)
(Option) -[:HAS_TRADEOFF]-> (Tradeoff)
(Exam) -[:ELIGIBLE_FOR]-> (Degree)
(Location) -[:HAS_COUNSELOR]-> (Counselor)
```

### Node Types & Properties
1. **`User`**: `id`, `name`, `current_state`, `current_city`, `runway_months`, `risk_tolerance`
2. **`Option`**: `id`, `name`, `type` (College / Job / Startup), `short_term_outcome`, `long_term_outcome`, `ranking`, `base_package_or_tuition`
3. **`Exam`**: `id`, `name`, `min_val`, `max_val`, `conducting_body`
4. **`Location`**: `id`, `name`, `type` (Country / State / City)
5. **`Counselor`**: `id`, `name`, `phone`, `hours`, `website`
6. **`Tradeoff`**: `id`, `description`, `type` (financial, cultural, career)

### Core Cypher Queries for Backend Integration

#### Query 1: Discover Reachable Colleges Based on Score
Retrieve target colleges that match the user's score boundary:
```cypher
MATCH (e:Exam {id: $examId})<-[:REQUIRES_EXAM]-(o:Option {type: 'College'})-[:IN_LOCATION]->(l:Location {name: $targetCountry})
WHERE $userScore >= o.min_score_cutoff AND $userScore <= o.max_score_cutoff
RETURN o.name AS college_name, o.ranking AS rank, o.base_package_or_tuition AS cost, l.name AS country
ORDER BY o.ranking ASC
LIMIT 5
```

#### Query 2: Retrieve Location-based Counselor Hotline
```cypher
MATCH (l:Location)-[:HAS_COUNSELOR]->(c:Counselor)
WHERE l.name = $locationName OR l.id = $countryCode
RETURN c.name AS name, c.phone AS phone, c.hours AS hours, c.website AS website, c.type AS type
LIMIT 1
```

---

## 3. Sarvam AI Integration (Indic-Language Conversational Layer)

Sarvam AI endpoints power the conversational turns. To integrate, configure the completions endpoint to hit the Sarvam endpoint (e.g., `https://api.sarvam.ai/v1/chat/completions`) using their models (e.g., `sarvam-2b` or translation/speech pipelines).

### Sarvam completions configuration (`llmClient.js`)

```javascript
import fetch from "node-fetch";

export async function getSarvamChatCompletion(systemPrompt, messages) {
  const apiKey = process.env.SARVAM_API_KEY;
  const url = "https://api.sarvam.ai/v1/chat/completions";

  const payload = {
    model: "sarvam-2b-v0.5", // Indic-optimized model
    messages: [
      { role: "system", content: systemPrompt },
      ...messages
    ],
    temperature: 0.1,
    max_tokens: 1000
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Sarvam API returned error status: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
```

---

## 4. Base44 Prompt Guide (How to Build the App)

To scaffold this project using Base44, feed the prompts below in sequence.

### Prompt 1: Project Architecture Setup
> "Create a web application called 'LifeLens'. The stack should feature a React frontend styled with custom CSS and a Node.js/Express backend. Initialize a Neo4j graph database containing nodes for User, Option (College, Job, Startup), Exam, Counselor, and Location. Connect the Express server to Neo4j using the official neo4j-driver package, and configure a POST /api/chat route that connects to the Sarvam AI chat completions endpoint using a bearer token variable named SARVAM_API_KEY. Write a basic health route returning { ok: true }."

### Prompt 2: Context Intake and Dynamic Forms
> "Design a React component called ContextIntake. It must render a 3-stage form for three decision paths: Graduate School, Job Offer, and Startup. 
> 1. In the Grad School form, render location text boxes, a degree select list, a target country box, and a dynamic exam check box group. When the target country is changed, call the backend to run a Cypher query on Neo4j to find exams associated with that location.
> 2. Implement validation checks on scores so that the user cannot submit values outside the boundaries stored in the database.
> 3. Display a progress bar reflecting the percentage of filled fields. Ensure all textareas grow automatically using pure CSS."

### Prompt 3: Chat interface & Inline Dossier
> "Create a React component called ChatAdvisor that manages a multi-turn chat experience. The chat should:
> 1. Call the Express backend POST /api/chat endpoint on every message.
> 2. Ensure the chat response is typed word-by-word at a speed of 30ms.
> 3. If the chat response includes is_analysis: true, render a structured 'Dossier Block' panel inline showing the options, hidden tradeoffs, branch questions, and a confidence stamp.
> 4. If the analysis is displayed or the user types distress indicators, display a counselor card retrieved from Neo4j based on the user's location."

### Prompt 4: Startup Idea Meter
> "Create a component named IdeaMeter. It should allow startup founders to submit their startup sector and description. The backend must route this description to Sarvam AI with a brutal prompt instructing the model to critique the idea, scoring it out of 100 on market fit, defensibility, and team strength, returning the scores and a critique paragraph in a clean JSON format. Render these scores as dynamic circular progress meters."

---

## 5. Sequence Flow & Data Pipeline

```
[React Client Form] 
       │ (1. Location + Degree Selection)
       ▼
[Express Server] ──(2. Cypher Query)──► [Neo4j Graph Database]
       │                                     │ (3. Return Exams & Cutoffs)
       ├◄────────────────────────────────────┘
       ▼
[React Client Form] (4. Validate & Submit Score Context)
       │
       ▼
[Express Server] ──(5. Build System Context + History)──► [Sarvam AI Endpoint]
       │                                                      │ (6. Parse Indic/JSON)
       ├◄─────────────────────────────────────────────────────┘
       ▼
[Express Server] ──(7. Apply Confidence Override & Check Recommendations)
       │
       ▼
[React Client] ──(8. Stream Chat & Render Dossier Graph Panels)
```
