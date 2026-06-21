import React, { useState } from "react";

export default function DecisionMoment() {
  const [value, setValue] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  function handleConfirm() {
    if (value.trim().length === 0) return;
    setConfirmed(true);
  }

  return (
    <div className="decision-moment">
      <h3>Your next step</h3>
      <p className="sub">
        This tool structured the tradeoffs. It does not know your full life and it will never
        pick for you. What are you deciding, based on what you just read?
      </p>
      <textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setConfirmed(false);
        }}
        placeholder="e.g. I'm going to apply to grad school but ask for a deferral so I can take the job for one year first…"
      />
      <button className="submit-btn" type="button" onClick={handleConfirm}>
        Record my decision
      </button>
      {confirmed && (
        <p className="confirm-msg">
          Recorded. This was your call — not the model's. Revisit anytime your constraints change.
        </p>
      )}
    </div>
  );
}
