import React, { useState } from "react";
import { useAuth } from "./AuthContext";

const ADVISOR_LABELS = {
  grad_school: "Academic Advisor",
  job: "Career Advisor",
  startup: "Startup Advisor"
};

const ADVISOR_ICONS = {
  grad_school: "🎓",
  job: "💼",
  startup: "🚀"
};

export default function SessionHistoryModal({
  isOpen,
  onClose,
  onOpenSession,
  onContinueSession,
  onDuplicateSession
}) {
  const { userSessions, removeSession, duplicateSession } = useAuth();
  const [selectedSession, setSelectedSession] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const filteredSessions = userSessions.filter((s) => {
    if (filterType !== "all" && s.decisionType !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = s.title?.toLowerCase().includes(q);
      const summaryMatch = s.summary?.toLowerCase().includes(q);
      return titleMatch || summaryMatch;
    }
    return true;
  });

  const handleDuplicate = async (e, session) => {
    e.stopPropagation();
    try {
      const duplicated = await duplicateSession(session.id);
      if (duplicated && onContinueSession) {
        onContinueSession(duplicated);
        onClose();
      }
    } catch (err) {
      alert("Failed to duplicate session: " + err.message);
    }
  };

  const handleDelete = async (e, sessionId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this session transcript?")) {
      await removeSession(sessionId);
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Session History">
      <div className="modal-card session-history-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">💬 Session History & Memory Vault</h2>
            <p className="modal-subtitle">Revisit previous consultations, read transcripts, compare dossiers, or continue conversations.</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button" aria-label="Close">
            ✕
          </button>
        </div>

        {/* Filter bar */}
        <div className="session-history-controls">
          <div className="session-search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="session-search-input"
              placeholder="Search transcript topics, colleges, or companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="session-type-tabs">
            <button
              className={`session-tab-btn ${filterType === "all" ? "active" : ""}`}
              onClick={() => setFilterType("all")}
              type="button"
            >
              All ({userSessions.length})
            </button>
            <button
              className={`session-tab-btn ${filterType === "grad_school" ? "active" : ""}`}
              onClick={() => setFilterType("grad_school")}
              type="button"
            >
              🎓 Grad School
            </button>
            <button
              className={`session-tab-btn ${filterType === "job" ? "active" : ""}`}
              onClick={() => setFilterType("job")}
              type="button"
            >
              💼 Jobs
            </button>
            <button
              className={`session-tab-btn ${filterType === "startup" ? "active" : ""}`}
              onClick={() => setFilterType("startup")}
              type="button"
            >
              🚀 Startup
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="session-history-body">
          {/* Left Column: Sessions List */}
          <div className="session-list-column">
            {filteredSessions.length === 0 ? (
              <div className="empty-session-state">
                <p>No recorded sessions found.</p>
                <span className="subtext">Start a conversation with any AI Advisor to automatically persist your session history.</span>
              </div>
            ) : (
              filteredSessions.map((session) => {
                const dateStr = session.updatedAt ? new Date(session.updatedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                }) : "Recent";
                const isSelected = selectedSession?.id === session.id;
                const isCompleted = session.status === "completed" || Boolean(session.parsed?.is_analysis);

                return (
                  <div
                    key={session.id}
                    className={`session-card-item ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedSession(session)}
                  >
                    <div className="session-item-top">
                      <span className="session-badge">
                        {ADVISOR_ICONS[session.decisionType] || "💬"} {ADVISOR_LABELS[session.decisionType] || "Advisor"}
                      </span>
                      <span className="session-date">{dateStr}</span>
                    </div>

                    <h4 className="session-item-title">{session.title || "Advisor Consultation"}</h4>

                    <p className="session-item-summary">
                      {session.summary || (session.history?.[0]?.content ? session.history[0].content.slice(0, 120) + "..." : "Consultation in progress")}
                    </p>

                    <div className="session-item-footer">
                      <span className={`status-pill ${isCompleted ? "completed" : "in_progress"}`}>
                        {isCompleted ? "✓ Dossier Ready" : "⏳ In Progress"}
                      </span>

                      <div className="session-actions-mini">
                        <button
                          className="btn-icon"
                          title="Duplicate into new branch"
                          onClick={(e) => handleDuplicate(e, session)}
                          type="button"
                        >
                          🌿 Branch
                        </button>
                        <button
                          className="btn-icon danger"
                          title="Delete transcript"
                          onClick={(e) => handleDelete(e, session.id)}
                          type="button"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Selected Session Detail & Transcript Reader */}
          <div className="session-detail-column">
            {selectedSession ? (
              <div className="session-detail-view">
                <div className="session-detail-header">
                  <div>
                    <h3>{selectedSession.title}</h3>
                    <p className="subtext">
                      {ADVISOR_LABELS[selectedSession.decisionType]} · Created {new Date(selectedSession.createdAt || Date.now()).toLocaleString()}
                    </p>
                  </div>

                  <div className="session-detail-actions">
                    <button
                      className="btn-primary btn-sm"
                      onClick={() => {
                        onContinueSession(selectedSession);
                        onClose();
                      }}
                      type="button"
                    >
                      💬 Continue Conversation
                    </button>
                  </div>
                </div>

                {/* Dossier Preview if available */}
                {selectedSession.parsed?.analysis && (
                  <div className="session-dossier-banner glass-card">
                    <h4>📋 Strategic Decision Dossier Included</h4>
                    <p>{selectedSession.parsed.analysis.summary || "Complete decision assessment available."}</p>
                    {selectedSession.parsed.analysis.best_suggestion && (
                      <div className="best-suggestion-tag">
                        ⭐ <strong>Top Recommendation:</strong> {selectedSession.parsed.analysis.best_suggestion.choice}
                      </div>
                    )}
                  </div>
                )}

                {/* Transcript Viewer */}
                <div className="session-transcript-reader">
                  <h4>💬 Full Transcript ({selectedSession.history?.length || 0} turns)</h4>
                  <div className="transcript-messages">
                    {(selectedSession.history || []).map((msg, i) => (
                      <div key={i} className={`transcript-msg ${msg.role}`}>
                        <span className="msg-author">{msg.role === "user" ? "You" : "AI Advisor"}</span>
                        <p className="msg-body">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-detail-placeholder">
                <div className="placeholder-icon">👈</div>
                <h3>Select a session to view transcript & dossier</h3>
                <p>You can read full transcripts, review past decision logic, or continue any conversation in a new branch.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
