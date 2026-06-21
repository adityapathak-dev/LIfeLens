import React, { useState, useEffect, useRef } from "react";
import { analyzeIdea } from "./api.js";
import { FIELD_OPTS, Select } from "./ContextIntake.jsx";

const VERDICT_CONFIG = {
  FLY: {
    emoji: "🚀",
    label: "This could fly",
    color: "var(--clr-green)",
    stroke: "#10b981",
    bgColor: "rgba(16, 185, 129, 0.08)",
    borderColor: "rgba(16, 185, 129, 0.4)",
  },
  FLOP: {
    emoji: "💀",
    label: "This will likely flop",
    color: "var(--clr-red)",
    stroke: "#ef4444",
    bgColor: "rgba(239, 68, 68, 0.08)",
    borderColor: "rgba(239, 68, 68, 0.4)",
    shake: true,
  },
  RISKY: {
    emoji: "⚠️",
    label: "High risk — could go either way",
    color: "var(--clr-amber)",
    stroke: "#f59e0b",
    bgColor: "rgba(245, 158, 11, 0.08)",
    borderColor: "rgba(245, 158, 11, 0.4)",
  },
};

function ConfettiBurst() {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 35 }).map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 40 + Math.random() * 120;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const size = 6 + Math.random() * 12;
      const duration = 0.8 + Math.random() * 0.7;
      const delay = Math.random() * 0.15;
      const colors = ["#d4a055", "#10b981", "#3b82f6", "#a78bfa", "#f5ede0"];
      const color = colors[Math.floor(Math.random() * colors.length)];
      return { id: i, x, y, size, duration, delay, color };
    });
    setParticles(newParticles);
  }, []);

  return (
    <div className="confetti-container">
      {particles.map((p) => (
        <span
          key={p.id}
          className="confetti-particle"
          style={{
            "--p-x": `${p.x}px`,
            "--p-y": `${p.y}px`,
            "--p-size": `${p.size}px`,
            "--p-duration": `${p.duration}s`,
            "--p-delay": `${p.delay}s`,
            background: p.color,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Animated SVG score ring ─── */
function ScoreRing({ score, color, strokeColor }) {
  const ringRef = useRef(null);
  const circumference = 251.2; // 2π × 40 ≈ 251.2
  const offset = circumference - (score / 10) * circumference;

  useEffect(() => {
    // Trigger the animation after a tiny delay so the transition fires
    const t = setTimeout(() => {
      if (ringRef.current) {
        ringRef.current.style.strokeDashoffset = offset;
      }
    }, 80);
    return () => clearTimeout(t);
  }, [offset]);

  return (
    <div className="idea-result__score-ring-wrap">
      <svg className="score-ring-svg" viewBox="0 0 90 90">
        <circle
          className="score-ring-bg"
          cx="45" cy="45" r="40"
        />
        <circle
          ref={ringRef}
          className="score-ring-fill"
          cx="45" cy="45" r="40"
          stroke={strokeColor}
          style={{ strokeDashoffset: circumference }}
        />
      </svg>
      <div className="score-ring-number">
        <span className="score-ring-number__value" style={{ color }}>
          {score}
        </span>
        <span className="score-ring-number__denom">/10</span>
      </div>
    </div>
  );
}

export default function IdeaMeter({ onReset, onBack }) {
  const [idea, setIdea] = useState("");
  const [field, setField] = useState("");
  const [result, setResult] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!idea.trim() || !field || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await analyzeIdea(idea.trim(), field);
      setResult(data);
      if (data.is_vague && data.clarifying_questions) {
        setAnswers(data.clarifying_questions.map((q) => ({ question: q, answer: "" })));
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAnswersSubmit(e) {
    e.preventDefault();
    if (loading) return;
    if (answers.some((a) => !a.answer.trim())) {
      setError("Please answer all clarifying questions.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeIdea(idea.trim(), field, answers);
      setResult(data);
      if (data.is_vague && data.clarifying_questions) {
        setAnswers(data.clarifying_questions.map((q) => ({ question: q, answer: "" })));
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const cfg = result && !result.is_vague ? (VERDICT_CONFIG[result.verdict] || VERDICT_CONFIG.RISKY) : null;

  return (
    <div className="idea-meter-shell">
      {/* Header */}
      <div className="idea-meter-header">
        <div>
          <p className="idea-meter-eyebrow">Startup → Idea Meter</p>
          <h1 className="idea-meter-title">💡 Idea Meter</h1>
          <p className="idea-meter-subtitle">
            Describe your startup idea. The AI will tell you the truth — no sugarcoating.
          </p>
        </div>
        <button className="restart-btn" type="button" onClick={onBack || onReset}>
          ← Back
        </button>
      </div>

      {/* Input form */}
      {!result && (
        <form className="idea-meter-form" onSubmit={handleSubmit}>
          <div className="intake-field" style={{ marginBottom: "4px" }}>
            <label className="field-label" htmlFor="idea-field-select">
              Startup industry field / sector
            </label>
            <Select
              id="idea-field-select"
              value={field}
              onChange={setField}
              options={FIELD_OPTS}
            />
          </div>

          <label className="field-label" htmlFor="idea-input">
            What's your startup idea?
          </label>
          <p className="idea-meter-form-hint">
            Include the problem you're solving, who your customers are, how you make money, and anything unique about your approach.
          </p>
          <textarea
            id="idea-input"
            className="idea-meter-textarea"
            placeholder={
              "e.g. An app that connects freelance nurses with short-notice hospital shifts in India. Hospitals post urgent shifts, nurses apply and get paid same-day. We take 8% of each transaction. Currently hospitals fill these shifts through WhatsApp groups which is slow and unreliable."
            }
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            rows={7}
            disabled={loading}
            required
          />

          {error && <p className="idea-meter-error">{error}</p>}

          <button
            className="idea-meter-submit-btn"
            type="submit"
            disabled={loading || idea.trim().length < 15 || !field}
          >
            {loading ? (
              <span className="idea-meter-loading">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
                <span>Evaluating…</span>
              </span>
            ) : (
              "Evaluate my idea →"
            )}
          </button>
        </form>
      )}

      {/* Clarifying questions form */}
      {result && result.is_vague && (
        <form className="idea-meter-form" onSubmit={handleAnswersSubmit}>
          <div className="idea-vague-container">
            <div className="idea-vague-header">
              <span className="idea-vague-header-emoji" aria-hidden="true">⚠️</span>
              <div>
                <h3 className="idea-vague-title">Your idea needs more details</h3>
                <p className="idea-vague-desc">
                  The AI partner thinks your description is a bit vague. Please answer these questions to get a precise evaluation:
                </p>
              </div>
            </div>

            {answers.map((item, idx) => (
              <div key={idx} className="idea-question-group">
                <label className="idea-question-text" htmlFor={`ans-${idx}`}>
                  {item.question}
                </label>
                <textarea
                  id={`ans-${idx}`}
                  className="idea-answer-textarea"
                  rows={3}
                  placeholder="Provide more detail..."
                  value={item.answer}
                  onChange={(e) => {
                    const updated = [...answers];
                    updated[idx].answer = e.target.value;
                    setAnswers(updated);
                  }}
                  disabled={loading}
                  required
                />
              </div>
            ))}

            {error && <p className="idea-meter-error">{error}</p>}

            <button
              className="idea-meter-submit-btn"
              type="submit"
              disabled={loading || answers.some((a) => !a.answer.trim())}
            >
              {loading ? (
                <span className="idea-meter-loading">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                  <span>Evaluating…</span>
                </span>
              ) : (
                "Submit Answers & Evaluate →"
              )}
            </button>

            <button
              className="back-btn"
              style={{ marginTop: "8px", alignSelf: "center" }}
              type="button"
              onClick={() => {
                setResult(null);
                setAnswers([]);
              }}
            >
              ← Modify original idea
            </button>
          </div>
        </form>
      )}

      {/* Results */}
      {result && !result.is_vague && cfg && (
        <div className={`idea-result ${result.verdict === "FLOP" ? "wobble-shake" : ""}`}>
          {/* Verdict header */}
          <div
            className={`idea-result__verdict${cfg.shake ? " verdict-flop" : ""}`}
            style={{ background: cfg.bgColor, borderColor: cfg.borderColor }}
          >
            <div className="idea-result__verdict-left">
              <span className="idea-result__verdict-emoji">{cfg.emoji}</span>
              <div>
                <p className="idea-result__verdict-label" style={{ color: cfg.color }}>
                  {cfg.label}
                </p>
                <p className="idea-result__score-label">{result.score_label}</p>
              </div>
            </div>

            {/* Animated SVG ring */}
            <div style={{ position: "relative" }}>
              <ScoreRing
                score={result.score}
                color={cfg.color}
                strokeColor={cfg.stroke}
              />
              {result.verdict === "FLY" && <ConfettiBurst />}
            </div>
          </div>

          {/* One-liner */}
          {result.one_liner && (
            <blockquote className="idea-result__one-liner">
              "{result.one_liner}"
            </blockquote>
          )}

          {/* Two-column: What works / What doesn't */}
          <div className="idea-result__two-col">
            {result.what_works?.length > 0 && (
              <div className="idea-result__col idea-result__col--green">
                <h3 className="idea-result__col-title">✅ What works</h3>
                <ul>
                  {result.what_works.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.what_doesnt?.length > 0 && (
              <div className="idea-result__col idea-result__col--red">
                <h3 className="idea-result__col-title">❌ What doesn't</h3>
                <ul>
                  {result.what_doesnt.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Biggest threat */}
          {result.biggest_threat && (
            <div className="idea-result__threat">
              <h3 className="idea-result__threat-title">☠️ Biggest threat</h3>
              <p>{result.biggest_threat}</p>
            </div>
          )}

          {/* How to improve */}
          {result.how_to_improve?.length > 0 && (
            <div className="idea-result__improve">
              <h3 className="idea-result__improve-title">🔧 How to improve this</h3>
              <ol>
                {result.how_to_improve.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Investor take */}
          {result.investor_take && (
            <div className="idea-result__investor">
              <h3 className="idea-result__investor-title">🎙️ Investor take</h3>
              <p className="idea-result__investor-text">{result.investor_take}</p>
            </div>
          )}

          {/* Curated Investors List */}
          {result.investors && result.investors.length > 0 && (
            <div className="analysis-investors">
              <h4 className="analysis-investors__title">🤝 Relevant Investors & Startup Funders</h4>
              <p className="analysis-investors__subtitle">
                Since your startup idea has potential, here are potential leads to reach out to in the{" "}
                {FIELD_OPTS.find((f) => f.value === field)?.label || "selected"} sector:
              </p>
              <div className="analysis-investors__list">
                {result.investors.map((inv, i) => (
                  <div key={i} className="analysis-investors__card">
                    <div className="analysis-investors__card-header">
                      <span className="analysis-investors__card-name">{inv.name}</span>
                      {inv.link && (
                        <a
                          href={inv.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="analysis-investors__card-link"
                        >
                          Visit Website ↗
                        </a>
                      )}
                    </div>
                    <p className="analysis-investors__card-focus">
                      <strong>Focus:</strong> {inv.focus}
                    </p>
                    <p className="analysis-investors__card-contact">
                      <strong>Contact:</strong> {inv.contact}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="idea-result__actions">
            <button
              className="idea-meter-retry-btn"
              type="button"
              onClick={() => {
                setResult(null);
                setIdea("");
                setField("");
                setAnswers([]);
              }}
            >
              ↺ Evaluate another idea
            </button>
            <button className="restart-btn" type="button" onClick={onReset}>
              ← Back to menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
