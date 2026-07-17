import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

export default function MemoryManagerModal({ isOpen, onClose }) {
  const { userMemory, saveUserMemory, clearUserMemory, toggleMemoryConsent } = useAuth();

  const [enabled, setEnabled] = useState(true);
  const [careerInterests, setCareerInterests] = useState("");
  const [degreeInterests, setDegreeInterests] = useState("");
  const [countryPreferences, setCountryPreferences] = useState("");
  const [budgetConstraints, setBudgetConstraints] = useState("");
  const [riskTolerance, setRiskTolerance] = useState(3);
  const [msg, setMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userMemory) {
      setEnabled(userMemory.enabled ?? true);
      setCareerInterests(Array.isArray(userMemory.careerInterests) ? userMemory.careerInterests.join(", ") : userMemory.careerInterests || "");
      setDegreeInterests(Array.isArray(userMemory.degreeInterests) ? userMemory.degreeInterests.join(", ") : userMemory.degreeInterests || "");
      setCountryPreferences(Array.isArray(userMemory.countryPreferences) ? userMemory.countryPreferences.join(", ") : userMemory.countryPreferences || "");
      setBudgetConstraints(userMemory.budgetConstraints || "");
      setRiskTolerance(userMemory.riskTolerance || 3);
    }
  }, [userMemory, isOpen]);

  if (!isOpen) return null;

  const handleToggleConsent = async () => {
    const nextState = !enabled;
    setEnabled(nextState);
    await toggleMemoryConsent(nextState);
    setMsg(nextState ? "Decision Memory enabled." : "Decision Memory disabled. No parameters will be stored or auto-filled.");
    setTimeout(() => setMsg(""), 3000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        enabled,
        careerInterests: careerInterests.split(",").map(s => s.trim()).filter(Boolean),
        degreeInterests: degreeInterests.split(",").map(s => s.trim()).filter(Boolean),
        countryPreferences: countryPreferences.split(",").map(s => s.trim()).filter(Boolean),
        budgetConstraints: budgetConstraints.trim(),
        riskTolerance: Number(riskTolerance)
      };
      await saveUserMemory(payload);
      setMsg("✓ Decision Memory updated successfully.");
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      alert("Failed to save memory: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    if (window.confirm("Are you sure you want to delete all stored decision memory? This cannot be undone.")) {
      await clearUserMemory();
      setCareerInterests("");
      setDegreeInterests("");
      setCountryPreferences("");
      setBudgetConstraints("");
      setRiskTolerance(3);
      setMsg("Decision Memory cleared.");
      setTimeout(() => setMsg(""), 3000);
    }
  };

  return (
    <div className="memory-overlay" role="dialog" aria-labelledby="memory-title">
      <div className="memory-modal glass-card">
        <header className="memory-header">
          <div>
            <h2 id="memory-title">🧠 Decision Memory & Consent Settings</h2>
            <p className="memory-subtitle">
              Manage your saved decision preferences. LifeLens only stores decision-relevant parameters to streamline intake.
            </p>
          </div>
          <button className="btn-close" onClick={onClose} title="Close Modal">✕</button>
        </header>

        {msg && <div className="toast-banner info">{msg}</div>}

        {/* ── CONSENT TOGGLE SWITCH ──────────────────────────────────────── */}
        <div className="consent-card">
          <div className="consent-info">
            <h4>Decision Memory Consent</h4>
            <p className="consent-desc">
              When enabled, LifeLens remembers your target degree, budget caps, and country preferences to auto-fill future intake forms.
            </p>
          </div>
          <label className="switch-toggle" title="Toggle Decision Memory Consent">
            <input
              type="checkbox"
              checked={enabled}
              onChange={handleToggleConsent}
            />
            <span className="slider round"></span>
          </label>
        </div>

        {/* ── PRIVACY TRANSPARENCY CARD ──────────────────────────────────── */}
        <div className="transparency-box">
          <div className="transparency-col allowed">
            <h6>✅ WHAT IS STORED (Decision-Relevant):</h6>
            <ul>
              <li>Career & Degree interests</li>
              <li>Country & location preferences</li>
              <li>Budget caps & risk tolerance score</li>
              <li>Saved journey snapshot counts</li>
            </ul>
          </div>
          <div className="transparency-col forbidden">
            <h6>🚫 WHAT IS NEVER STORED:</h6>
            <ul>
              <li>Unrelated personal conversation history</li>
              <li>Sensitive identifiers or financial credentials</li>
              <li>Raw AI chain-of-thought scratchpads</li>
            </ul>
          </div>
        </div>

        {/* ── EDITABLE MEMORY FORM ───────────────────────────────────────── */}
        <form className="memory-form" onSubmit={handleSave}>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="mem-degree">Degree / Course Interests:</label>
              <input
                id="mem-degree"
                type="text"
                className="input-text-sm"
                placeholder="E.g. MS CS, MBA, B.Tech CSE"
                value={degreeInterests}
                onChange={(e) => setDegreeInterests(e.target.value)}
                disabled={!enabled}
              />
            </div>

            <div className="form-field">
              <label htmlFor="mem-career">Career Roles / Industry Interests:</label>
              <input
                id="mem-career"
                type="text"
                className="input-text-sm"
                placeholder="E.g. Software Engineer, Founder, Product"
                value={careerInterests}
                onChange={(e) => setCareerInterests(e.target.value)}
                disabled={!enabled}
              />
            </div>

            <div className="form-field">
              <label htmlFor="mem-country">Country / Regional Preferences:</label>
              <input
                id="mem-country"
                type="text"
                className="input-text-sm"
                placeholder="E.g. United States, India, Germany"
                value={countryPreferences}
                onChange={(e) => setCountryPreferences(e.target.value)}
                disabled={!enabled}
              />
            </div>

            <div className="form-field">
              <label htmlFor="mem-budget">Budget / Savings Buffer Constraints:</label>
              <input
                id="mem-budget"
                type="text"
                className="input-text-sm"
                placeholder="E.g. Self-funded up to $40k/yr, 6 months runway"
                value={budgetConstraints}
                onChange={(e) => setBudgetConstraints(e.target.value)}
                disabled={!enabled}
              />
            </div>

            <div className="form-field full-width">
              <label htmlFor="mem-risk">Default Risk Tolerance (1 = Conservative, 5 = Aggressive):</label>
              <input
                id="mem-risk"
                type="range"
                min="1"
                max="5"
                value={riskTolerance}
                onChange={(e) => setRiskTolerance(e.target.value)}
                disabled={!enabled}
              />
              <div className="range-labels">
                <span>1 (Conservative)</span>
                <span>3 (Balanced: {riskTolerance})</span>
                <span>5 (Aggressive)</span>
              </div>
            </div>
          </div>

          <div className="memory-actions">
            <button
              type="button"
              className="btn-danger-outline btn-sm"
              onClick={handleClear}
              disabled={!userMemory}
            >
              Clear Memory 🗑️
            </button>

            <button
              type="submit"
              className="btn-primary btn-sm"
              disabled={!enabled || isSaving}
            >
              {isSaving ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
