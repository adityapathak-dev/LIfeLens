import React, { useState } from "react";

export default function ExplainabilityDrawer({ explainability, title = "Factor Attribution Breakdown" }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!explainability) return null;

  const {
    influencing_inputs = [],
    assumptions_used = [],
    missing_information = [],
    confidence_rationale = "",
    sensitivity_factors = []
  } = explainability;

  return (
    <div className="explainability-container">
      <button
        type="button"
        className="btn-explain-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        title="View influencing inputs, assumptions, and confidence rationale"
      >
        <span>Why am I seeing this?</span>
        <span className="icon-bulb">💡</span>
      </button>

      {isOpen && (
        <div className="explainability-drawer glass-card">
          <div className="explain-header">
            <div>
              <h5>🔍 {title}</h5>
              <p className="explain-subtext">
                Factual breakdown of inputs and parameters. <strong>No raw chain-of-thought tokens.</strong>
              </p>
            </div>
            <button className="btn-close-sm" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="explain-body">
            {/* ── 1. INFLUENCING INPUTS ─────────────────────────────────── */}
            <div className="explain-block">
              <h6>📌 Influencing User Inputs:</h6>
              {influencing_inputs.length > 0 ? (
                <ul className="explain-list">
                  {influencing_inputs.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="explain-none">Derived from general track selection and country baseline.</p>
              )}
            </div>

            {/* ── 2. ASSUMPTIONS USED ───────────────────────────────────── */}
            <div className="explain-block">
              <h6>🛠️ Assumptions Used:</h6>
              {assumptions_used.length > 0 ? (
                <ul className="explain-list">
                  {assumptions_used.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="explain-none">Standard baseline progression assumptions applied.</p>
              )}
            </div>

            {/* ── 3. MISSING INFORMATION ────────────────────────────────── */}
            <div className="explain-block">
              <h6>❓ Missing Information (Data Gaps):</h6>
              {missing_information.length > 0 ? (
                <ul className="explain-list missing">
                  {missing_information.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="explain-none">Comprehensive input parameters provided.</p>
              )}
            </div>

            {/* ── 4. CONFIDENCE RATIONALE ───────────────────────────────── */}
            {confidence_rationale && (
              <div className="explain-block">
                <h6>📊 Confidence Rationale:</h6>
                <p className="explain-rationale-text">{confidence_rationale}</p>
              </div>
            )}

            {/* ── 5. SENSITIVITY FACTORS / WHAT COULD CHANGE ────────────── */}
            <div className="explain-block">
              <h6>🔄 Sensitivity Factors (What Could Change This Analysis?):</h6>
              {sensitivity_factors.length > 0 ? (
                <ul className="explain-list sensitivity">
                  {sensitivity_factors.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="explain-none">Analysis remains stable under standard parameter ranges.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
