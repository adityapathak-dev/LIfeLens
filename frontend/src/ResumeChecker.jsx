import React, { useState, useCallback } from "react";
import { parseResume, checkResumeATS } from "./api";
import CountrySelect from "./CountrySelect";

const PIPELINE_STEPS = [
  { id: "upload", label: "File Upload" },
  { id: "extract", label: "Text Extraction" },
  { id: "parse", label: "Resume Parsing" },
  { id: "ats", label: "ATS Analysis" },
  { id: "score", label: "Score Generation" },
];

export default function ResumeChecker({ defaultCountry = "", onAnalysisComplete }) {
  const [file, setFile] = useState(null);
  const [country, setCountry] = useState(defaultCountry);
  const [loading, setLoading] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState({});
  const [error, setError] = useState("");
  const [errorDiagnostics, setErrorDiagnostics] = useState(null);
  const [isDiagnosticsExpanded, setIsDiagnosticsExpanded] = useState(true);
  const [atsResult, setAtsResult] = useState(null);
  const [parsedResume, setParsedResume] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  function setStep(id, status) {
    setPipelineStatus((prev) => ({ ...prev, [id]: status }));
  }

  const processFile = useCallback(async (selectedFile) => {
    setError("");
    setErrorDiagnostics(null);
    setAtsResult(null);
    setParsedResume(null);
    setPipelineStatus({});

    const ext = selectedFile.name.split(".").pop().toLowerCase();
    if (!["pdf", "txt", "docx", "doc"].includes(ext)) {
      setError(`Unsupported file type: .${ext}. Please upload a PDF, DOCX, DOC, or TXT file.`);
      return;
    }

    setLoading(true);

    try {
      // Step 1: Upload
      setStep("upload", "running");
      console.log("[ResumeChecker] Stage 1: Uploading file:", selectedFile.name, selectedFile.type, selectedFile.size);
      setStep("upload", "done");

      // Step 2: Extract + Parse
      setStep("extract", "running");
      setStep("parse", "running");
      console.log("[ResumeChecker] Stage 2+3: Sending to /resume/parse...");

      let parsed;
      try {
        const parseResult = await parseResume(selectedFile, country);
        parsed = parseResult.parsedResume;
        console.log("[ResumeChecker] Stage 2+3: Parsed resume:", parsed);
      } catch (err) {
        setStep("extract", "error");
        setStep("parse", "error");
        const diagMsg = err.diagnostics
          ? `Stage: ${err.diagnostics.stage || "unknown"} | ${err.diagnostics.message || err.message}`
          : err.message;
        setError(`Resume parsing failed: ${diagMsg}`);
        setErrorDiagnostics(err.diagnostics || { stage: "parse", message: err.message, status: err.status });
        setIsDiagnosticsExpanded(true);
        return;
      }

      setStep("extract", "done");
      setStep("parse", "done");
      setParsedResume(parsed);

      // Step 3: ATS check
      setStep("ats", "running");
      setStep("score", "running");
      console.log("[ResumeChecker] Stage 4: Sending to /resume/check...");

      let ats;
      try {
        ats = await checkResumeATS(parsed, country);
        console.log("[ResumeChecker] Stage 4: ATS result:", ats);
      } catch (err) {
        setStep("ats", "error");
        setStep("score", "error");
        const diagMsg = err.diagnostics
          ? `Stage: ${err.diagnostics.stage || "unknown"} | ${err.diagnostics.message || err.message}`
          : err.message;
        setError(`ATS analysis failed: ${diagMsg}`);
        setErrorDiagnostics(err.diagnostics || { stage: "ats", message: err.message, status: err.status });
        setIsDiagnosticsExpanded(true);
        return;
      }

      setStep("ats", "done");
      setStep("score", "done");
      setAtsResult(ats);

      // Notify parent
      if (onAnalysisComplete) {
        onAnalysisComplete(parsed, ats);
      }
    } finally {
      setLoading(false);
    }
  }, [country, onAnalysisComplete]);

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (f) { setFile(f); processFile(f); }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) { setFile(f); processFile(f); }
  }

  const triggerATSCheck = async () => {
    if (!file) return;
    setError("");
    setErrorDiagnostics(null);
    await processFile(file);
  };

  const scoreColor = (score) => {
    if (!score && score !== 0) return "var(--text-3)";
    if (score >= 80) return "var(--green)";
    if (score >= 60) return "var(--amber)";
    return "var(--red)";
  };

  const getResumeLoadingText = () => {
    if (pipelineStatus.score === "running") return "Generating recommendations...";
    if (pipelineStatus.ats === "running") return "Running ATS analysis...";
    if (pipelineStatus.parse === "running") return "Parsing resume...";
    if (pipelineStatus.extract === "running") return "Extracting resume text...";
    if (pipelineStatus.upload === "running") return "Uploading file...";
    return "Processing your resume...";
  };

  return (
    <div className="resume-checker-wrap">
      <div className="resume-checker-header">
        <h2 className="resume-checker-title">⚡ ATS Resume Checker</h2>
        <p className="resume-checker-subtitle">
          Upload your resume. Get a full ATS compatibility score, keyword analysis, and improvement suggestions.
        </p>
      </div>

      {/* Country select */}
      <div className="intake-field" style={{ marginBottom: "20px" }}>
        <label className="field-label" htmlFor="resume-country">
          Target Country (for ATS context)
        </label>
        <CountrySelect
          id="resume-country"
          value={country}
          onChange={setCountry}
          placeholder="Search country..."
        />
      </div>

      {/* Upload area */}
      <div
        className={`resume-drop-zone ${dragOver ? "drag-over" : ""} ${file ? "has-file" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("resume-file-input").click()}
      >
        <input
          id="resume-file-input"
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        {file ? (
          <div className="resume-drop-zone__file-info">
            <span className="resume-drop-zone__file-icon">📄</span>
            <span className="resume-drop-zone__file-name">{file.name}</span>
            <span className="resume-drop-zone__file-size">
              ({(file.size / 1024).toFixed(1)} KB)
            </span>
          </div>
        ) : (
          <div className="resume-drop-zone__placeholder">
            <span className="resume-drop-zone__icon">📎</span>
            <p className="resume-drop-zone__text">
              <strong>Click to upload</strong> or drag & drop
            </p>
            <p className="resume-drop-zone__hint">PDF, DOCX, DOC, TXT supported</p>
          </div>
        )}
      </div>

      {/* Pipeline progress */}
      {loading && (
        <div className="resume-pipeline">
          <p className="resume-pipeline__title">🔄 {getResumeLoadingText()}</p>
          <div className="resume-pipeline__steps">
            {PIPELINE_STEPS.map((step) => {
              const status = pipelineStatus[step.id];
              return (
                <div key={step.id} className={`pipeline-step ${status || "pending"}`}>
                  <span className="pipeline-step__icon">
                    {status === "done" ? "✅" : status === "running" ? "⏳" : status === "error" ? "❌" : "⭕"}
                  </span>
                  <span className="pipeline-step__label">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="error-alert" style={{ marginTop: "16px" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Error diagnostics */}
      {errorDiagnostics && (
        <div className="developer-diagnostics-card" style={{ marginTop: "16px" }}>
          <button
            className="diagnostics-toggle"
            onClick={() => setIsDiagnosticsExpanded((v) => !v)}
            type="button"
          >
            🔍 Developer Diagnostics {isDiagnosticsExpanded ? "▲" : "▼"}
          </button>
          {isDiagnosticsExpanded && (
            <div className="diagnostics-body">
              <div className="diagnostics-row">
                <span className="diagnostics-key">Stage:</span>
                <span className="diagnostics-value">{errorDiagnostics.stage || "unknown"}</span>
              </div>
              <div className="diagnostics-row">
                <span className="diagnostics-key">Message:</span>
                <span className="diagnostics-value">{errorDiagnostics.message || "No message"}</span>
              </div>
              {errorDiagnostics.status && (
                <div className="diagnostics-row">
                  <span className="diagnostics-key">HTTP Status:</span>
                  <span className="diagnostics-value">{errorDiagnostics.status}</span>
                </div>
              )}
              {errorDiagnostics.raw && (
                <div className="diagnostics-row">
                  <span className="diagnostics-key">Raw Response:</span>
                  <pre className="diagnostics-pre">{errorDiagnostics.raw}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Re-run button */}
      {file && !loading && (
        <button
          className="ats-rerun-btn"
          type="button"
          onClick={triggerATSCheck}
          style={{ marginTop: "12px" }}
        >
          🔄 Re-run Analysis
        </button>
      )}

      {/* ATS Results */}
      {atsResult && !loading && (
        <div className="ats-results">
          {/* Score header */}
          <div className="ats-score-header">
            <div className="ats-score-ring" style={{ borderColor: scoreColor(atsResult.ats_score) }}>
              <span className="ats-score-value" style={{ color: scoreColor(atsResult.ats_score) }}>
                {atsResult.ats_score ?? "–"}
              </span>
              <span className="ats-score-label">/ 100</span>
            </div>
            <div className="ats-score-meta">
              <h3 className="ats-score-title">ATS Compatibility Score</h3>
              {atsResult.verdict && (
                <p className="ats-verdict">{atsResult.verdict}</p>
              )}
            </div>
          </div>

          {/* Parsed resume info */}
          {parsedResume && (
            <div className="ats-parsed-section">
              <h4 className="ats-section-title">📋 Parsed Resume Summary</h4>
              <div className="ats-parsed-grid">
                {parsedResume.name && (
                  <div className="ats-parsed-item">
                    <span className="ats-parsed-key">Name</span>
                    <span className="ats-parsed-val">{parsedResume.name}</span>
                  </div>
                )}
                {parsedResume.email && (
                  <div className="ats-parsed-item">
                    <span className="ats-parsed-key">Email</span>
                    <span className="ats-parsed-val">{parsedResume.email}</span>
                  </div>
                )}
                {parsedResume.phone && (
                  <div className="ats-parsed-item">
                    <span className="ats-parsed-key">Phone</span>
                    <span className="ats-parsed-val">{parsedResume.phone}</span>
                  </div>
                )}
                {parsedResume.experience_years != null && (
                  <div className="ats-parsed-item">
                    <span className="ats-parsed-key">Experience</span>
                    <span className="ats-parsed-val">{parsedResume.experience_years} yrs</span>
                  </div>
                )}
              </div>
              {parsedResume.skills && parsedResume.skills.length > 0 && (
                <div className="ats-skills-wrap">
                  <span className="ats-parsed-key">Skills</span>
                  <div className="ats-skills-list">
                    {(Array.isArray(parsedResume.skills)
                      ? parsedResume.skills
                      : String(parsedResume.skills).split(",")
                    ).map((s, i) => (
                      <span key={i} className="ats-skill-tag">{String(s).trim()}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Keyword matches */}
          {atsResult.keyword_matches && atsResult.keyword_matches.length > 0 && (
            <div className="ats-section">
              <h4 className="ats-section-title">✅ Keyword Matches</h4>
              <div className="ats-skills-list">
                {atsResult.keyword_matches.map((k, i) => (
                  <span key={i} className="ats-skill-tag ats-skill-tag--match">{k}</span>
                ))}
              </div>
            </div>
          )}

          {/* Missing keywords */}
          {atsResult.missing_keywords && atsResult.missing_keywords.length > 0 && (
            <div className="ats-section">
              <h4 className="ats-section-title">⚠️ Missing Keywords</h4>
              <div className="ats-skills-list">
                {atsResult.missing_keywords.map((k, i) => (
                  <span key={i} className="ats-skill-tag ats-skill-tag--missing">{k}</span>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {atsResult.suggestions && atsResult.suggestions.length > 0 && (
            <div className="ats-section">
              <h4 className="ats-section-title">💡 Improvement Suggestions</h4>
              <ul className="ats-suggestions-list">
                {atsResult.suggestions.map((s, i) => (
                  <li key={i} className="ats-suggestion-item">{s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Section scores */}
          {atsResult.section_scores && Object.keys(atsResult.section_scores).length > 0 && (
            <div className="ats-section">
              <h4 className="ats-section-title">📊 Section Scores</h4>
              <div className="ats-section-scores-grid">
                {Object.entries(atsResult.section_scores).map(([section, score]) => (
                  <div key={section} className="ats-section-score-item">
                    <span className="ats-section-score-name">{section}</span>
                    <div className="ats-section-score-bar-wrap">
                      <div
                        className="ats-section-score-bar"
                        style={{ width: `${score}%`, background: scoreColor(score) }}
                      />
                    </div>
                    <span className="ats-section-score-val" style={{ color: scoreColor(score) }}>
                      {score}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
