import React from "react";
import ConfidenceStamp from "./ConfidenceStamp.jsx";

export default function PathColumn({ projection, factor, branchQuestions, onBranchClick }) {
  return (
    <div className="path-column">
      <div className="path-column__label">
        <span>{projection.path}</span>
        <ConfidenceStamp level={projection.confidence} />
      </div>

      {factor && <p className="path-column__factor">"{factor}"</p>}

      <div className="outcome-block">
        <h4>Short-term (6–12mo)</h4>
        <p>{projection.short_term_outcome}</p>
      </div>

      <div className="outcome-block">
        <h4>Long-term</h4>
        <p>{projection.long_term_outcome}</p>
      </div>

      <div className="outcome-block risk">
        <h4>Key risk</h4>
        <p>{projection.key_risk}</p>
      </div>

      <div className="outcome-block">
        <h4>Key assumption</h4>
        <p>{projection.key_assumption}</p>
      </div>

      {branchQuestions?.length > 0 && (
        <div className="branch-questions">
          {branchQuestions.map((q, i) => (
            <button key={i} type="button" onClick={() => onBranchClick(projection.path, q)}>
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
