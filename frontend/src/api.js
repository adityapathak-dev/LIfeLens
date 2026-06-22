const BASE = "/api";

export async function runReasoning(payload) {
  const res = await fetch(`${BASE}/reason`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export async function sendChatMessage({ decision_type, history, country, field, colleges, context }) {
  const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision_type, history, country, field, colleges, context }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Chat request failed with status ${res.status}`);
  }
  return res.json();
}

export async function analyzeIdea(idea, field, answers = null) {
  const res = await fetch(`${BASE}/idea-meter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idea, field, answers }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Idea meter request failed with status ${res.status}`);
  }
  return res.json();
}

export async function parseResume(file, country = "") {
  const formData = new FormData();
  formData.append("resume", file);
  if (country) formData.append("country", country);

  const res = await fetch(`${BASE}/resume/parse`, {
    method: "POST",
    body: formData,
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || `Resume parse failed with status ${res.status}`);
    err.diagnostics = body.diagnostics || null;
    err.status = res.status;
    throw err;
  }
  return body;
}

export async function checkResumeATS(parsedResume, country = "") {
  const res = await fetch(`${BASE}/resume/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parsedResume, country }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || `ATS check failed with status ${res.status}`);
    err.diagnostics = body.diagnostics || null;
    err.status = res.status;
    throw err;
  }
  return body;
}

export async function discoverExams(country, category = "", degree = "") {
  const res = await fetch(`${BASE}/exams/discover`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ country, category, degree }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Exam discovery failed with status ${res.status}`);
  }
  return res.json();
}
