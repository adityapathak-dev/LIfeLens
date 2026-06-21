import React from "react";

export default function ConfidenceStamp({ level }) {
  const safeLevel = ["low", "medium", "high"].includes(level) ? level : "medium";
  return <span className={`confidence-stamp ${safeLevel}`}>{safeLevel} confidence</span>;
}
