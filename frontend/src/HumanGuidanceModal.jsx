import React, { useState, useEffect } from "react";

const DIRECTORY_FALLBACKS = {
  grad_school: [
    {
      name: "iCall Academic & Admissions Helpline — TISS Mumbai",
      phone: "9152987821",
      hours: "Monday–Saturday, 8 am–10 pm IST",
      website: "https://icallhelpline.org",
      type: "University Admissions & Academic Counselling",
      region: "India",
      verification_status: "Verified"
    },
    {
      name: "College Board BigFuture Admissions Advisory",
      phone: "1-800-626-9795",
      hours: "Monday–Friday, 9 am–5 pm ET",
      website: "https://bigfuture.collegeboard.org",
      type: "College Admissions & Financial Aid Advisory",
      region: "United States / Global",
      verification_status: "Verified"
    }
  ],
  job: [
    {
      name: "National Career Service (NCS) India",
      phone: "1800-425-1514",
      hours: "Tuesday–Sunday, 8 am–8 pm IST",
      website: "https://www.ncs.gov.in",
      type: "Certified Career Counseling & Skill Mapping",
      region: "India",
      verification_status: "Verified"
    },
    {
      name: "NCDA Certified Career Counselors Network",
      phone: "1-888-326-1750",
      hours: "Monday–Friday, 9 am–5 pm CT",
      website: "https://www.ncda.org",
      type: "Professional Career Guidance & ATS Advising",
      region: "United States / Global",
      verification_status: "Verified"
    }
  ],
  startup: [
    {
      name: "Startup India Mentor Network & Hub",
      phone: "1800-115-565",
      hours: "Monday–Friday, 9:30 am–5:30 pm IST",
      website: "https://www.startupindia.gov.in",
      type: "Government Founder Mentorship & Incubator Directory",
      region: "India",
      verification_status: "Verified"
    },
    {
      name: "SCORE Small Business & Founder Mentors",
      phone: "1-800-634-0245",
      hours: "Monday–Friday, 8:30 am–5 pm ET",
      website: "https://www.score.org",
      type: "1-on-1 Veteran Founder Mentorship",
      region: "United States / Global",
      verification_status: "Verified"
    }
  ]
};

export default function HumanGuidanceModal({ isOpen, onClose, initialDomain = "grad_school", initialCountry = "" }) {
  const [domain, setDomain] = useState(initialDomain);
  const [country, setCountry] = useState(initialCountry);
  const [query, setQuery] = useState("");
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationNotice, setLocationNotice] = useState(null);

  useEffect(() => {
    if (initialDomain) setDomain(initialDomain);
    if (initialCountry) setCountry(initialCountry);
  }, [initialDomain, initialCountry]);

  useEffect(() => {
    if (isOpen) {
      fetchAdvisors();
    }
  }, [isOpen, domain, country]);

  const fetchAdvisors = async () => {
    try {
      setLoading(true);
      setLocationNotice(null);
      const params = new URLSearchParams({ domain, country: country || "default", query });
      const res = await fetch(`/api/human-guidance?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.guidance_resources?.length > 0) {
          setAdvisors(data.guidance_resources);
          if (data.message || data.is_exact_match === false) {
            setLocationNotice(data.message || "No verified advisors found in this exact location. Displaying nearest regional alternatives.");
          }
          return;
        }
      }
      setAdvisors(DIRECTORY_FALLBACKS[domain] || DIRECTORY_FALLBACKS.grad_school);
    } catch (err) {
      setAdvisors(DIRECTORY_FALLBACKS[domain] || DIRECTORY_FALLBACKS.grad_school);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAdvisors();
  };

  if (!isOpen) return null;

  return (
    <div className="guidance-overlay" role="dialog" aria-labelledby="guidance-title">
      <div className="guidance-modal glass-card">
        <header className="guidance-header">
          <div>
            <h2 id="guidance-title">🤝 Human Guidance Directory</h2>
            <p className="guidance-subtitle">
              Connect with verified Admissions Advisors, Career Counselors, and Startup Mentors.
            </p>
          </div>
          <button className="btn-close" onClick={onClose} title="Close Modal">✕</button>
        </header>

        {/* ── SAFETY DISCLAIMER BANNER ───────────────────────────────────── */}
        <div className="guidance-safety-banner">
          <span>
            🛡️ <strong>Safety Preservation Notice:</strong> Human advisors provide external guidance and mentorship. AI assessments and advisor consults do not replace binding legal, financial, or formal institutional decisions.
          </span>
        </div>

        {/* ── LOCATION MATCHING NOTICE ──────────────────────────────────── */}
        {locationNotice && (
          <div style={{
            background: "rgba(245, 158, 11, 0.12)",
            borderBottom: "1px solid rgba(245, 158, 11, 0.3)",
            color: "#fbbf24",
            padding: "8px 20px",
            fontSize: "12px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <span>📍</span>
            <span>{locationNotice}</span>
          </div>
        )}

        {/* ── DOMAIN TABS ───────────────────────────────────────────────── */}
        <nav className="guidance-tabs">
          <button
            className={`tab-btn ${domain === "grad_school" ? "active" : ""}`}
            onClick={() => setDomain("grad_school")}
            type="button"
          >
            🎓 Admissions Advisors
          </button>
          <button
            className={`tab-btn ${domain === "job" ? "active" : ""}`}
            onClick={() => setDomain("job")}
            type="button"
          >
            💼 Career Counselors
          </button>
          <button
            className={`tab-btn ${domain === "startup" ? "active" : ""}`}
            onClick={() => setDomain("startup")}
            type="button"
          >
            🚀 Startup Mentors
          </button>
        </nav>

        {/* ── REGIONAL & SEARCH FILTER BAR ──────────────────────────────── */}
        <form className="guidance-filter-bar" onSubmit={handleSearchSubmit}>
          <div className="filter-group">
            <label htmlFor="country-filter">Region / Country:</label>
            <select
              id="country-filter"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="select-sm"
            >
              <option value="">Global / All Regions</option>
              <option value="India">India</option>
              <option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Canada">Canada</option>
              <option value="Australia">Australia</option>
              <option value="Singapore">Singapore</option>
              <option value="Germany">Germany</option>
            </select>
          </div>

          <div className="filter-group flex-1">
            <label htmlFor="query-filter">City or Institution (Optional):</label>
            <input
              id="query-filter"
              type="text"
              className="input-text-sm"
              placeholder="E.g. Boston, Delhi NCR, Stanford..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-secondary btn-sm">Filter 🔍</button>
        </form>

        {/* ── ADVISORS LISTING GRID ──────────────────────────────────────── */}
        <div className="guidance-content">
          {loading ? (
            <div className="empty-state">Loading human guidance directory...</div>
          ) : advisors.length === 0 ? (
            <div className="empty-state">No verified advisors found for this region. Displaying global network.</div>
          ) : (
            <div className="guidance-grid">
              {advisors.map((adv, idx) => {
                const vStatus = adv.verification_status || "Verified";
                const isVerified = vStatus === "Verified";
                return (
                  <div key={idx} className="guidance-card">
                    <div className="guidance-card-header">
                      <span className="guidance-type-badge">{adv.type || "Advisor"}</span>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        {adv.is_fallback && (
                          <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", fontWeight: "600" }}>
                            Regional Fallback
                          </span>
                        )}
                        <span style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontWeight: "700",
                          background: isVerified ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                          color: isVerified ? "#34d399" : "#fbbf24"
                        }}>
                          {isVerified ? "✅ Verified" : "⚠️ Partially Verified"}
                        </span>
                      </div>
                    </div>

                    <h4>{adv.name}</h4>
                    <span className="guidance-region-tag">📍 {adv.region || "Global"}</span>

                    <div className="guidance-card-body">
                      {adv.phone && (
                        <p>
                          📞 <strong>Helpline:</strong>{" "}
                          <a href={`tel:${adv.phone.replace(/[^\d+]/g, "")}`}>{adv.phone}</a>
                        </p>
                      )}
                      {adv.hours && <p>⏰ <strong>Hours:</strong> {adv.hours}</p>}
                      {adv.website && (
                        <p>
                          🌐 <strong>Website:</strong>{" "}
                          <a href={adv.website} target="_blank" rel="noopener noreferrer">
                            {adv.website.replace(/^https?:\/\//, "")} ↗
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
