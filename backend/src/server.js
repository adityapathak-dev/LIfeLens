import "dotenv/config";
import express from "express";
import cors from "cors";
import reasonRouter from "./reasonRoute.js";
import chatRouter from "./chatRoute.js";
import ideaMeterRouter from "./ideaMeterRoute.js";
import resumeRouter from "./resumeRoute.js";
import examDiscoveryRouter from "./examDiscoveryRoute.js";

const app = express();
app.use(cors());
app.use(express.json());

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

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Life Lens backend listening on :${PORT}`));
