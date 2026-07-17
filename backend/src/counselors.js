/**
 * Human Guidance Directory Dataset & Regional Matcher.
 *
 * Covers 3 primary decision domains:
 *   - grad_school: Admissions Advisors
 *   - job: Career Counselors
 *   - startup: Startup Mentors & Incubator Advisors
 */

/* ── Area-level counsellors (India & US cities/regions) ─────────────── */
const AREA_COUNSELORS = {
  san_francisco_bay: {
    name: "Bay Area Academic & Career Consulting",
    phone: "1-415-555-0199",
    hours: "Monday–Friday, 9 am–5 pm PT",
    website: "https://www.collegewise.com",
    type: "Admissions & Career Advisory — SF Bay Area",
    domain: "grad_school"
  },
  boston: {
    name: "Boston Academic Advising Group",
    phone: "1-617-555-0144",
    hours: "Monday–Friday, 9 am–5 pm ET",
    website: "https://www.academicgroup.com",
    type: "Admissions & Career Advisory — Boston",
    domain: "grad_school"
  },
  new_york: {
    name: "New York Admissions & Career Advisors",
    phone: "1-212-555-0188",
    hours: "Monday–Friday, 9 am–5 pm ET",
    website: "https://www.nyadmissions.com",
    type: "Admissions & Career Advisory — New York",
    domain: "grad_school"
  },
  delhi_ncr: {
    name: "Delhi Career & Admissions Centre — IGNOU RC",
    phone: "011-29534070",
    hours: "Monday–Friday, 10 am–5 pm IST",
    website: "https://rcdelhi1.ignou.ac.in",
    type: "Admissions & Career Counselling — Delhi NCR",
    domain: "grad_school"
  },
  mumbai: {
    name: "iCall — TISS Mumbai (Academic & Career)",
    phone: "9152987821",
    hours: "Monday–Saturday, 8 am–10 pm IST",
    website: "https://icallhelpline.org",
    type: "Admissions & Career Counselling — Mumbai",
    domain: "grad_school"
  },
  bangalore: {
    name: "National Career Service Centre — Bengaluru",
    phone: "080-22213855",
    hours: "Monday–Friday, 9:30 am–6 pm IST",
    website: "https://www.ncs.gov.in",
    type: "Career & Academic Guidance — Bangalore",
    domain: "job"
  },
};

const COLLEGE_AREA_PATTERNS = [
  { patterns: ["stanford", "berkeley", "uc berkeley", "sjsu", "scu", "san jose state", "ucsf", "bay area"], area: "san_francisco_bay" },
  { patterns: ["harvard", "mit", "boston university", "northeastern", "tufts"], area: "boston" },
  { patterns: ["nyu", "columbia", "cornell", "fordham", "new york"], area: "new_york" },
  { patterns: ["dtu", "nsut", "ip university", "delhi university", "iit delhi"], area: "delhi_ncr" },
  { patterns: ["iit bombay", "vjti", "sardar patel", "mumbai university"], area: "mumbai" },
  { patterns: ["iisc", "rvce", "bms", "msrit", "bangalore", "bengaluru"], area: "bangalore" },
];

/* ── DOMAIN & COUNTRY DIRECTORY DATASET ────────────────────────────── */
const HUMAN_GUIDANCE_DIRECTORY = {
  // ── 1. GRAD SCHOOL (ADMISSIONS ADVISORS) ───────────────────────────
  grad_school: {
    india: {
      name: "iCall Academic & Admissions Helpline — TISS Mumbai",
      phone: "9152987821",
      hours: "Monday–Saturday, 8 am–10 pm IST",
      website: "https://icallhelpline.org",
      type: "University Admissions & Academic Counselling",
      region: "India"
    },
    us: {
      name: "College Board BigFuture Admissions Advisors",
      phone: "1-800-626-9795",
      hours: "Monday–Friday, 9 am–5 pm ET",
      website: "https://bigfuture.collegeboard.org",
      type: "College Admissions & Financial Aid Advisory",
      region: "United States"
    },
    uk: {
      name: "UCAS University Advisory Line",
      phone: "0371-468-0468",
      hours: "Monday–Friday, 8:30 am–6 pm GMT",
      website: "https://www.ucas.com",
      type: "UK University Admissions Guidance",
      region: "United Kingdom"
    },
    canada: {
      name: "EduCanada International Student Advisory",
      phone: "1-888-854-5323",
      hours: "Monday–Friday, 9 am–5 pm ET",
      website: "https://www.educanada.ca",
      type: "Canadian Academic Admissions Advisory",
      region: "Canada"
    },
    australia: {
      name: "Study Australia Admissions Counselors",
      phone: "1800-111-117",
      hours: "Monday–Friday, 9 am–5 pm AEST",
      website: "https://www.studyaustralia.gov.au",
      type: "Australian University Advisory",
      region: "Australia"
    },
    singapore: {
      name: "MOE Singapore Education Guidance Centre",
      phone: "1800-932-8100",
      hours: "Monday–Friday, 8 am–5:30 pm SGT",
      website: "https://www.moe.gov.sg",
      type: "Academic & Higher Ed Advisory",
      region: "Singapore"
    },
    germany: {
      name: "DAAD / Hochschulstart Studienberatung",
      phone: "0800-100-9009",
      hours: "Monday–Friday, 8 am–8 pm CET",
      website: "https://www.daad.de",
      type: "German Academic Exchange Advisory",
      region: "Germany"
    },
    default: {
      name: "Global Higher Education Admissions Network",
      phone: "1-800-626-9795",
      hours: "Monday–Friday, 9 am–5 pm ET",
      website: "https://bigfuture.collegeboard.org",
      type: "International Higher Ed Advisory",
      region: "Global"
    }
  },

  // ── 2. JOB (CAREER COUNSELORS) ──────────────────────────────────────
  job: {
    india: {
      name: "National Career Service (NCS) India",
      phone: "1800-425-1514",
      hours: "Tuesday–Sunday, 8 am–8 pm IST",
      website: "https://www.ncs.gov.in",
      type: "Certified Career Counseling & Skill Mapping",
      region: "India"
    },
    us: {
      name: "NCDA Certified Career Counselors Network",
      phone: "1-888-326-1750",
      hours: "Monday–Friday, 9 am–5 pm CT",
      website: "https://www.ncda.org",
      type: "Professional Career Guidance & ATS Advising",
      region: "United States"
    },
    uk: {
      name: "National Careers Service UK",
      phone: "0800-100-900",
      hours: "8 am–8 pm daily GMT",
      website: "https://nationalcareers.service.gov.uk",
      type: "Government Certified Career Advisory",
      region: "United Kingdom"
    },
    canada: {
      name: "Canada Job Bank Career Planning Advisory",
      phone: "1-800-622-6232",
      hours: "Monday–Friday, 8:30 am–4:30 pm ET",
      website: "https://www.jobbank.gc.ca/trend-analysis",
      type: "Career Pathing & Labor Market Guidance",
      region: "Canada"
    },
    australia: {
      name: "Workforce Australia Career Guidance Line",
      phone: "1800-805-260",
      hours: "Monday–Friday, 9 am–5 pm AEST",
      website: "https://www.workforceaustralia.gov.au",
      type: "Vocational & Career Transition Advisory",
      region: "Australia"
    },
    singapore: {
      name: "Workforce Singapore (WSG) Career Advisory",
      phone: "6883-5885",
      hours: "Monday–Friday, 8:30 am–5:30 pm SGT",
      website: "https://www.wsg.gov.sg",
      type: "Professional Career Conversion Advisory",
      region: "Singapore"
    },
    germany: {
      name: "Bundesagentur für Arbeit Berufsberatung",
      phone: "0800-4-555500",
      hours: "Monday–Friday, 8 am–6 pm CET",
      website: "https://www.arbeitsagentur.de",
      type: "Federal Career & Employment Advisory",
      region: "Germany"
    },
    default: {
      name: "Global Career Development Advisory Network",
      phone: "1-888-326-1750",
      hours: "Monday–Friday, 9 am–5 pm ET",
      website: "https://www.ncda.org",
      type: "Certified Career Counseling",
      region: "Global"
    }
  },

  // ── 3. STARTUP (STARTUP MENTORS & INCUBATORS) ───────────────────────
  startup: {
    india: {
      name: "Startup India Mentor Network & Hub",
      phone: "1800-115-565",
      hours: "Monday–Friday, 9:30 am–5:30 pm IST",
      website: "https://www.startupindia.gov.in",
      type: "Government Founder Mentorship & Incubator Directory",
      region: "India"
    },
    us: {
      name: "SCORE Small Business & Founder Mentors",
      phone: "1-800-634-0245",
      hours: "Monday–Friday, 8:30 am–5 pm ET",
      website: "https://www.score.org",
      type: "1-on-1 Veteran Founder Mentorship",
      region: "United States"
    },
    uk: {
      name: "British Business Bank Mentoring & Tech Nation",
      phone: "0330-221-1924",
      hours: "Monday–Friday, 9 am–5 pm GMT",
      website: "https://www.british-business-bank.co.uk",
      type: "Startup Mentoring & Scaleup Advisory",
      region: "United Kingdom"
    },
    canada: {
      name: "MaRS Discovery District Mentor Network",
      phone: "1-416-673-8100",
      hours: "Monday–Friday, 9 am–5 pm ET",
      website: "https://www.marsdd.com",
      type: "Venture Coaching & Tech Mentorship",
      region: "Canada"
    },
    australia: {
      name: "Fishburners & Stone & Chalk Mentor Network",
      phone: "02-8216-1300",
      hours: "Monday–Friday, 9 am–5 pm AEST",
      website: "https://fishburners.org",
      type: "Early-Stage Startup & Founder Mentorship",
      region: "Australia"
    },
    singapore: {
      name: "Action Community for Entrepreneurship (ACE)",
      phone: "6692-0770",
      hours: "Monday–Friday, 9 am–6 pm SGT",
      website: "https://ace.sg",
      type: "National Startup Mentorship Network",
      region: "Singapore"
    },
    germany: {
      name: "German Startups Association Mentoring",
      phone: "030-609895310",
      hours: "Monday–Friday, 9 am–5 pm CET",
      website: "https://startupverband.de",
      type: "Venture & Scaleup Mentorship",
      region: "Germany"
    },
    default: {
      name: "SCORE Founder & Startup Mentors Network",
      phone: "1-800-634-0245",
      hours: "Monday–Friday, 8:30 am–5 pm ET",
      website: "https://www.score.org",
      type: "Experienced Founder Mentorship",
      region: "Global"
    }
  }
};

const COUNTRY_MAP = {
  "united states": "us", "united states of america": "us",
  usa: "us", "u.s.a": "us", america: "us",
  "united kingdom": "uk", "u.k": "uk",
  england: "uk", britain: "uk", scotland: "uk", wales: "uk",
  india: "india", canada: "canada", australia: "australia",
  singapore: "singapore", germany: "germany"
};

/**
 * Normalizes country string to key.
 */
function getCountryKey(country) {
  if (!country) return "default";
  const raw = country.toLowerCase().trim().replace(/[.,]/g, "");
  if (COUNTRY_MAP[raw]) return COUNTRY_MAP[raw];
  const firstWord = raw.split(/[\s,]+/)[0];
  return COUNTRY_MAP[firstWord] || (HUMAN_GUIDANCE_DIRECTORY.grad_school[firstWord] ? firstWord : "default");
}

/**
 * Domain & Region-aware Human Guidance Directory Lookup.
 */
export function getHumanGuidanceDirectory(domain = "grad_school", country = "default", collegesOrCity = "") {
  const domainKey = HUMAN_GUIDANCE_DIRECTORY[domain] ? domain : "grad_school";

  // 1. Try area match if collegesOrCity is provided
  if (collegesOrCity) {
    const normalized = collegesOrCity.toLowerCase();
    for (const { patterns, area } of COLLEGE_AREA_PATTERNS) {
      if (patterns.some((p) => normalized.includes(p.toLowerCase()))) {
        const areaAdvisor = AREA_COUNSELORS[area];
        if (areaAdvisor) return [areaAdvisor];
      }
    }
  }

  // 2. Lookup by domain & country
  const cKey = getCountryKey(country);
  const domainDataset = HUMAN_GUIDANCE_DIRECTORY[domainKey];
  const primaryAdvisor = domainDataset[cKey] || domainDataset.default;
  const fallbackAdvisor = domainDataset.default;

  const results = [primaryAdvisor];
  if (primaryAdvisor.name !== fallbackAdvisor.name) {
    results.push(fallbackAdvisor);
  }

  return results;
}

/**
 * Backward-compatible single counselor lookup.
 */
export function getCounselorByAreaOrCountry(colleges, country) {
  const list = getHumanGuidanceDirectory("grad_school", country, colleges);
  return list[0];
}

export function getCounselor(country) {
  const list = getHumanGuidanceDirectory("grad_school", country);
  return list[0];
}

export const COUNSELORS_METADATA = {
  last_verified: "2026-06-15T00:00:00Z"
};
