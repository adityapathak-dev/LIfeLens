import React, { useState, useEffect, useRef } from "react";
import ResumeChecker from "./ResumeChecker";
import { discoverExams } from "./api";
import CountrySelect from "./CountrySelect";
import DegreeSelect from "./DegreeSelect";

/* ── Dropdown options ─────────────────────────────────────────── */

const FINANCIAL_OPTS = [
  { value: "self-funded", label: "Self-funded / Family support" },
  { value: "scholarship", label: "Full scholarship" },
  { value: "partial-scholarship", label: "Partial scholarship" },
  { value: "student-loan", label: "Student loan" },
  { value: "employer-sponsored", label: "Employer sponsored" },
];

const SITUATION_OPTS = [
  { value: "final-year-student", label: "Final year student" },
  { value: "recent-graduate", label: "Recent graduate" },
  { value: "employed", label: "Currently employed" },
  { value: "freelancing", label: "Freelancing / Self-employed" },
  { value: "unemployed", label: "Currently not working" },
];

const ROLE_OPTS = [
  { value: "founder", label: "Co-founder / Founder" },
  { value: "early-hire", label: "Early employee / First hire" },
  { value: "evaluating", label: "Still evaluating (haven't committed)" },
];

const FUNDING_OPTS = [
  { value: "idea", label: "Just an idea (pre-product)" },
  { value: "bootstrapped", label: "Bootstrapped (self-funded)" },
  { value: "pre-seed", label: "Pre-seed funded" },
  { value: "seed", label: "Seed funded" },
  { value: "series-a-plus", label: "Series A or later" },
];

export const FIELD_OPTS = [
  { value: "ai", label: "AI / DeepTech" },
  { value: "medical", label: "Medical / HealthTech / Biotech" },
  { value: "fintech", label: "Fintech" },
  { value: "saas", label: "SaaS / B2B Software" },
  { value: "edtech", label: "Edtech / Future of Work" },
  { value: "ecommerce", label: "E-Commerce / D2C" },
  { value: "cleantech", label: "CleanTech / ClimateTech" },
  { value: "other", label: "Other / General" },
];

const DECISION_LABELS = {
  grad_school: "Graduate School",
  job: "Job Offer",
  startup: "Startup",
};

const FIELD_KEYS = {
  grad_school: ["userCountry", "userState", "userCity", "country", "targetDegree", "colleges", "financialSituation", "runway", "locationPreference"],
  job: ["userCountry", "userState", "userCity", "country", "city", "role", "companies", "skills", "currentSituation", "runway", "locationPreference"],
  startup: ["userCountry", "userState", "userCity", "country", "field", "myRole", "description", "fundingStage", "runway", "locationPreference", "riskTolerance"],
};

function countFilled(form, keys) {
  return keys.filter((k) => form[k] !== undefined && String(form[k]).trim() !== "" && form[k] !== null).length;
}

/* ── Main component ───────────────────────────────────────────── */

export default function ContextIntake({ decisionType, onSubmit, onBack }) {
  const [form, setForm] = useState({});
  const [activeTab, setActiveTab] = useState("advisor");
  const [validationError, setValidationError] = useState("");

  const userCountryLower = (form.userCountry || "").trim().toLowerCase();
  const statePlaceholder = userCountryLower === "india" ? "e.g. Karnataka" : "e.g. California";
  const cityPlaceholder = userCountryLower === "india" ? "e.g. Bangalore" : "e.g. San Francisco";

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (validationError) return;
    onSubmit(form);
  }

  const showTabs = decisionType === "job";
  const keys = FIELD_KEYS[decisionType] || [];
  const filled = countFilled(form, keys);
  const pct = keys.length > 0 ? Math.round((filled / keys.length) * 100) : 0;

  return (
    <div className="intake-wrap">
      <button className="back-btn" type="button" onClick={onBack}>
        ← Change decision type
      </button>

      {showTabs && (
        <div className="intake-tabs">
          <button
            type="button"
            className={`intake-tab-btn ${activeTab === "advisor" ? "active" : ""}`}
            onClick={() => setActiveTab("advisor")}
          >
            💼 Section A: Job Advisor
          </button>
          <button
            type="button"
            className={`intake-tab-btn ${activeTab === "ats" ? "active" : ""}`}
            onClick={() => setActiveTab("ats")}
          >
            ⚡ Section B: Resume ATS Checker
          </button>
        </div>
      )}

      {/* SECTION B Views */}
      {decisionType === "job" && activeTab === "ats" && (
        <div className="intake-card fade-in">
          <ResumeChecker
            defaultCountry={form.country || form.userCountry || ""}
            onAnalysisComplete={(parsedResume, atsResult) => {
              set("parsedResume", parsedResume);
              set("atsResult", atsResult);
              if (parsedResume.country && !form.country) {
                set("country", parsedResume.country);
              }
            }}
          />
        </div>
      )}

      {/* SECTION A Views / Grad School View */}
      {(activeTab === "advisor" || decisionType === "grad_school" || decisionType === "startup") && (
        <div className="intake-card fade-in">
          <p className="intake-eyebrow">{DECISION_LABELS[decisionType]}</p>
          <h2 className="intake-title">Tell me about your situation</h2>
          <p className="intake-hint">
            Fill in your details. Dynamic exam verification and score bounds checks will apply automatically.
          </p>

          {/* Progress bar */}
          <div className="intake-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="intake-progress-bar">
              <div className="intake-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="intake-progress-label">{filled}/{keys.length} fields</span>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Core Location Details Group */}
            <div className="location-group-box">
              <h3 className="location-group-title">📍 Current Location (Required)</h3>
              <div className="location-grid-row">
                <Field label="Current Country" id="userCountry" delay={0}>
                  <CountrySelect
                    id="userCountry"
                    placeholder="Search country..."
                    value={form.userCountry || ""}
                    onChange={(val) => set("userCountry", val)}
                    required
                  />
                </Field>
                <Field label="State / Province" id="userState" delay={0.05}>
                  <input
                    id="userState"
                    type="text"
                    placeholder={statePlaceholder}
                    value={form.userState || ""}
                    onChange={(e) => set("userState", e.target.value)}
                    required
                  />
                </Field>
                <Field label="City" id="userCity" delay={0.1}>
                  <input
                    id="userCity"
                    type="text"
                    placeholder={cityPlaceholder}
                    value={form.userCity || ""}
                    onChange={(e) => set("userCity", e.target.value)}
                    required
                  />
                </Field>
              </div>
            </div>

            {decisionType === "grad_school" && (
              <GradSchoolFields form={form} set={set} setParentValidationError={setValidationError} />
            )}
            {decisionType === "job" && <JobFields form={form} set={set} />}
            {decisionType === "startup" && <StartupFields form={form} set={set} />}

            {validationError && (
              <div className="error-alert" style={{ marginBottom: "16px" }}>
                ⚠️ {validationError}
              </div>
            )}

            <button className="submit-btn" type="submit" disabled={Boolean(validationError)}>
              Start the conversation →
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

/* ── Field helpers ────────────────────────────────────────────── */

function Field({ label, id, hint, children, wide, delay = 0 }) {
  return (
    <div
      className={`intake-field${wide ? " wide" : ""}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {label && (
        <label htmlFor={id} className="field-label">
          {label}
        </label>
      )}
      {hint && <span className="field-hint">{hint}</span>}
      {children}
    </div>
  );
}

export function Select({ id, value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOpt = options.find((o) => o.value === value);

  return (
    <div className={`custom-select-container ${isOpen ? "open" : ""}`} ref={containerRef} id={id}>
      <button
        type="button"
        className={`custom-select-trigger ${isOpen ? "open" : ""} ${!selectedOpt ? "placeholder" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOpt ? selectedOpt.label : "Select…"}</span>
        <svg className="select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {isOpen && (
        <div className="custom-select-options">
          <div
            className="custom-select-option"
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
          >
            Select…
          </div>
          {options.map((o) => (
            <div
              key={o.value}
              className={`custom-select-option ${o.value === value ? "selected" : ""}`}
              onClick={() => {
                onChange(o.value);
                setIsOpen(false);
              }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AutoTextarea({ id, placeholder, value, onChange, rows, ...rest }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      id={id}
      ref={textareaRef}
      className="auto-grow"
      placeholder={placeholder}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      {...rest}
    />
  );
}

function ExamCheckbox({ exam, isChecked, onToggle }) {
  return (
    <label className={`exam-checkbox-label ${isChecked ? "checked" : ""} ${exam.recommended ? "recommended" : ""}`}>
      <input
        type="checkbox"
        checked={isChecked}
        onChange={() => onToggle(exam.id)}
      />
      <div className="checkbox-info">
        <span className="exam-lbl">
          {exam.label}
          {exam.recommended && <span className="exam-recommended-tag">Best Match</span>}
        </span>
        <span className="exam-course-hint">{exam.courses}</span>
      </div>
    </label>
  );
}

/* ── Per-type field sets ──────────────────────────────────────── */

function GradSchoolFields({ form, set, setParentValidationError }) {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredExams, setDiscoveredExams] = useState([]);
  const [countryError, setCountryError] = useState("");
  const [scoreErrors, setScoreErrors] = useState({});

  const targetCountryLower = (form.country || "").trim().toLowerCase();
  let collegesPlaceholder = "e.g.\nStanford University\nUniversity of Oxford\nNational University of Singapore";
  if (targetCountryLower === "india") {
    collegesPlaceholder = "e.g.\nIIT Bombay\nBITS Pilani\nDelhi University";
  } else if (targetCountryLower === "united states" || targetCountryLower === "usa" || targetCountryLower === "us") {
    collegesPlaceholder = "e.g.\nStanford University\nMIT\nUC Berkeley";
  } else if (targetCountryLower === "united kingdom" || targetCountryLower === "uk") {
    collegesPlaceholder = "e.g.\nUniversity of Oxford\nImperial College London\nUniversity of Cambridge";
  }

  useEffect(() => {
    async function triggerDiscovery() {
      const val = form.country;
      if (!val || val.trim().length < 2) {
        setDiscoveredExams([]);
        return;
      }
      setIsDiscovering(true);
      setCountryError("");
      setParentValidationError("");
      try {
        const res = await discoverExams(
          val.trim(),
          form.streamCategory || "",
          form.targetDegree || ""
        );
        if (!res.valid_country) {
          setCountryError(res.error || "Please enter a valid country name.");
          setParentValidationError(res.error || "Please enter a valid country name.");
          setDiscoveredExams([]);
          set("selectedExams", []);
        } else {
          setDiscoveredExams(res.exams || []);
          set("selectedExams", []);
        }
      } catch (err) {
        setCountryError("Failed to perform real-time exam discovery.");
      } finally {
        setIsDiscovering(false);
      }
    }
    triggerDiscovery();
  }, [form.country, form.streamCategory, form.targetDegree]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExamToggle = (examId) => {
    const current = form.selectedExams || [];
    let updated;
    if (current.includes(examId)) {
      updated = current.filter((id) => id !== examId);
      const scores = { ...(form.examScores || {}) };
      delete scores[examId];
      set("examScores", scores);
      const errs = { ...scoreErrors };
      delete errs[examId];
      setScoreErrors(errs);
      const remainingErrs = Object.values(errs).filter(Boolean);
      setParentValidationError(remainingErrs[0] || "");
    } else {
      updated = [...current, examId];
    }
    set("selectedExams", updated);
  };

  const handleScoreChange = (examId, val, examObj) => {
    const scores = form.examScores || {};
    const nextScores = { ...scores, [examId]: val };
    set("examScores", nextScores);

    const trimmed = val.trim();
    if (!trimmed) {
      const errs = { ...scoreErrors };
      delete errs[examId];
      setScoreErrors(errs);
      const remainingErrs = Object.values(errs).filter(Boolean);
      setParentValidationError(remainingErrs[0] || "");
      return;
    }

    const num = parseFloat(trimmed);
    if (isNaN(num)) {
      setScoreErrors((prev) => {
        const next = { ...prev, [examId]: `${examObj.label}: Must be a valid number.` };
        setParentValidationError(next[examId]);
        return next;
      });
      return;
    }

    if (num < examObj.min_val || num > examObj.max_val) {
      setScoreErrors((prev) => {
        const next = {
          ...prev,
          [examId]: `${examObj.label}: Value must be between ${examObj.min_val} and ${examObj.max_val}.`,
        };
        setParentValidationError(next[examId]);
        return next;
      });
    } else {
      setScoreErrors((prev) => {
        const next = { ...prev };
        delete next[examId];
        const remainingErrs = Object.values(next).filter(Boolean);
        setParentValidationError(remainingErrs[0] || "");
        return next;
      });
    }
  };

  return (
    <div className="fields-grid">
      <Field
        label="Target Country you are applying to"
        id="country"
        hint="Select target country to dynamically discover entrance exams"
        delay={0.15}
      >
        <CountrySelect
          id="country"
          placeholder="Search country..."
          value={form.country || ""}
          onChange={(val) => set("country", val)}
          required
        />
        {isDiscovering && (
          <div className="field-researching-alert">🔍 Researching entrance pathways & requirements...</div>
        )}
        {countryError && <div className="field-error-alert">❌ {countryError}</div>}
      </Field>

      <Field
        label="Target Degree"
        id="targetDegree"
        hint="Search and select your desired degree (e.g. B.Tech, MBBS, MBA)"
        delay={0.2}
      >
        <DegreeSelect
          id="targetDegree"
          value={form.targetDegree || ""}
          onChange={(deg) => {
            if (deg) {
              set("targetDegree", deg.value);
              set("streamCategory", deg.category);
            } else {
              set("targetDegree", "");
              set("streamCategory", "");
            }
          }}
          required
        />
      </Field>

      <Field
        label="Colleges you're considering"
        id="colleges"
        hint="One per line, or comma-separated. The counselor maps to this region."
        wide
        delay={0.25}
      >
        <AutoTextarea
          id="colleges"
          placeholder={collegesPlaceholder}
          value={form.colleges || ""}
          onChange={(val) => set("colleges", val)}
          rows={3}
        />
      </Field>

      {/* Discovered selectable exams */}
      {discoveredExams.length > 0 && (() => {
        const recommendedExams = discoveredExams.filter((e) => e.recommended);
        const otherExams = discoveredExams.filter((e) => !e.recommended);
        const hasRecommendations = recommendedExams.length > 0;

        return (
          <Field
            label="Select Competitive Exam(s) Taken / Planned"
            id="exams-discovery"
            hint="Ranked and categorized according to your target degree eligibility"
            wide
            delay={0.3}
          >
            {hasRecommendations ? (
              <>
                <div className="exam-section-title">✨ Recommended For Your Degree</div>
                <div className="exams-checkbox-grid">
                  {recommendedExams.map((exam) => (
                    <ExamCheckbox
                      key={exam.id}
                      exam={exam}
                      isChecked={(form.selectedExams || []).includes(exam.id)}
                      onToggle={handleExamToggle}
                    />
                  ))}
                </div>

                {otherExams.length > 0 && (
                  <>
                    <div className="exam-section-title" style={{ marginTop: "24px" }}>📚 Other Available Exams</div>
                    <div className="exams-checkbox-grid">
                      {otherExams.map((exam) => (
                        <ExamCheckbox
                          key={exam.id}
                          exam={exam}
                          isChecked={(form.selectedExams || []).includes(exam.id)}
                          onToggle={handleExamToggle}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="exams-checkbox-grid">
                {discoveredExams.map((exam) => (
                  <ExamCheckbox
                    key={exam.id}
                    exam={exam}
                    isChecked={(form.selectedExams || []).includes(exam.id)}
                    onToggle={handleExamToggle}
                  />
                ))}
              </div>
            )}
          </Field>
        );
      })()}

      {/* Selected exam score inputs with bounds validation */}
      {(form.selectedExams || []).length > 0 && (
        <Field label="Enter Scores / Ranks" id="exams-scores" wide delay={0.35}>
          <div className="exam-scores-inputs-grid">
            {form.selectedExams.map((examId) => {
              const examObj = discoveredExams.find((e) => e.id === examId);
              if (!examObj) return null;
              const hasErr = scoreErrors[examId];
              return (
                <div key={examId} className={`exam-score-field ${hasErr ? "has-error" : ""}`}>
                  <span className="exam-score-label">{examObj.label}:</span>
                  <input
                    type="text"
                    placeholder={`e.g. ${examObj.min_val} - ${examObj.max_val}`}
                    value={form.examScores?.[examId] || ""}
                    onChange={(e) => handleScoreChange(examId, e.target.value, examObj)}
                    required
                  />
                  <span className="exam-score-hint">
                    {examObj.hint || `Valid range: ${examObj.min_val} - ${examObj.max_val}`}
                  </span>
                  {hasErr && <span className="exam-score-error-text">⚠️ {hasErr}</span>}
                </div>
              );
            })}
          </div>
        </Field>
      )}

      <Field label="Financial situation / Budget" id="financialSituation" delay={0.4}>
        <Select
          id="financialSituation"
          value={form.financialSituation}
          onChange={(v) => set("financialSituation", v)}
          options={FINANCIAL_OPTS}
        />
      </Field>

      <Field label="Savings buffer (months)" id="runway" delay={0.45}>
        <input
          id="runway"
          type="number"
          min="0"
          max="60"
          placeholder="e.g. 12"
          value={form.runway || ""}
          onChange={(e) => set("runway", e.target.value)}
        />
      </Field>

      <Field label="Location preferences" id="locationPreference" wide delay={0.5}>
        <input
          id="locationPreference"
          type="text"
          placeholder="e.g. Prefer staying near home, open to moving to Mumbai, or relocate abroad"
          value={form.locationPreference || ""}
          onChange={(e) => set("locationPreference", e.target.value)}
        />
      </Field>
    </div>
  );
}

function JobFields({ form, set }) {
  const targetCountryLower = (form.country || "").trim().toLowerCase();
  const cityPlaceholder = targetCountryLower === "india" ? "e.g. Bangalore" : "e.g. San Francisco";
  const companiesPlaceholder = targetCountryLower === "india"
    ? "e.g.\nGoogle (Senior SWE, 45 LPA)\nEarly-stage startup (18 LPA + equity)"
    : "e.g.\nGoogle (Senior Software Engineer, $160k/yr)\nEarly-stage startup ($110k/yr + equity)";

  return (
    <div className="fields-grid">
      <Field label="Target Country of Role" id="country" delay={0.15}>
        <CountrySelect
          id="country"
          placeholder="Search target country..."
          value={form.country || ""}
          onChange={(val) => set("country", val)}
          required
        />
      </Field>

      <Field label="City / Region" id="city" hint="e.g. San Francisco, London, Tokyo" delay={0.2}>
        <input
          id="city"
          type="text"
          placeholder={cityPlaceholder}
          value={form.city || ""}
          onChange={(e) => set("city", e.target.value)}
        />
      </Field>

      <Field label="Role / Job title" id="role" delay={0.25}>
        <input
          id="role"
          type="text"
          placeholder="e.g. Software Engineer, Product Manager"
          value={form.role || ""}
          onChange={(e) => set("role", e.target.value)}
        />
      </Field>

      <Field
        label="Company / Companies you're considering"
        id="companies"
        hint="Name them — it helps assess the opportunity honestly"
        wide
        delay={0.3}
      >
        <AutoTextarea
          id="companies"
          placeholder={companiesPlaceholder}
          value={form.companies || ""}
          onChange={(val) => set("companies", val)}
          rows={3}
        />
      </Field>

      <Field
        label="Your skills / tech stack"
        id="skills"
        hint="e.g. languages, frameworks, tools, domain expertise"
        wide
        delay={0.35}
      >
        <AutoTextarea
          id="skills"
          placeholder={"e.g. Python, React, AWS, 3 yrs ML experience\nor: Financial modelling, Excel, CFA Level 1"}
          value={form.skills || ""}
          onChange={(val) => set("skills", val)}
          rows={2}
        />
      </Field>

      <Field label="Your current situation" id="currentSituation" delay={0.4}>
        <Select
          id="currentSituation"
          value={form.currentSituation}
          onChange={(v) => set("currentSituation", v)}
          options={SITUATION_OPTS}
        />
      </Field>

      <Field label="Savings buffer (months)" id="runway" delay={0.45}>
        <input
          id="runway"
          type="number"
          min="0"
          max="60"
          placeholder="e.g. 6"
          value={form.runway || ""}
          onChange={(e) => set("runway", e.target.value)}
        />
      </Field>

      <Field label="Location preferences" id="locationPreference" wide delay={0.5}>
        <input
          id="locationPreference"
          type="text"
          placeholder="e.g. Commute under 30 mins, hybrid schedule, open to relocation"
          value={form.locationPreference || ""}
          onChange={(e) => set("locationPreference", e.target.value)}
        />
      </Field>
    </div>
  );
}

function StartupFields({ form, set }) {
  return (
    <div className="fields-grid">
      <Field label="Target Country / Market" id="country" delay={0.15}>
        <CountrySelect
          id="country"
          placeholder="Search target country..."
          value={form.country || ""}
          onChange={(val) => set("country", val)}
          required
        />
      </Field>

      <Field label="Startup industry field / sector" id="field" delay={0.2}>
        <Select
          id="field"
          value={form.field}
          onChange={(v) => set("field", v)}
          options={FIELD_OPTS}
        />
      </Field>

      <Field label="Your role in this startup" id="myRole" delay={0.25}>
        <Select
          id="myRole"
          value={form.myRole}
          onChange={(v) => set("myRole", v)}
          options={ROLE_OPTS}
        />
      </Field>

      <Field
        label="What does the startup do? (Explain your idea here)"
        id="description"
        hint="The AI Idea Meter will evaluate this brutally without sugarcoating it!"
        wide
        delay={0.3}
      >
        <AutoTextarea
          id="description"
          placeholder="e.g. A diagnostic AI tool that analyses MRI scans for early indicators of oncology."
          value={form.description || ""}
          onChange={(val) => set("description", val)}
          rows={2}
          required
        />
      </Field>

      <Field label="Funding stage" id="fundingStage" delay={0.35}>
        <Select
          id="fundingStage"
          value={form.fundingStage}
          onChange={(v) => set("fundingStage", v)}
          options={FUNDING_OPTS}
        />
      </Field>

      <Field label="Your savings buffer (months)" id="runway" delay={0.4}>
        <input
          id="runway"
          type="number"
          min="0"
          max="60"
          placeholder="e.g. 8"
          value={form.runway || ""}
          onChange={(e) => set("runway", e.target.value)}
        />
      </Field>

      <Field label="Location preferences" id="locationPreference" wide delay={0.45}>
        <input
          id="locationPreference"
          type="text"
          placeholder="e.g. Major startup hub (like Bangalore/NCR), co-located team, or fully remote"
          value={form.locationPreference || ""}
          onChange={(e) => set("locationPreference", e.target.value)}
        />
      </Field>

      <Field label={`Risk tolerance — ${form.riskTolerance ?? 3}/5`} id="riskTolerance" wide delay={0.5}>
        <input
          id="riskTolerance"
          type="range"
          min="1"
          max="5"
          value={form.riskTolerance ?? 3}
          onChange={(e) => set("riskTolerance", Number(e.target.value))}
        />
        <div className="range-labels">
          <span>Very cautious</span>
          <span>Very risk-tolerant</span>
        </div>
      </Field>
    </div>
  );
}
