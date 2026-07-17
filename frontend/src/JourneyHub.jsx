import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { TRACK_PROGRESS_MILESTONES } from "./journeyService";
import DossierComparator from "./DossierComparator";

export default function JourneyHub({ isOpen, onClose, onResumeJourney }) {
  const {
    user,
    userJourneys,
    fetchJourneys,
    updateJourneyProgress,
    updateJourneyStatus,
    deleteJourney
  } = useAuth();

  const [activeTab, setActiveTab] = useState("active"); // "active" | "vault" | "archived"
  const [selectedJourney, setSelectedJourney] = useState(null);
  const [comparingDossiers, setComparingDossiers] = useState(null); // { a, b, journeyId }
  const [compareSelection, setCompareSelection] = useState([]); // array of 2 dossier objects
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (isOpen && user) {
      fetchJourneys();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const activeJourneys = userJourneys.filter(j => j.status === "active" || !j.status);
  const archivedJourneys = userJourneys.filter(j => j.status === "archived");
  const allDossiers = userJourneys.flatMap(j => 
    (j.dossiers || []).map(d => ({ ...d, journeyTitle: j.title, journeyId: j.id, decisionType: j.decisionType }))
  );

  const handleProgressToggle = async (journey, milestoneId) => {
    if (!user) return;
    const currentProgress = journey.progress || {};
    const updated = { ...currentProgress, [milestoneId]: !currentProgress[milestoneId] };
    await updateJourneyProgress(journey.id, updated);
    await fetchJourneys();
  };

  const handleArchive = async (journeyId, currentStatus) => {
    const nextStatus = currentStatus === "archived" ? "active" : "archived";
    await updateJourneyStatus(journeyId, nextStatus);
    await fetchJourneys();
    setMsg(nextStatus === "archived" ? "Journey archived." : "Journey restored to Active.");
    setTimeout(() => setMsg(""), 3000);
  };

  const handleDelete = async (journeyId) => {
    if (window.confirm("Are you sure you want to delete this decision journey and all its saved dossiers?")) {
      await deleteJourney(journeyId);
      await fetchJourneys();
      setMsg("Journey deleted.");
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const handleSelectForCompare = (dossier) => {
    if (compareSelection.some(d => d.dossierId === dossier.dossierId)) {
      setCompareSelection(compareSelection.filter(d => d.dossierId !== dossier.dossierId));
    } else {
      if (compareSelection.length >= 2) {
        setCompareSelection([compareSelection[1], dossier]);
      } else {
        setCompareSelection([...compareSelection, dossier]);
      }
    }
  };

  const handleTriggerCompare = (journey) => {
    if (compareSelection.length === 2) {
      setComparingDossiers({
        a: compareSelection[0],
        b: compareSelection[1],
        journeyId: journey?.id || compareSelection[0].journeyId
      });
    }
  };

  return (
    <div className="hub-overlay" role="dialog" aria-labelledby="hub-title">
      <div className="hub-modal glass-card">
        <header className="hub-header">
          <div>
            <h2 id="hub-title">🧭 Decision Journey Hub</h2>
            <p className="hub-subtitle">Save exploration snapshots, track progress milestones, and review objective decision history.</p>
          </div>
          <button className="btn-close" onClick={onClose} title="Close Hub">✕</button>
        </header>

        {msg && <div className="toast-banner info">{msg}</div>}

        {/* ── TABS NAVIGATION ────────────────────────────────────────── */}
        <nav className="hub-tabs">
          <button
            className={`tab-btn ${activeTab === "active" ? "active" : ""}`}
            onClick={() => setActiveTab("active")}
          >
            📋 Active Journeys ({activeJourneys.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "vault" ? "active" : ""}`}
            onClick={() => setActiveTab("vault")}
          >
            🗄️ Dossier Vault ({allDossiers.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "archived" ? "active" : ""}`}
            onClick={() => setActiveTab("archived")}
          >
            📦 Archived ({archivedJourneys.length})
          </button>
        </nav>

        {/* ── TAB 1: ACTIVE JOURNEYS ─────────────────────────────────── */}
        {activeTab === "active" && (
          <div className="tab-content">
            {activeJourneys.length === 0 ? (
              <div className="empty-state">
                <p>No active decision journeys yet. Start an advisor consultation or context intake to begin tracking your choices!</p>
              </div>
            ) : (
              <div className="journey-grid">
                {activeJourneys.map(j => {
                  const milestones = TRACK_PROGRESS_MILESTONES[j.decisionType] || TRACK_PROGRESS_MILESTONES.grad_school;
                  const progress = j.progress || {};
                  const completedCount = Object.values(progress).filter(Boolean).length;

                  return (
                    <div key={j.id} className="journey-card">
                      <div className="journey-card-header">
                        <div>
                          <span className={`type-badge ${j.decisionType}`}>{j.decisionType.replace("_", " ").toUpperCase()}</span>
                          <h4>{j.title}</h4>
                          <span className="card-date">Updated: {new Date(j.updatedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="card-actions">
                          <button className="btn-secondary btn-sm" onClick={() => onResumeJourney(j)}>Resume</button>
                          <button className="btn-icon" onClick={() => handleArchive(j.id, j.status)} title="Archive">📦</button>
                          <button className="btn-icon danger" onClick={() => handleDelete(j.id)} title="Delete">🗑️</button>
                        </div>
                      </div>

                      {/* ── MILESTONE PROGRESS TRACKER ──────────────────── */}
                      <div className="progress-tracker-box">
                        <div className="progress-header">
                          <span>Progress Milestones ({completedCount}/{milestones.length})</span>
                          <span className="subtext">Track completion — non-prescriptive</span>
                        </div>
                        <div className="milestones-checklist">
                          {milestones.map(m => (
                            <label key={m.id} className="milestone-label">
                              <input
                                type="checkbox"
                                checked={Boolean(progress[m.id])}
                                onChange={() => handleProgressToggle(j, m.id)}
                              />
                              <span className={progress[m.id] ? "completed" : ""}>{m.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* ── SAVED DOSSIERS SUMMARY ─────────────────────── */}
                      <div className="dossiers-summary">
                        <span>Saved Dossier Snapshots: <strong>{j.dossiers?.length || 0}</strong></span>
                        {j.dossiers && j.dossiers.length >= 2 && (
                          <button
                            className="btn-link btn-sm"
                            onClick={() => {
                              setComparingDossiers({
                                a: j.dossiers[j.dossiers.length - 2],
                                b: j.dossiers[j.dossiers.length - 1],
                                journeyId: j.id
                              });
                            }}
                          >
                            Compare Latest 2 Snapshots ⚖️
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: DOSSIER VAULT & COMPARATOR SELECTOR ─────────────── */}
        {activeTab === "vault" && (
          <div className="tab-content">
            {allDossiers.length === 0 ? (
              <div className="empty-state">
                <p>No saved dossiers found. Click "Save Dossier" inside any advisor consultation to save structured snapshots here.</p>
              </div>
            ) : (
              <div>
                <div className="compare-bar">
                  <span>
                    Selected for comparison: <strong>{compareSelection.length}/2</strong>
                  </span>
                  {compareSelection.length === 2 && (
                    <button className="btn-primary btn-sm" onClick={() => handleTriggerCompare(null)}>
                      Compare Selected Side-by-Side ⚖️
                    </button>
                  )}
                  {compareSelection.length > 0 && (
                    <button className="btn-secondary btn-sm" onClick={() => setCompareSelection([])}>
                      Clear Selection
                    </button>
                  )}
                </div>

                <div className="vault-grid">
                  {allDossiers.map(d => {
                    const isSelected = compareSelection.some(sel => sel.dossierId === d.dossierId);
                    return (
                      <div key={d.dossierId} className={`vault-card ${isSelected ? "selected" : ""}`}>
                        <div className="vault-card-header">
                          <span className="card-date">{new Date(d.savedAt).toLocaleDateString()}</span>
                          <span className={`type-badge ${d.decisionType}`}>{d.decisionType}</span>
                        </div>
                        <h5>{d.journeyTitle}</h5>
                        {d.userNote && <p className="user-note">"{d.userNote}"</p>}
                        <div className="vault-card-body">
                          <p><strong>Primary Option:</strong> {d.analysis?.options?.[0]?.label || "N/A"}</p>
                          <p><strong>Confidence:</strong> {d.analysis?.options?.[0]?.confidence || "medium"}</p>
                        </div>
                        <div className="vault-card-footer">
                          <button
                            className={`btn-secondary btn-sm ${isSelected ? "active" : ""}`}
                            onClick={() => handleSelectForCompare(d)}
                          >
                            {isSelected ? "✓ Selected" : "+ Select to Compare"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: ARCHIVED JOURNEYS ────────────────────────────────── */}
        {activeTab === "archived" && (
          <div className="tab-content">
            {archivedJourneys.length === 0 ? (
              <div className="empty-state">
                <p>No archived journeys.</p>
              </div>
            ) : (
              <div className="journey-grid">
                {archivedJourneys.map(j => (
                  <div key={j.id} className="journey-card archived">
                    <div className="journey-card-header">
                      <div>
                        <span className="type-badge archived">ARCHIVED</span>
                        <h4>{j.title}</h4>
                        <span className="card-date">Archived on: {new Date(j.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="card-actions">
                        <button className="btn-secondary btn-sm" onClick={() => handleArchive(j.id, j.status)}>Restore</button>
                        <button className="btn-icon danger" onClick={() => handleDelete(j.id)} title="Delete">🗑️</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── DOSSIER COMPARATOR MODAL ───────────────────────────────── */}
        {comparingDossiers && (
          <DossierComparator
            dossierA={comparingDossiers.a}
            dossierB={comparingDossiers.b}
            journeyId={comparingDossiers.journeyId}
            onClose={() => setComparingDossiers(null)}
          />
        )}
      </div>
    </div>
  );
}
