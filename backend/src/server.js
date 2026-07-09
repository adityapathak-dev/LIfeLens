import "dotenv/config";
import express from "express";
import cors from "cors";
import reasonRouter from "./reasonRoute.js";
import chatRouter from "./chatRoute.js";
import ideaMeterRouter from "./ideaMeterRoute.js";
import resumeRouter from "./resumeRoute.js";
import examDiscoveryRouter from "./examDiscoveryRoute.js";
import { recordRequest, isAbusing, getMetrics } from "./usageMonitor.js";

const app = express();
app.use(cors());
app.use(express.json());

// Lifecycle & abuse monitor middleware
app.use((req, res, next) => {
  const clientIp = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
  recordRequest(clientIp);
  
  if (isAbusing(clientIp)) {
    console.warn(`[usageMonitor] Abuse detected from IP: ${clientIp}. Rate-limiting request.`);
    return res.status(429).json({ error: "Too many requests. Please slow down." });
  }
  next();
});

app.use("/api", reasonRouter);
app.use("/api", chatRouter);
app.use("/api", ideaMeterRouter);
app.use("/api", resumeRouter);
app.use("/api", examDiscoveryRouter);

// Support stripped prefixes from Vercel Services routing layer
app.use("/", reasonRouter);
app.use("/", chatRouter);
app.use("/", ideaMeterRouter);
app.use("/", resumeRouter);
app.use("/", examDiscoveryRouter);

app.get("/api/metrics", (req, res) => res.json(getMetrics()));
app.get("/metrics", (req, res) => res.json(getMetrics()));

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Life Lens backend listening on :${PORT}`));
