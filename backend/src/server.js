import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import reasonRouter from "./reasonRoute.js";
import chatRouter from "./chatRoute.js";
import ideaMeterRouter from "./ideaMeterRoute.js";
import resumeRouter from "./resumeRoute.js";
import examDiscoveryRouter from "./examDiscoveryRoute.js";
import counselorsRouter from "./counselorsRoute.js";
import { recordRequest, isAbusing, getMetrics } from "./usageMonitor.js";

const app = express();

// ── SECURITY: Secure HTTP headers (OWASP A05) ────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));

// ── SECURITY: Strict CORS — only allow known frontend origins (OWASP A01) ────
const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ||
  "http://localhost:5173,http://localhost:3000"
).split(",").map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin, matched origins, or any .vercel.app deployment domain
    if (!origin || ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
}));

// ── SECURITY: Body size limit — prevents large-payload DoS (OWASP A04) ───────
app.use(express.json({ limit: "100kb" }));

// ── SECURITY: express-rate-limit — layered defence on top of usageMonitor ────
//   200 requests per 15 minutes per IP (covers normal browsing + burst).
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — please try again later." },
});

// Stricter limit on LLM-backed endpoints (expensive compute).
const llmLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 15,                   // 15 LLM calls per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "LLM rate limit reached. Please wait a moment." },
});

app.use(globalLimiter);

// ── SECURITY: Lifecycle & abuse monitor middleware ────────────────────────────
app.use((req, res, next) => {
  const clientIp = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
  recordRequest(clientIp);
  
  if (isAbusing(clientIp)) {
    console.warn(`[usageMonitor] Abuse detected from IP: ${clientIp}.`);
    return res.status(429).json({ error: "Too many requests. Please slow down." });
  }
  next();
});

// ── SECURITY: X-Powered-By already removed by helmet; remove redundant header ─
app.disable("x-powered-by");

// Apply stricter rate limit on all LLM-backed API routes
app.use("/api", llmLimiter);

app.use("/api", reasonRouter);
app.use("/api", chatRouter);
app.use("/api", ideaMeterRouter);
app.use("/api", resumeRouter);
app.use("/api", examDiscoveryRouter);
app.use("/api", counselorsRouter);

// Support stripped prefixes from Vercel routing layer
app.use("/", llmLimiter);
app.use("/", reasonRouter);
app.use("/", chatRouter);
app.use("/", ideaMeterRouter);
app.use("/", resumeRouter);
app.use("/", examDiscoveryRouter);
app.use("/", counselorsRouter);

// ── SECURITY: Metrics endpoint — restricted to internal/admin only ────────────
//   In production, protect this behind an internal IP check or secret token.
const METRICS_SECRET = process.env.METRICS_SECRET;
function metricsGuard(req, res, next) {
  if (METRICS_SECRET && req.headers["x-metrics-secret"] !== METRICS_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}
app.get("/api/metrics", metricsGuard, (req, res) => res.json(getMetrics()));
app.get("/metrics",     metricsGuard, (req, res) => res.json(getMetrics()));

// ── Health check — no sensitive data exposed ──────────────────────────────────
app.get("/api/health", (req, res) => res.json({ ok: true, ts: Date.now() }));
app.get("/health",     (req, res) => res.json({ ok: true, ts: Date.now() }));

// ── Global error handler — never leak stack traces to clients ─────────────────
app.use((err, req, res, _next) => {
  const isProd = process.env.NODE_ENV === "production";
  console.error("[server] Unhandled error:", err.message);
  res.status(err.status || 500).json({
    error: isProd ? "Internal server error" : err.message,
  });
});

const PORT = process.env.PORT || 4000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`LifeLens backend listening on :${PORT}`));
}

export default app;
