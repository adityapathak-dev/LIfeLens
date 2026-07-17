import React from "react";
import ConfidenceStamp from "./ConfidenceStamp.jsx";
import ExplainabilityDrawer from "./ExplainabilityDrawer.jsx";

export default function StartupAssessmentView({ analysis }) {
  if (!analysis) return null;

  const {
    summary = "",
    verified_observations = [],
    explicit_assumptions = [],
    critical_unknowns = [],
    options = [],
    hidden_tradeoffs = [],
    branch_questions = [],
    investors = [],
    disclaimer = ""
  } = analysis;

  return (
    <div className="startup-assessment-view">
      {/* ── HEADER DISCLAIMER ────────────────────────────────────────── */}
      <div className="startup-banner-guarantee">
        <span>🛡️ <strong>Non-Speculative Startup Assessment:</strong> LifeLens evaluates structural risk and assumptions. We never predict success or guarantee market outcomes.</span>
      </div>

      {summary && <p className="analysis-summary">{summary}</p>}

      {/* ── 5-PART EPISTEMOLOGICAL DIAGNOSTIC GRID ────────────────────── */}
      <div className="startup-diagnostic-grid">

        {/* 1. VERIFIED OBSERVATIONS */}
        <div className="diagnostic-card verified">
          <div className="card-tag">📌 VERIFIED OBSERVATIONS (Facts)</div>
          <p className="card-subtext">Direct inputs & verified structural facts from intake/chat:</p>
          {verified_observations.length > 0 ? (
            <ul>
              {verified_observations.map((fact, i) => (
                <li key={i}>{fact}</li>
              ))}
            </ul>
          ) : (
            <p className="fallback-note">Based on self-reported savings runway and team profile.</p>
          )}
        </div>

        {/* 2. EXPLICIT ASSUMPTIONS */}
        <div className="diagnostic-card assumptions">
          <div className="card-tag">🛠️ EXPLICIT ASSUMPTIONS (Hypotheses)</div>
          <p className="card-subtext">Unverified operational models requiring validation:</p>
          {explicit_assumptions.length > 0 ? (
            <ul>
              {explicit_assumptions.map((hyp, i) => (
                <li key={i}>{hyp}</li>
              ))}
            </ul>
          ) : (
            <p className="fallback-note">Assumes founder execution without external hiring.</p>
          )}
        </div>

        {/* 3. CRITICAL UNKNOWNS */}
        <div className="diagnostic-card unknowns">
          <div className="card-tag">❓ CRITICAL UNKNOWNS (Data Gaps)</div>
          <p className="card-subtext">Missing metrics required to evaluate precision:</p>
          {critical_unknowns.length > 0 ? (
            <ul>
              {critical_unknowns.map((gap, i) => (
                <li key={i}>{gap}</li>
              ))}
            </ul>
          ) : (
            <p className="fallback-note">Customer lifetime value (LTV) and churn unmeasured.</p>
          )}
        </div>

      </div>

      {/* ── 4. STRATEGIC PATHWAYS & RISK PROFILES ────────────────────── */}
      <div className="analysis-options">
        <h4 className="options-title">⚖️ Strategic Pathways & Risk Profiles</h4>
        {options.map((opt, i) => (
          <div key={i} className="analysis-option">
            <div className="analysis-option__header">
              <span className="analysis-option__label">{opt.label}</span>
              <ConfidenceStamp level={opt.confidence} />
            </div>
            {opt.college_note && (
              <p className="analysis-college-note">📌 {opt.college_note}</p>
            )}
            <div className="outcome-row">
              <span className="outcome-row__label">Short-term (1–2 yr):</span>
              <p className="outcome-row__text">{opt.short_term}</p>
            </div>
            <div className="outcome-row">
              <span className="outcome-row__label">Long-term (5 yr):</span>
              <p className="outcome-row__text">{opt.long_term}</p>
            </div>
            <div className="outcome-row risk">
              <span className="outcome-row__label">Key Risk:</span>
              <p className="outcome-row__text">{opt.key_risk}</p>
            </div>
            <div className="outcome-row">
              <span className="outcome-row__label">Key Assumption:</span>
              <p className="outcome-row__text">{opt.key_assumption}</p>
            </div>
            <ExplainabilityDrawer explainability={opt.explainability} title={`Factor Attribution (${opt.label})`} />
          </div>
        ))}
      </div>

      {/* ── HIDDEN TRADEOFFS & BRANCH QUESTIONS ───────────────────────── */}
      {hidden_tradeoffs.length > 0 && (
        <div className="analysis-section">
          <h4 className="analysis-section__title">Unconsidered Trade-offs</h4>
          <ul>
            {hidden_tradeoffs.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      {branch_questions.length > 0 && (
        <div className="analysis-section">
          <h4 className="analysis-section__title">Strategic Questions to Resolve</h4>
          <ul className="branch-list">
            {branch_questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── INVESTORS DIRECTORY ──────────────────────────────────────── */}
      {investors.length > 0 && (
        <div className="analysis-investors">
          <h4 className="analysis-investors__title">🤝 Relevant Sector Investors & Accelerators</h4>
          <div className="analysis-investors__list">
            {investors.map((inv, i) => (
              <div key={i} className="analysis-investors__card">
                <div className="analysis-investors__card-header">
                  <span className="analysis-investors__card-name">{inv.name}</span>
                  {inv.link && (
                    <a href={inv.link} target="_blank" rel="noopener noreferrer" className="analysis-investors__card-link">
                      Visit Website ↗
                    </a>
                  )}
                </div>
                <p className="analysis-investors__card-focus"><strong>Focus:</strong> {inv.focus}</p>
                <p className="analysis-investors__card-contact"><strong>Contact:</strong> {inv.contact}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="analysis-disclaimer">{disclaimer || "These are structured diagnostic possibilities based on provided parameters. LifeLens never predicts startup success or guarantees market outcomes."}</p>
    </div>
  );
}
