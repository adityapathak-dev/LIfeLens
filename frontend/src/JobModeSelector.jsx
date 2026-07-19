import React from "react";

export default function JobModeSelector({ onSelect, onBack }) {
  return (
    <div className="intake-wrap">
      <button className="back-btn" type="button" onClick={onBack}>
        🏠 Back to Main Menu
      </button>

      <div className="startup-mode-header">
        <p className="intake-eyebrow">Human Advisors</p>
        <h2 className="intake-title">Select your path</h2>
        <p className="intake-hint">Choose between comprehensive decision evaluation or instant ATS resume analysis.</p>
      </div>

      <div className="startup-mode-cards">
        <button
          className="startup-mode-card"
          style={{ "--smc-accent-color": "var(--accent)" }}
          id="job-mode-advisor"
          type="button"
          onClick={() => onSelect("advisor")}
        >
          <span className="startup-mode-card__icon" aria-hidden="true">💼</span>
          <h3 className="startup-mode-card__title">Job Decision Advisor</h3>
          <p className="startup-mode-card__desc">
            Evaluating a job offer, promotion, or career switch?
            The AI Career Advisor will analyze compensation, growth trajectory, and 5-year outlook.
          </p>
          <span className="startup-mode-card__cta">Start consultation →</span>
        </button>

        <button
          className="startup-mode-card"
          style={{ "--smc-accent-color": "var(--blue)" }}
          id="job-mode-ats"
          type="button"
          onClick={() => onSelect("ats")}
        >
          <span className="startup-mode-card__icon" aria-hidden="true">⚡</span>
          <h3 className="startup-mode-card__title">Resume ATS Scanner</h3>
          <p className="startup-mode-card__desc">
            Upload your resume and paste a job description.
            Get instant ATS match scores, missing keyword detection, and AI resume optimization recommendations.
          </p>
          <span className="startup-mode-card__cta">Scan resume →</span>
        </button>
      </div>
    </div>
  );
}
