import React from "react";

export default function StartupModeSelector({ onSelect, onBack }) {
  return (
    <div className="intake-wrap">
      <button className="back-btn" type="button" onClick={onBack}>
        ← Change decision type
      </button>

      <div className="startup-mode-header">
        <p className="intake-eyebrow">Startup</p>
        <h2 className="intake-title">What do you need help with?</h2>
        <p className="intake-hint">Pick the mode that fits where you are right now.</p>
      </div>

      <div className="startup-mode-cards">
        <button
          className="startup-mode-card"
          style={{ "--smc-accent-color": "var(--purple)" }}
          id="startup-mode-advisor"
          type="button"
          onClick={() => onSelect("advisor")}
        >
          <span className="startup-mode-card__icon" aria-hidden="true">🧭</span>
          <h3 className="startup-mode-card__title">Startup Decision Advisor</h3>
          <p className="startup-mode-card__desc">
            Thinking about founding, joining, or comparing startup risk against a safer path?
            The advisor will ask you the right questions and help you see the tradeoffs clearly.
          </p>
          <span className="startup-mode-card__cta">Start conversation →</span>
        </button>

        <button
          className="startup-mode-card"
          style={{ "--smc-accent-color": "var(--green)" }}
          id="startup-mode-idea-meter"
          type="button"
          onClick={() => onSelect("idea_meter")}
        >
          <span className="startup-mode-card__icon" aria-hidden="true">💡</span>
          <h3 className="startup-mode-card__title">Idea Meter</h3>
          <p className="startup-mode-card__desc">
            Have a startup idea? Describe it and get a brutally honest, no-sugarcoating verdict —
            fly or flop score, what works, what doesn't, and exactly how to improve it.
          </p>
          <span className="startup-mode-card__cta">Evaluate my idea →</span>
        </button>
      </div>
    </div>
  );
}
