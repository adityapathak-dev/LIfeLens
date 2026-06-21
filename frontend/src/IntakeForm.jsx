import React, { useState } from "react";

const DEFAULT_PATHS = [
  { label: "Grad School", user_note: "" },
  { label: "Job Offer", user_note: "" },
  { label: "Startup", user_note: "" },
];

export default function IntakeForm({ onSubmit, loading }) {
  const [paths, setPaths] = useState(DEFAULT_PATHS);
  const [riskTolerance, setRiskTolerance] = useState(3);
  const [runway, setRunway] = useState(6);
  const [horizon, setHorizon] = useState(5);
  const [hasDependents, setHasDependents] = useState(false);
  const [locationFlexible, setLocationFlexible] = useState(true);

  function updateNote(index, value) {
    setPaths((prev) => prev.map((p, i) => (i === index ? { ...p, user_note: value } : p)));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      decision_type: "grad_school_vs_job_vs_startup",
      paths,
      constraints: {
        financial_runway_months: Number(runway),
        risk_tolerance: Number(riskTolerance),
        time_horizon_years: Number(horizon),
        has_dependents: hasDependents,
        location_flexible: locationFlexible,
      },
    });
  }

  return (
    <form className="intake-card" onSubmit={handleSubmit}>
      <h2>Case Intake</h2>
      <p className="hint">
        Tell it what's pulling you toward each path. Leave a field blank if you don't have a
        reason yet — that's useful information too.
      </p>

      <div className="path-grid">
        {paths.map((path, i) => (
          <div className="path-field" key={path.label}>
            <label htmlFor={`note-${i}`}>{path.label}</label>
            <textarea
              id={`note-${i}`}
              value={path.user_note}
              onChange={(e) => updateNote(i, e.target.value)}
              placeholder="What's pulling you toward this option? (optional)"
            />
          </div>
        ))}
      </div>

      <div className="constraint-grid">
        <div className="constraint-field">
          <label htmlFor="runway">Financial runway (months)</label>
          <input
            id="runway"
            type="number"
            min="0"
            max="36"
            value={runway}
            onChange={(e) => setRunway(e.target.value)}
          />
        </div>

        <div className="constraint-field">
          <label htmlFor="risk">
            Risk tolerance <span className="range-value">{riskTolerance}/5</span>
          </label>
          <input
            id="risk"
            type="range"
            min="1"
            max="5"
            value={riskTolerance}
            onChange={(e) => setRiskTolerance(e.target.value)}
          />
        </div>

        <div className="constraint-field">
          <label htmlFor="horizon">Time horizon (years)</label>
          <input
            id="horizon"
            type="number"
            min="1"
            max="20"
            value={horizon}
            onChange={(e) => setHorizon(e.target.value)}
          />
        </div>

        <div className="constraint-field">
          <label>Dependents / obligations</label>
          <div className="checkbox-row">
            <input
              id="dependents"
              type="checkbox"
              checked={hasDependents}
              onChange={(e) => setHasDependents(e.target.checked)}
            />
            <label htmlFor="dependents" style={{ margin: 0, textTransform: "none", fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--paper)" }}>
              I support others financially
            </label>
          </div>
        </div>

        <div className="constraint-field">
          <label>Location</label>
          <div className="checkbox-row">
            <input
              id="flexible"
              type="checkbox"
              checked={locationFlexible}
              onChange={(e) => setLocationFlexible(e.target.checked)}
            />
            <label htmlFor="flexible" style={{ margin: 0, textTransform: "none", fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--paper)" }}>
              I can relocate if needed
            </label>
          </div>
        </div>
      </div>

      <button className="submit-btn" type="submit" disabled={loading}>
        {loading ? "Reasoning…" : "Open the case"}
      </button>
    </form>
  );
}
