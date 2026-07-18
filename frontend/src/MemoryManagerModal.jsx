import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

export default function MemoryManagerModal({ isOpen, onClose, initialTrack = "grad_school" }) {
  const { userMemory, isMemoryLoading, saveUserMemory, clearUserMemory, toggleMemoryConsent } = useAuth();

  // Helper to map track key to tab key
  const getTabForTrack = (track) => {
    if (track === "job") return "career";
    if (track === "startup") return "startup";
    return "education";
  };

  const [activeTab, setActiveTab] = useState(() => getTabForTrack(initialTrack));
  const [enabled, setEnabled] = useState(true);

  // 🎓 Education Preferences
  const [degreeInterests, setDegreeInterests] = useState("");
  const [examInterests, setExamInterests] = useState("");
  const [countryPreferences, setCountryPreferences] = useState("");
  const [budgetConstraints, setBudgetConstraints] = useState("");

  // 💼 Career Preferences
  const [careerInterests, setCareerInterests] = useState("");
  const [skills, setSkills] = useState("");
  const [industryInterests, setIndustryInterests] = useState("");
  const [salaryExpectations, setSalaryExpectations] = useState("");

  // 🚀 Startup Preferences
  const [sectorInterests, setSectorInterests] = useState("");
  const [riskTolerance, setRiskTolerance] = useState(3);
  const [fundingInterests, setFundingInterests] = useState("");
  const [businessInterests, setBusinessInterests] = useState("");

  const [msg, setMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const formatList = (val) => (Array.isArray(val) ? val.join(", ") : val || "");
  const parseList = (val) => val.split(",").map((s) => s.trim()).filter(Boolean);

  useEffect(() => {
    if (initialTrack) {
      setActiveTab(getTabForTrack(initialTrack));
    }
  }, [initialTrack, isOpen]);

  useEffect(() => {
    if (userMemory) {
      setEnabled(userMemory.enabled ?? true);
      
      // Education
      setDegreeInterests(formatList(userMemory.degreeInterests));
      setExamInterests(formatList(userMemory.examInterests));
      setCountryPreferences(formatList(userMemory.countryPreferences));
      setBudgetConstraints(userMemory.budgetConstraints || "");

      // Career
      setCareerInterests(formatList(userMemory.careerInterests));
      setSkills(formatList(userMemory.skills));
      setIndustryInterests(formatList(userMemory.industryInterests));
      setSalaryExpectations(userMemory.salaryExpectations || "");

      // Startup
      setSectorInterests(formatList(userMemory.sectorInterests));
      setRiskTolerance(userMemory.riskTolerance ?? 3);
      setFundingInterests(formatList(userMemory.fundingInterests));
      setBusinessInterests(formatList(userMemory.businessInterests));
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
        // Education
        degreeInterests: parseList(degreeInterests),
        examInterests: parseList(examInterests),
        countryPreferences: parseList(countryPreferences),
        budgetConstraints: budgetConstraints.trim(),
        
        // Career
        careerInterests: parseList(careerInterests),
        skills: parseList(skills),
        industryInterests: parseList(industryInterests),
        salaryExpectations: salaryExpectations.trim(),

        // Startup
        sectorInterests: parseList(sectorInterests),
        riskTolerance: Number(riskTolerance),
        fundingInterests: parseList(fundingInterests),
        businessInterests: parseList(businessInterests)
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
      setDegreeInterests("");
      setExamInterests("");
      setCountryPreferences("");
      setBudgetConstraints("");

      setCareerInterests("");
      setSkills("");
      setIndustryInterests("");
      setSalaryExpectations("");

      setSectorInterests("");
      setRiskTolerance(3);
      setFundingInterests("");
      setBusinessInterests("");

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
              Manage decision-relevant preferences across all decision domains. LifeLens never forces a single identity—you may belong to multiple categories simultaneously.
            </p>
          </div>
          <button className="btn-close" onClick={onClose} title="Close Modal">✕</button>
        </header>

        {msg && <div className="toast-banner info">{msg}</div>}
        {isMemoryLoading && !userMemory && <div className="toast-banner info">⏳ Loading saved preferences...</div>}

        {/* ── CONSENT TOGGLE SWITCH ──────────────────────────────────────── */}
        <div className="consent-card">
          <div className="consent-info">
            <h4>Decision Memory Consent</h4>
            <p className="consent-desc">
              When enabled, LifeLens remembers your target degrees, roles, country preferences, and risk tolerance to auto-fill future intake forms.
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

        {/* ── DOMAIN CATEGORY TABS ────────────────────────────────────────── */}
        <div className="memory-category-tabs">
          <button
            type="button"
            className={`memory-tab-btn ${activeTab === "education" ? "active" : ""}`}
            onClick={() => setActiveTab("education")}
          >
            🎓 Education Preferences
          </button>
          <button
            type="button"
            className={`memory-tab-btn ${activeTab === "career" ? "active" : ""}`}
            onClick={() => setActiveTab("career")}
          >
            💼 Career Preferences
          </button>
          <button
            type="button"
            className={`memory-tab-btn ${activeTab === "startup" ? "active" : ""}`}
            onClick={() => setActiveTab("startup")}
          >
            🚀 Startup Preferences
          </button>
        </div>

        {/* ── EDITABLE MEMORY FORM ───────────────────────────────────────── */}
        <form className="memory-form" onSubmit={handleSave}>
          {/* 🎓 EDUCATION PREFERENCES TAB */}
          {activeTab === "education" && (
            <div className="form-grid category-pane">
              <div className="form-field">
                <label htmlFor="mem-degree">Target Degrees / Programmes:</label>
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
                <label htmlFor="mem-exams">Target Entrance Exams:</label>
                <input
                  id="mem-exams"
                  type="text"
                  className="input-text-sm"
                  placeholder="E.g. GRE, JEE Advanced, CUET, SAT"
                  value={examInterests}
                  onChange={(e) => setExamInterests(e.target.value)}
                  disabled={!enabled}
                />
              </div>

              <div className="form-field">
                <label htmlFor="mem-country">Country / Study Regions:</label>
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
                <label htmlFor="mem-budget">Tuition & Living Budget Caps:</label>
                <input
                  id="mem-budget"
                  type="text"
                  className="input-text-sm"
                  placeholder="E.g. Self-funded up to $40k/yr, Full scholarship target"
                  value={budgetConstraints}
                  onChange={(e) => setBudgetConstraints(e.target.value)}
                  disabled={!enabled}
                />
              </div>
            </div>
          )}

          {/* 💼 CAREER PREFERENCES TAB */}
          {activeTab === "career" && (
            <div className="form-grid category-pane">
              <div className="form-field">
                <label htmlFor="mem-career">Target Roles / Positions:</label>
                <input
                  id="mem-career"
                  type="text"
                  className="input-text-sm"
                  placeholder="E.g. Software Engineer, Product Manager, Data Scientist"
                  value={careerInterests}
                  onChange={(e) => setCareerInterests(e.target.value)}
                  disabled={!enabled}
                />
              </div>

              <div className="form-field">
                <label htmlFor="mem-skills">Key Skills & Tech Stack:</label>
                <input
                  id="mem-skills"
                  type="text"
                  className="input-text-sm"
                  placeholder="E.g. React, Python, AWS, System Design"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  disabled={!enabled}
                />
              </div>

              <div className="form-field">
                <label htmlFor="mem-industry">Target Industries / Sectors:</label>
                <input
                  id="mem-industry"
                  type="text"
                  className="input-text-sm"
                  placeholder="E.g. AI/DeepTech, FinTech, SaaS, HealthTech"
                  value={industryInterests}
                  onChange={(e) => setIndustryInterests(e.target.value)}
                  disabled={!enabled}
                />
              </div>

              <div className="form-field">
                <label htmlFor="mem-salary">Target Salary & Runway Expectations:</label>
                <input
                  id="mem-salary"
                  type="text"
                  className="input-text-sm"
                  placeholder="E.g. $120k+ base, 6 months savings runway"
                  value={salaryExpectations}
                  onChange={(e) => setSalaryExpectations(e.target.value)}
                  disabled={!enabled}
                />
              </div>
            </div>
          )}

          {/* 🚀 STARTUP PREFERENCES TAB */}
          {activeTab === "startup" && (
            <div className="form-grid category-pane">
              <div className="form-field">
                <label htmlFor="mem-sectors">Focus Venture Sectors:</label>
                <input
                  id="mem-sectors"
                  type="text"
                  className="input-text-sm"
                  placeholder="E.g. Developer Tools, CleanTech, B2B SaaS"
                  value={sectorInterests}
                  onChange={(e) => setSectorInterests(e.target.value)}
                  disabled={!enabled}
                />
              </div>

              <div className="form-field">
                <label htmlFor="mem-funding">Funding Stage & Capital Interests:</label>
                <input
                  id="mem-funding"
                  type="text"
                  className="input-text-sm"
                  placeholder="E.g. Bootstrapped, Pre-seed, Grants, Angel Network"
                  value={fundingInterests}
                  onChange={(e) => setFundingInterests(e.target.value)}
                  disabled={!enabled}
                />
              </div>

              <div className="form-field">
                <label htmlFor="mem-business">Business Model Interests:</label>
                <input
                  id="mem-business"
                  type="text"
                  className="input-text-sm"
                  placeholder="E.g. Subscription SaaS, Marketplace, API Usage"
                  value={businessInterests}
                  onChange={(e) => setBusinessInterests(e.target.value)}
                  disabled={!enabled}
                />
              </div>

              <div className="form-field">
                <label htmlFor="mem-risk">Venture Risk Tolerance (1 = Low, 5 = High):</label>
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
          )}

          {/* ── PRIVACY TRANSPARENCY SUMMARY ───────────────────────────────── */}
          <div className="transparency-box">
            <div className="transparency-col allowed">
              <h6>✅ WHAT IS STORED (Decision-Relevant):</h6>
              <ul>
                <li>Education degrees, exams & country preferences</li>
                <li>Career roles, skills & industry interests</li>
                <li>Startup venture sectors, risk score & funding goals</li>
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
