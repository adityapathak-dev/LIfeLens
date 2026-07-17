# LifeLens Product Roadmap

**Core Philosophy:** *"LifeLens helps users reason through decisions. LifeLens does not make decisions for users."*  

---

## 📅 Milestones & Feature Timeline

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Phase 1: Foundation, Auth & Security Hardening [COMPLETED]                  │
│ • Firebase Auth (Google + Email) & Document Scope Rules                    │
│ • Deterministic Guardrails Engine & Strict ATS Evaluator                   │
│ • Helm Security Headers, CORS, Dual-Layer Rate Limiting                    │
├────────────────────────────────────────────────────────────────────────────┤
│ Phase 2: Decision Journeys & Explainability Layer [COMPLETED]              │
│ • Firestore Journey Persistence & Journey Hub Dashboard                    │
│ • Side-by-Side Dossier Comparator & Diff Summary                           │
│ • Factor Attribution Drawer (Inputs, Assumptions, Gaps, Sensitivity)      │
├────────────────────────────────────────────────────────────────────────────┤
│ Phase 3: Epistemological Startup Advisor & HITL System [COMPLETED]          │
│ • 5-Part Startup Evaluation Matrix (Facts, Hypotheses, Data Gaps)          │
│ • 3-Domain Human Guidance Directory (Admissions, Career, Mentors)          │
│ • Confidence-Based & User-Requested Escalation Modal                       │
├────────────────────────────────────────────────────────────────────────────┤
│ Phase 4: Future Enhancements & Refinements [NEXT]                           │
│ • Q3 2026: Offline PDF/JSON Dossier Export Capability                      │
│ • Q3 2026: Interactive Parameter Sensitivity Slider ("What If?")           │
│ • Q4 2026: Custom User-Defined Milestone Trackers                          │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Phase 4 Detailed Specs (Near-Term Focus)

### 1. Offline Dossier Export (PDF / Markdown)
* **Goal:** Allow users to download saved Dossier Snapshots or Dossier Comparisons for offline reflection.
* **Scope:** Client-side rendering of structured markdown/PDF without sending decision data to third-party formatters.

### 2. Interactive Sensitivity Preview
* **Goal:** Allow users to tweak context parameters (e.g., runway from 3 to 6 months) in real-time within the `ExplainabilityDrawer` to preview how risks re-balance.

---

## 🚫 Explicit Out-of-Scope Directives
* **No Automated Choice Pickers:** LifeLens will never implement an "Auto-Select Best Option" algorithm.
* **No Social Voting on Decisions:** Decision-making remains private to protect user autonomy.
