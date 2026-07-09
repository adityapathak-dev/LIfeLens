// Simple in-memory metrics tracker for monitoring application lifecycle, abuse, and model drift.

const metrics = {
  totalRequests: 0,
  guardrailViolations: 0,
  counselorTriggers: 0,
  fallbackActivations: 0,
  clientRequests: {} // ip -> array of timestamps
};

export function recordRequest(ip) {
  metrics.totalRequests++;
  if (!ip) return;
  
  const now = Date.now();
  if (!metrics.clientRequests[ip]) {
    metrics.clientRequests[ip] = [];
  }
  
  metrics.clientRequests[ip].push(now);
  
  // Clean up older timestamps (keep only last 10 seconds for rate limit detection)
  metrics.clientRequests[ip] = metrics.clientRequests[ip].filter(t => now - t < 10000);
}

export function isAbusing(ip) {
  if (!ip || !metrics.clientRequests[ip]) return false;
  // If more than 10 requests in 10 seconds, flag as potential abuse
  return metrics.clientRequests[ip].length > 10;
}

export function recordGuardrailViolation() {
  metrics.guardrailViolations++;
}

export function recordCounselorTrigger() {
  metrics.counselorTriggers++;
}

export function recordFallback() {
  metrics.fallbackActivations++;
}

export function getMetrics() {
  const ipAbuseList = Object.keys(metrics.clientRequests).filter(ip => isAbusing(ip));
  
  // Compute model drift ratio (violations per total requests)
  const driftRatio = metrics.totalRequests > 0 
    ? parseFloat((metrics.guardrailViolations / metrics.totalRequests).toFixed(4)) 
    : 0;

  return {
    total_requests: metrics.totalRequests,
    guardrail_violations: metrics.guardrailViolations,
    counselor_triggers: metrics.counselorTriggers,
    fallback_activations: metrics.fallbackActivations,
    model_drift_ratio: driftRatio,
    active_abuse_ips: ipAbuseList,
    system_time: new Date().toISOString()
  };
}
