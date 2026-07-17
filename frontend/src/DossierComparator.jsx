import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import ExplainabilityDrawer from "./ExplainabilityDrawer.jsx";

export default function DossierComparator({ dossierA, dossierB, journeyId, onClose }) {
  const { user, saveUserReflection, fetchJourneys } = useAuth();
  const [reflectionA, setReflectionA] = useState(dossierA?.reflection || "");
  const [reflectionB, setReflectionB] = useState(dossierB?.reflection || "");
  const [isSavingA, setIsSavingA] = useState(false);
  const [isSavingB, setIsSavingB] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  if (!dossierA || !dossierB) {
    return (
      <div className="comparator-overlay">
        <div className="comparator-modal">
          <h3>Dossier Comparator</h3>
          <p>Please select two dossiers to compare side-by-side.</p>
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  const analysisA = dossierA.analysis || {};
  const analysisB = dossierB.analysis || {};

  const dateA = new Date(dossierA.savedAt || Date.now()).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
  const dateB = new Date(dossierB.savedAt || Date.now()).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
  });

  // Calculate objective differences (diff summary)
  const optionsA = (analysisA.options || []).map(o => o.label);
  const optionsB = (analysisB.options || []).map(o => o.label);
  const newOptionsInB = optionsB.filter(o => !optionsA.includes(o));
  
  const tradeoffsA = analysisA.hidden_tradeoffs || [];
  const tradeoffsB = analysisB.hidden_tradeoffs || [];
  const newTradeoffsInB = tradeoffsB.filter(t => !tradeoffsA.includes(t));

  const handleSaveReflectionA = async () => {
    if (!user || !journeyId) return;
    setIsSavingA(true);
    await saveUserReflection(journeyId, dossierA.dossierId, reflectionA);
    await fetchJourneys();
    setIsSavingA(false);
    setSaveMsg("Reflection saved for Snapshot 1.");
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const handleSaveReflectionB = async () => {
    if (!user || !journeyId) return;
    setIsSavingB(true);
    await saveUserReflection(journeyId, dossierB.dossierId, reflectionB);
    await fetchJourneys();
    setIsSavingB(false);
    setSaveMsg("Reflection saved for Snapshot 2.");
    setTimeout(() => setSaveMsg(""), 3000);
  };

  return (
    <div className="comparator-overlay" role="dialog" aria-labelledby="comparator-title">
      <div className="comparator-modal glass-card">
        <header className="comparator-header">
          <div>
            <h2 id="comparator-title">Dossier Comparator Matrix</h2>
            <p className="comparator-subtitle">
              Compare objective decision snapshots side-by-side. <strong>LifeLens provides structured facts — the choice remains 100% yours.</strong>
            </p>
          </div>
          <button className="btn-close" onClick={onClose} title="Close Comparator">✕</button>
        </header>

        {saveMsg && <div className="toast-banner success">{saveMsg}</div>}

        {/* ── CHANGE SUMMARY SECTION ─────────────────────────────────── */}
        <section className="diff-summary-card">
          <h4>📊 What Changed Since Previous Snapshot?</h4>
          <div className="diff-grid">
            <div className="diff-item">
              <span className="diff-label">New Pathways / Options Explored:</span>
              <span className="diff-val">
                {newOptionsInB.length > 0 ? newOptionsInB.join(", ") : "Identical option parameters"}
              </span>
            </div>
            <div className="diff-item">
              <span className="diff-label">New Trade-offs Identified:</span>
              <span className="diff-val">
                {newTradeoffsInB.length > 0 ? `${newTradeoffsInB.length} new trade-off(s) added` : "Consistent trade-off baseline"}
              </span>
            </div>
            <div className="diff-item">
              <span className="diff-label">Confidence Rating Evolution:</span>
              <span className="diff-val">
                Snapshot 1: <strong>{analysisA.options?.[0]?.confidence || "medium"}</strong> → Snapshot 2: <strong>{analysisB.options?.[0]?.confidence || "medium"}</strong>
              </span>
            </div>
          </div>
        </section>

        {/* ── SIDE-BY-SIDE GRID ────────────────────────────────────────── */}
        <div className="side-by-side-grid">

          {/* ── COLUMN 1: SNAPSHOT A ───────────────────────────────────── */}
          <div className="comparator-col">
            <div className="col-badge">Snapshot 1 — {dateA}</div>
            {dossierA.userNote && <div className="snapshot-user-note">"{dossierA.userNote}"</div>}
            
            <div className="comp-section">
              <h5>Options & Projections</h5>
              {(analysisA.options || []).map((opt, i) => (
                <div key={i} className="comp-option-card">
                  <h6>{opt.label} <span className={`badge-confidence ${opt.confidence}`}>{opt.confidence} confidence</span></h6>
                  <p><strong>Short-term:</strong> {opt.short_term}</p>
                  <p><strong>Long-term:</strong> {opt.long_term}</p>
                  <p className="risk-text"><strong>Key Risk:</strong> {opt.key_risk}</p>
                  <p className="assumption-text"><strong>Key Assumption:</strong> {opt.key_assumption}</p>
                  <ExplainabilityDrawer explainability={opt.explainability} title={`Factor Attribution (${opt.label})`} />
                </div>
              ))}
            </div>

            <div className="comp-section">
              <h5>Hidden Trade-offs</h5>
              <ul>
                {(analysisA.hidden_tradeoffs || []).map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>

            <div className="comp-section">
              <h5>Branch Questions</h5>
              <ul>
                {(analysisA.branch_questions || []).map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>

            {/* ── REFLECTION LAYER A ────────────────────────────────────── */}
            <div className="reflection-card">
              <label htmlFor="reflection-a">
                🧠 <strong>Personal Reflection (Snapshot 1)</strong>
                <span className="subtext">Which trade-off are you more comfortable accepting in this snapshot?</span>
              </label>
              <textarea
                id="reflection-a"
                rows={3}
                value={reflectionA}
                onChange={(e) => setReflectionA(e.target.value)}
                placeholder="Write your personal thoughts on these trade-offs..."
              />
              <button className="btn-secondary btn-sm" onClick={handleSaveReflectionA} disabled={isSavingA}>
                {isSavingA ? "Saving..." : "Save Reflection"}
              </button>
            </div>
          </div>

          {/* ── COLUMN 2: SNAPSHOT B ───────────────────────────────────── */}
          <div className="comparator-col">
            <div className="col-badge accent">Snapshot 2 — {dateB}</div>
            {dossierB.userNote && <div className="snapshot-user-note">"{dossierB.userNote}"</div>}
            
            <div className="comp-section">
              <h5>Options & Projections</h5>
              {(analysisB.options || []).map((opt, i) => (
                <div key={i} className="comp-option-card">
                  <h6>{opt.label} <span className={`badge-confidence ${opt.confidence}`}>{opt.confidence} confidence</span></h6>
                  <p><strong>Short-term:</strong> {opt.short_term}</p>
                  <p><strong>Long-term:</strong> {opt.long_term}</p>
                  <p className="risk-text"><strong>Key Risk:</strong> {opt.key_risk}</p>
                  <p className="assumption-text"><strong>Key Assumption:</strong> {opt.key_assumption}</p>
                  <ExplainabilityDrawer explainability={opt.explainability} title={`Factor Attribution (${opt.label})`} />
                </div>
              ))}
            </div>

            <div className="comp-section">
              <h5>Hidden Trade-offs</h5>
              <ul>
                {(analysisB.hidden_tradeoffs || []).map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>

            <div className="comp-section">
              <h5>Branch Questions</h5>
              <ul>
                {(analysisB.branch_questions || []).map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>

            {/* ── REFLECTION LAYER B ────────────────────────────────────── */}
            <div className="reflection-card">
              <label htmlFor="reflection-b">
                🧠 <strong>Personal Reflection (Snapshot 2)</strong>
                <span className="subtext">Which trade-off are you more comfortable accepting in this snapshot?</span>
              </label>
              <textarea
                id="reflection-b"
                rows={3}
                value={reflectionB}
                onChange={(e) => setReflectionB(e.target.value)}
                placeholder="Write your personal thoughts on these trade-offs..."
              />
              <button className="btn-secondary btn-sm" onClick={handleSaveReflectionB} disabled={isSavingB}>
                {isSavingB ? "Saving..." : "Save Reflection"}
              </button>
            </div>
          </div>

        </div>

        <footer className="comparator-footer">
          <p className="disclaimer-note">
            🛡️ <strong>Agency Guarantee:</strong> LifeLens provides structured comparison data. We never rank or recommend options. The final choice rests entirely with you.
          </p>
          <button className="btn-primary" onClick={onClose}>Done Comparing</button>
        </footer>
      </div>
    </div>
  );
}
