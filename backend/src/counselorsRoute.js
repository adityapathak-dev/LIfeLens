import { Router } from "express";
import { getHumanGuidanceDirectory } from "./counselors.js";

const router = Router();

/**
 * GET /api/human-guidance (or /api/counselors)
 * Query parameters:
 *   - domain: 'grad_school' | 'job' | 'startup' (default: 'grad_school')
 *   - country: string (e.g., 'India', 'US', 'UK')
 *   - query: string (optional city/college search string)
 */
router.get("/human-guidance", (req, res) => {
  try {
    const { domain = "grad_school", country = "default", query = "" } = req.query;
    const list = getHumanGuidanceDirectory(domain, country, query);
    return res.json({
      ok: true,
      domain,
      country,
      guidance_resources: list,
      disclaimer: "🛡️ Human advisors provide external guidance and mentorship. AI assessments and advisor guidance do not constitute binding guarantees or replace formal institutional, legal, or financial decisions."
    });
  } catch (err) {
    console.error("[counselorsRoute] Error:", err.message);
    return res.status(500).json({ error: "Failed to query human guidance directory." });
  }
});

router.get("/counselors", (req, res) => {
  try {
    const { domain = "grad_school", country = "default", query = "" } = req.query;
    const list = getHumanGuidanceDirectory(domain, country, query);
    return res.json({
      ok: true,
      domain,
      country,
      guidance_resources: list,
      counselor: list[0],
      disclaimer: "🛡️ Human advisors provide external guidance and mentorship. AI assessments and advisor guidance do not replace formal professional advice."
    });
  } catch (err) {
    console.error("[counselorsRoute] Error:", err.message);
    return res.status(500).json({ error: "Failed to query human counselors." });
  }
});

export default router;
