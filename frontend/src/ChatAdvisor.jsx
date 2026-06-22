import React, { useState, useEffect, useRef, useMemo } from "react";
import { sendChatMessage } from "./api.js";
import ConfidenceStamp from "./ConfidenceStamp.jsx";
import { FIELD_OPTS } from "./ContextIntake.jsx";
import logoImg from "./assets/logo.jpg";

const LABELS = {
  grad_school: "Academic Advisor",
  job: "Career Advisor",
  startup: "Startup Advisor",
};

const FALLBACK_OPTIONS = {
  grad_school: ["Top Universities", "Entrance Exams", "Career Paths"],
  job: ["Resume Improvement", "Salary Outlook", "Skills Gap"],
  startup: ["Market Validation", "Revenue Model", "Competitor Analysis"],
};

/* ─── Build the first "user" message from context form data ─── */
function buildContextMessage(decisionType, context) {
  const locationLines = [];
  if (context.userCity) locationLines.push(context.userCity);
  if (context.userState) locationLines.push(context.userState);
  if (context.userCountry) locationLines.push(context.userCountry);
  const locationStr = locationLines.join(", ");

  if (decisionType === "grad_school") {
    const lines = ["I am trying to decide on graduate school."];
    if (locationStr) lines.push(`Current Location: ${locationStr}`);
    if (context.country) lines.push(`Target Country: ${context.country}`);
    if (context.targetDegree) lines.push(`Target Degree: ${context.targetDegree}`);
    if (context.streamCategory) lines.push(`Branch/Stream Category: ${context.streamCategory}`);
    if (context.colleges) lines.push(`Colleges I am considering:\n${context.colleges}`);
    if (context.financialSituation) lines.push(`Financial Situation: ${context.financialSituation}`);
    if (context.runway) lines.push(`Savings Buffer: ${context.runway} months`);
    if (context.locationPreference) lines.push(`Location Preferences: ${context.locationPreference}`);
    return lines.join("\n");
  }
  if (decisionType === "job") {
    const lines = ["I am evaluating a job decision."];
    if (locationStr) lines.push(`Current Location: ${locationStr}`);
    if (context.country) lines.push(`Target Country: ${context.country}`);
    if (context.city) lines.push(`Target City/Region: ${context.city}`);
    if (context.role) lines.push(`Role / Job Title: ${context.role}`);
    if (context.companies) lines.push(`Companies under consideration:\n${context.companies}`);
    if (context.skills) lines.push(`My Skills / Tech Stack: ${context.skills}`);
    if (context.currentSituation) lines.push(`Current Work/Student Status: ${context.currentSituation}`);
    if (context.runway) lines.push(`Savings Buffer: ${context.runway} months`);
    if (context.locationPreference) lines.push(`Location Preferences: ${context.locationPreference}`);
    return lines.join("\n");
  }
  if (decisionType === "startup") {
    const lines = ["I am thinking through a startup decision."];
    if (locationStr) lines.push(`Current Location: ${locationStr}`);
    if (context.country) lines.push(`Target Market: ${context.country}`);
    if (context.field) {
      const matchingField = FIELD_OPTS.find((f) => f.value === context.field);
      lines.push(`Industry Field/Sector: ${matchingField ? matchingField.label : context.field}`);
    }
    if (context.myRole) lines.push(`My Role: ${context.myRole}`);
    if (context.description) lines.push(`Startup Description: ${context.description}`);
    if (context.fundingStage) lines.push(`Funding Stage: ${context.fundingStage}`);
    if (context.runway) lines.push(`Savings Buffer: ${context.runway} months`);
    if (context.locationPreference) lines.push(`Location Preferences: ${context.locationPreference}`);
    if (context.riskTolerance) lines.push(`Risk Tolerance: ${context.riskTolerance}/5`);
    return lines.join("\n");
  }
  return "I need help thinking through an important decision.";
}

function StreamingMessage({ content, parsed, onComplete }) {
  const [wordCount, setWordCount] = useState(0);
  const words = useMemo(() => content.split(" "), [content]);

  useEffect(() => {
    setWordCount(0);
    const interval = setInterval(() => {
      setWordCount((prev) => {
        if (prev < words.length) {
          return prev + 1;
        } else {
          clearInterval(interval);
          onComplete?.();
          return prev;
        }
      });
    }, 30); // 30ms per word is responsive and flows very nicely
    return () => clearInterval(interval);
  }, [words, onComplete]);

  return (
    <>
      <p className="msg-text">
        {words.slice(0, wordCount).map((word, index) => (
          <span key={index} className="word-reveal">
            {word}{" "}
          </span>
        ))}
      </p>
      {wordCount >= words.length && parsed?.is_analysis && parsed.analysis && (
        <AnalysisBlock analysis={parsed.analysis} />
      )}
    </>
  );
}

/* ─── Main chat component ─────────────────────────────────────── */

export default function ChatAdvisor({ decisionType, context, onReset }) {
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("Thinking...");
  const [showCounselor, setShowCounselor] = useState(false);
  const [counselor, setCounselor] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const startedRef = useRef(false);

  const latestAnalysis = history.findLast?.((m) => m.parsed?.is_analysis)
    ?? history.filter((m) => m.parsed?.is_analysis).at(-1);
  const hasAnalysis = Boolean(latestAnalysis);

  useEffect(() => {
    if (!loading) return;

    let statuses = [];
    if (decisionType === "grad_school") {
      statuses = [
        "Analyzing profile...",
        "Finding universities...",
        "Matching entrance exams..."
      ];
    } else if (decisionType === "job") {
      statuses = [
        "Matching careers...",
        "Generating recommendations..."
      ];
    } else { // startup
      statuses = [
        "Evaluating startup idea...",
        "Analyzing market fit...",
        "Scoring opportunity..."
      ];
    }

    setLoadingStatus(statuses[0]);
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % statuses.length;
      setLoadingStatus(statuses[index]);
    }, 2000);

    return () => clearInterval(interval);
  }, [loading, decisionType]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const initMsg = buildContextMessage(decisionType, context);
    sendTurn([{ role: "user", content: initMsg }], true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Automatic scrolling is disabled to preserve the user's reading position.

  async function sendTurn(apiMessages, isInit = false) {
    setLoading(true);
    try {
      const data = await sendChatMessage({
        decision_type: decisionType,
        history: apiMessages,
        country: context.country || context.userCountry,
        field: context.field,
        colleges: context.colleges,
        context: context,
      });

      if (data.counselor) setCounselor(data.counselor);

      const aiEntry = {
        role: "assistant",
        content: data.message,
        parsed: data,
        id: Date.now(),
        isStreaming: true,
      };

      if (isInit) {
        setHistory([
          { role: "user", content: apiMessages[0].content, isInit: true },
          aiEntry,
        ]);
      } else {
        setHistory((prev) => [...prev, aiEntry]);
      }
    } catch (err) {
      const errEntry = {
        role: "assistant",
        content: "Sorry, something went wrong on my end. Please try again.",
        isError: true,
        id: Date.now(),
      };
      setHistory((prev) =>
        isInit
          ? [{ role: "user", content: apiMessages[0].content, isInit: true }, errEntry]
          : [...prev, errEntry]
      );
    } finally {
      setLoading(false);
      if (!isInit) {
        setTimeout(() => inputRef.current?.focus(), 80);
      }
    }
  }

  function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || loading || hasAnalysis) return;
    const text = input.trim();
    setInput("");

    const userEntry = { role: "user", content: text, id: Date.now() };
    setHistory((prev) => [...prev, userEntry]);

    const apiMessages = [...history, userEntry].map((m) => ({
      role: m.role,
      content: m.content,
    }));
    sendTurn(apiMessages);
  }

  function handleSendOption(optionText) {
    if (loading || hasAnalysis) return;
    const userEntry = { role: "user", content: optionText, id: Date.now() };
    setHistory((prev) => [...prev, userEntry]);

    const apiMessages = [...history, userEntry].map((m) => ({
      role: m.role,
      content: m.content,
    }));
    sendTurn(apiMessages);
  }

  const lastMessage = history[history.length - 1];
  const isLastAssistant = lastMessage?.role === "assistant";
  const rawSuggestions = isLastAssistant && Array.isArray(lastMessage.parsed?.suggested_options)
    ? lastMessage.parsed.suggested_options
    : [];

  let suggestions = rawSuggestions.filter(Boolean).slice(0, 3);
  if (suggestions.length < 3 && isLastAssistant && !hasAnalysis && !loading) {
    const fallbacks = FALLBACK_OPTIONS[decisionType] || [];
    suggestions = [...suggestions, ...fallbacks.filter(f => !suggestions.includes(f))].slice(0, 3);
  }

  const showSuggestions = isLastAssistant && !hasAnalysis && !loading && suggestions.length > 0;

  return (
    <div className="chat-shell">
      {/* ── Header ── */}
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="chat-advisor-avatar-container" aria-hidden="true">
            <img className="chat-advisor-avatar-img" src={logoImg} alt="Life Lens Advisor Logo" />
          </div>
          <div className="chat-header-info">
            <p className="chat-eyebrow">
              <span className="status-dot" aria-label="Online" />
              Life Lens · Online
            </p>
            <h1 className="chat-title">{LABELS[decisionType] || "Decision Advisor"}</h1>
          </div>
        </div>
        <button className="restart-btn" onClick={onReset} type="button">
          ↺ Start over
        </button>
      </div>

      {/* ── Messages ── */}
      <div className="chat-messages" role="log" aria-live="polite">
        {history.map((msg, i) => {
          if (msg.isInit) return null;
          return (
            <div
              key={msg.id ?? i}
              className={`msg-row ${msg.role}`}
              style={{ animationDelay: `${Math.min(i * 0.04, 0.2)}s` }}
            >
              {msg.role === "assistant" && (
                <div className="msg-avatar-container" aria-hidden="true">
                  <img className="msg-avatar-img" src={logoImg} alt="Life Lens Advisor Logo" />
                </div>
              )}
              <div className={`msg-bubble${msg.isError ? " error" : ""}`}>
                {msg.isStreaming ? (
                  <StreamingMessage
                    content={msg.content}
                    parsed={msg.parsed}
                    onComplete={() => {
                      setHistory((prev) =>
                        prev.map((m) => (m.id === msg.id ? { ...m, isStreaming: false } : m))
                      );
                    }}
                  />
                ) : (
                  <>
                    <p className="msg-text">{msg.content}</p>
                    {msg.parsed?.is_analysis && msg.parsed.analysis && (
                      <AnalysisBlock analysis={msg.parsed.analysis} />
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="msg-row assistant">
            <div className="msg-avatar-container" aria-hidden="true">
              <img className="msg-avatar-img" src={logoImg} alt="Life Lens Advisor Logo" />
            </div>
            <div className="msg-bubble typing-bubble" aria-label="Advisor is thinking">
              <div className="typing-dots" style={{ display: "flex", gap: "4px", marginRight: "8px" }}>
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
              <span className="typing-status-text" style={{ fontSize: "13px", color: "var(--text-3)", fontWeight: "500" }}>
                {loadingStatus}
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Counselor prompt (after analysis) ── */}
      {hasAnalysis && !showCounselor && (
        <div className="counselor-prompt">
          <p>Still unsure? A real counsellor can help you work through this.</p>
          <button
            type="button"
            id="btn-counselor"
            className="counselor-trigger-btn"
            onClick={() => setShowCounselor(true)}
          >
            Connect me with a counsellor →
          </button>
        </div>
      )}

      {showCounselor && counselor && <CounselorCard counselor={counselor} />}

      {/* ── Suggestions Row ── */}
      {showSuggestions && (
        <div className="chat-suggestions">
          {suggestions.map((opt, idx) => (
            <button
              key={idx}
              type="button"
              className="suggestion-btn"
              onClick={() => handleSendOption(opt)}
            >
              {opt}
            </button>
          ))}
          <button
            type="button"
            className="suggestion-btn other"
            onClick={() => inputRef.current?.focus()}
          >
            Other (Type Your Own)
          </button>
        </div>
      )}

      {/* ── Input row ── */}
      <form className="chat-input-row" onSubmit={handleSend}>
        <input
          ref={inputRef}
          id="chat-input"
          className="chat-input"
          type="text"
          placeholder={
            hasAnalysis
              ? "Analysis complete — start over to explore more"
              : "Type your answer…"
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading || hasAnalysis}
          autoComplete="off"
        />
        <button
          type="submit"
          id="btn-send"
          className="chat-send-btn"
          disabled={loading || !input.trim() || hasAnalysis}
        >
          Send
        </button>
      </form>
    </div>
  );
}

/* ─── Inline analysis block ──────────────────────────────────── */

function AnalysisBlock({ analysis }) {
  return (
    <div className="analysis-block">
      {analysis.summary && (
        <p className="analysis-summary">{analysis.summary}</p>
      )}

      <div className="analysis-options">
        {(analysis.options || []).map((opt, i) => (
          <div key={i} className="analysis-option">
            <div className="analysis-option__header">
              <span className="analysis-option__label">{opt.label}</span>
              <ConfidenceStamp level={opt.confidence} />
            </div>
            {opt.college_note && (
              <p className="analysis-college-note">📌 {opt.college_note}</p>
            )}
            <OutcomeRow heading="Short-term (1–2 yr)" text={opt.short_term} />
            <OutcomeRow heading="Long-term (5 yr)" text={opt.long_term} />
            <OutcomeRow heading="Key risk" text={opt.key_risk} risk />
            <OutcomeRow heading="Key assumption" text={opt.key_assumption} />
          </div>
        ))}
      </div>

      {analysis.hidden_tradeoffs?.length > 0 && (
        <div className="analysis-section">
          <h4 className="analysis-section__title">Hidden tradeoffs you didn't mention</h4>
          <ul>
            {analysis.hidden_tradeoffs.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis.branch_questions?.length > 0 && (
        <div className="analysis-section">
          <h4 className="analysis-section__title">Questions worth sitting with</h4>
          <ul className="branch-list">
            {analysis.branch_questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis.best_suggestion && (
        <div className="analysis-best-suggestion">
          <div
            className="analysis-best-suggestion__header"
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}
          >
            <span className="analysis-best-suggestion__badge">⭐ Best Suggestion</span>
            {analysis.best_suggestion.link && (
              <a
                href={analysis.best_suggestion.link}
                target="_blank"
                rel="noopener noreferrer"
                className="analysis-link-badge"
              >
                Visit Site ↗
              </a>
            )}
          </div>
          <h4 className="analysis-best-suggestion__choice">{analysis.best_suggestion.choice}</h4>
          <p className="analysis-best-suggestion__reasoning">{analysis.best_suggestion.reasoning}</p>
        </div>
      )}

      {analysis.top_alternate && (
        <div className="analysis-top-alternate">
          <div
            className="analysis-top-alternate__header"
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}
          >
            <span className="analysis-top-alternate__badge">💡 Top Alternative (Outside Your List)</span>
            {analysis.top_alternate.link && (
              <a
                href={analysis.top_alternate.link}
                target="_blank"
                rel="noopener noreferrer"
                className="analysis-link-badge analysis-link-badge--alternate"
              >
                Visit Site ↗
              </a>
            )}
          </div>
          <h4 className="analysis-top-alternate__name">{analysis.top_alternate.name}</h4>
          {analysis.top_alternate.estimated_salary && (
            <div className="analysis-salary-badge">
              💰 Estimated Package: {analysis.top_alternate.estimated_salary}
            </div>
          )}
          <p className="analysis-top-alternate__why">{analysis.top_alternate.why}</p>
        </div>
      )}

      {analysis.explore_more?.length > 0 && (
        <div className="analysis-explore-more">
          <h4 className="analysis-explore-more__title">🔍 Also Worth Exploring</h4>
          <p className="analysis-explore-more__subtitle">
            These aren't in your list but match your requirements — worth a look.
          </p>
          <ul className="analysis-explore-more__list">
            {analysis.explore_more.map((item, i) => (
              <li key={i} className="analysis-explore-more__item">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  <span className="analysis-explore-more__item-name" style={{ fontWeight: "700", color: "#ffffff" }}>
                    {item.name}
                  </span>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {item.estimated_salary && (
                      <span className="analysis-salary-badge-small">
                        💰 {item.estimated_salary}
                      </span>
                    )}
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="analysis-link-badge-small"
                      >
                        Visit ↗
                      </a>
                    )}
                  </div>
                </div>
                <span className="analysis-explore-more__item-reason">{item.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.investors?.length > 0 && (
        <div className="analysis-investors">
          <h4 className="analysis-investors__title">🤝 Relevant Investors & Startup Funders</h4>
          <p className="analysis-investors__subtitle">
            Based on your startup's sector, here are potential leads to reach out to:
          </p>
          <div className="analysis-investors__list">
            {analysis.investors.map((inv, i) => (
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

      <p className="analysis-disclaimer">{analysis.disclaimer}</p>
    </div>
  );
}

function OutcomeRow({ heading, text, risk }) {
  return (
    <div className={`outcome-row${risk ? " risk" : ""}`}>
      <span className="outcome-row__label">{heading}</span>
      <p className="outcome-row__text">{text}</p>
    </div>
  );
}

/* ─── Counselor card ─────────────────────────────────────────── */

function CounselorCard({ counselor }) {
  return (
    <div className="counselor-card" role="complementary" aria-label="Counselor contact">
      <div className="counselor-card__icon" aria-hidden="true">☎</div>
      <div className="counselor-card__body">
        <p className="counselor-card__type">{counselor.type}</p>
        <p className="counselor-card__name">{counselor.name}</p>
        <a
          href={`tel:${counselor.phone.replace(/[^\d+]/g, "")}`}
          className="counselor-card__phone"
        >
          {counselor.phone}
        </a>
        <p className="counselor-card__hours">{counselor.hours}</p>
        {counselor.website && (
          <a
            href={counselor.website}
            target="_blank"
            rel="noopener noreferrer"
            className="counselor-card__web"
          >
            {counselor.website.replace(/^https?:\/\//, "")} ↗
          </a>
        )}
      </div>
    </div>
  );
}
