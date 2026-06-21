import React from "react";

const DECISIONS = [
  {
    id: "grad_school",
    icon: "🎓",
    title: "Graduate School",
    subtitle: "University · Program · College",
    description:
      "Evaluate colleges, streams, and countries. The advisor surfaces real placement outcomes and what each option actually means for your career trajectory.",
    accentColor: "var(--blue)",
    iconBg: "var(--blue-bg)",
  },
  {
    id: "job",
    icon: "💼",
    title: "Job Offer",
    subtitle: "Career Move · Employment",
    description:
      "Analyse one or more offers — company quality, role growth, total compensation, and where you'll actually be five years from now.",
    accentColor: "var(--accent)",
    iconBg: "var(--accent-bg)",
  },
  {
    id: "startup",
    icon: "🚀",
    title: "Startup",
    subtitle: "Found · Join · Risk · Idea Meter",
    description:
      "Evaluate a startup move or compare it to a safer path — or run your idea through the Idea Meter for a brutally honest fly-or-flop verdict.",
    accentColor: "var(--teal)",
    iconBg: "var(--teal-bg)",
  },
];

export default function DecisionSelector({ onSelect }) {
  return (
    <div className="selector-wrap">
      <div className="selector-header">
        {/* Eyebrow badge */}
        <p className="selector-eyebrow">
          <span className="eyebrow-dot" aria-hidden="true" />
          Life Lens — AI Decision Advisor
        </p>

        {/* Cinematic Playfair Display title */}
        <h1 className="selector-title">
          Make your next move<br />
          with <em className="selector-title-accent">clarity.</em>
        </h1>

        <p className="selector-tagline">
          See every angle, make the right call.
        </p>

        <p className="selector-sub">
          Tell me what you're deciding. I'll ask the right questions, map the
          tradeoffs, and help you think — without telling you what to choose.
        </p>
      </div>

      {/* Decision cards */}
      <div className="decision-cards">
        {DECISIONS.map((d, idx) => (
          <button
            key={d.id}
            id={`decision-${d.id}`}
            className="decision-card"
            style={{
              "--card-accent-color": d.accentColor,
              "--card-icon-bg": d.iconBg,
              animationDelay: `${idx * 0.09}s`,
            }}
            onClick={() => onSelect(d.id)}
            type="button"
          >
            <span className="decision-card__icon" aria-hidden="true">
              {d.icon}
            </span>
            <h2 className="decision-card__title">{d.title}</h2>
            <p className="decision-card__subtitle">{d.subtitle}</p>
            <p className="decision-card__desc">{d.description}</p>
            <span className="decision-card__cta">
              Get started <span aria-hidden="true">→</span>
            </span>
          </button>
        ))}
      </div>

      <p className="selector-footer">
        The tool surfaces structure — the decision stays entirely with you.
      </p>
    </div>
  );
}
