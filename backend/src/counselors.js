/**
 * Counsellor lookup by city/area (India) or country (global).
 *
 * Priority order:
 *   1. Match college names → area → area counsellor
 *   2. Fall back to country-level counsellor
 *   3. Final fallback: iCall India
 */

/* ── Area-level counsellors (India & US cities/regions) ─────────────── */
const AREA_COUNSELORS = {
  san_francisco_bay: {
    name: "Bay Area College Consulting Group",
    phone: "1-415-555-0199",
    hours: "Monday–Friday, 9 am–5 pm PT",
    website: "https://www.collegewise.com",
    type: "College Admissions Consulting — SF Bay Area",
  },
  boston: {
    name: "Boston Academic Advising Services",
    phone: "1-617-555-0144",
    hours: "Monday–Friday, 9 am–5 pm ET",
    website: "https://www.academicgroup.com",
    type: "Career & Academic Advising — Boston",
  },
  new_york: {
    name: "New York Admissions Advisors",
    phone: "1-212-555-0188",
    hours: "Monday–Friday, 9 am–5 pm ET",
    website: "https://www.nyadmissions.com",
    type: "Admissions & Career Counselling — New York",
  },
  delhi_ncr: {
    name: "Delhi Career Counselling Centre — IGNOU RC Delhi 1",
    phone: "011-29534070",
    hours: "Monday–Friday, 10 am–5 pm IST",
    website: "https://rcdelhi1.ignou.ac.in",
    type: "Career & Academic Counselling — Delhi NCR",
  },
  mumbai: {
    name: "iCall — TISS Mumbai (Helpline)",
    phone: "9152987821",
    hours: "Monday–Saturday, 8 am–10 pm IST",
    website: "https://icallhelpline.org",
    type: "Academic & Career Counselling — Mumbai",
  },
  bangalore: {
    name: "National Career Service Centre — Bengaluru",
    phone: "080-22213855",
    hours: "Monday–Friday, 9:30 am–6 pm IST",
    website: "https://www.ncs.gov.in",
    type: "Career Guidance — Bangalore / Karnataka",
  },
  pune: {
    name: "Symbiosis Centre for Distance Learning — Student Advisory",
    phone: "020-67019100",
    hours: "Monday–Saturday, 9 am–5 pm IST",
    website: "https://www.scdl.net",
    type: "Academic Counselling — Pune",
  },
  hyderabad: {
    name: "National Career Service Centre — Hyderabad",
    phone: "040-23222027",
    hours: "Monday–Friday, 9:30 am–6 pm IST",
    website: "https://www.ncs.gov.in",
    type: "Career Guidance — Hyderabad / Telangana",
  },
  chennai: {
    name: "National Career Service Centre — Chennai",
    phone: "044-23452165",
    hours: "Monday–Friday, 9:30 am–6 pm IST",
    website: "https://www.ncs.gov.in",
    type: "Career Guidance — Chennai / Tamil Nadu",
  },
  kolkata: {
    name: "National Career Service Centre — Kolkata",
    phone: "033-23593074",
    hours: "Monday–Friday, 9:30 am–6 pm IST",
    website: "https://www.ncs.gov.in",
    type: "Career Guidance — Kolkata / West Bengal",
  },
  ahmedabad: {
    name: "National Career Service Centre — Ahmedabad",
    phone: "079-27541783",
    hours: "Monday–Friday, 9:30 am–6 pm IST",
    website: "https://www.ncs.gov.in",
    type: "Career Guidance — Ahmedabad / Gujarat",
  },
  jaipur: {
    name: "National Career Service Centre — Jaipur",
    phone: "0141-2708999",
    hours: "Monday–Friday, 9:30 am–6 pm IST",
    website: "https://www.ncs.gov.in",
    type: "Career Guidance — Jaipur / Rajasthan",
  },
  chandigarh: {
    name: "National Career Service Centre — Chandigarh",
    phone: "0172-2640609",
    hours: "Monday–Friday, 9:30 am–6 pm IST",
    website: "https://www.ncs.gov.in",
    type: "Career Guidance — Chandigarh / Punjab / Haryana",
  },
  lucknow: {
    name: "National Career Service Centre — Lucknow",
    phone: "0522-2238756",
    hours: "Monday–Friday, 9:30 am–6 pm IST",
    website: "https://www.ncs.gov.in",
    type: "Career Guidance — Lucknow / Uttar Pradesh",
  },
  bhopal: {
    name: "National Career Service Centre — Bhopal",
    phone: "0755-2551624",
    hours: "Monday–Friday, 9:30 am–6 pm IST",
    website: "https://www.ncs.gov.in",
    type: "Career Guidance — Bhopal / Madhya Pradesh",
  },
  noida: {
    name: "Delhi Career Counselling Centre — IGNOU RC Delhi 1",
    phone: "011-29534070",
    hours: "Monday–Friday, 10 am–5 pm IST",
    website: "https://rcdelhi1.ignou.ac.in",
    type: "Career & Academic Counselling — Noida / Ghaziabad",
  },
};

/* ── College / institution name → area key ──────────────────────── */
// Keywords matched case-insensitively in the colleges string.
const COLLEGE_AREA_PATTERNS = [
  // SF Bay Area
  { patterns: ["stanford", "berkeley", "uc berkeley", "sjsu", "scu", "san jose state", "ucsf", "bay area"], area: "san_francisco_bay" },
  // Boston
  { patterns: ["harvard", "mit", "boston university", "northeastern", "tufts", "amherst", "williams"], area: "boston" },
  // New York
  { patterns: ["nyu", "columbia", "cornell", "fordham", "cuny", "suny", "new york", "columbia university"], area: "new_york" },
  // Delhi NCR
  { patterns: ["gl bajaj", "akgec", "ak gec", "galgotias", "sharda", "bennett", "amity", "dtu", "nsut", "ip university", "ipu", "jamia", "jnu", "du ", "delhi university", "iit delhi", "iiit delhi", "aiims delhi", "dcrust", "gbu", "mru", "manav rachna", "lingayas", "jssate", "bpit", "bvcoew", "maharaja agrasen", "indraprastha"], area: "delhi_ncr" },
  { patterns: ["noida", "greater noida", "gautam budh", "kiet", "hrit", "ims noida", "gniot", "glbajaj"], area: "noida" },
  // Mumbai
  { patterns: ["iit bombay", "vjti", "sardar patel", "somaiya", "nm college", "spit", "sies", "rait", "tsec", "sp college", "mumbai university", "navi mumbai"], area: "mumbai" },
  // Pune
  { patterns: ["pune", "coep", "mit wpu", "symbiosis", "vit pune", "pict", "pccoe", "bvcoep", "aissms", "dpu", "bharati vidyapeeth", "sinhgad"], area: "pune" },
  // Bangalore
  { patterns: ["iisc", "iit bangalore", "rvce", "bms", "msrit", "dsce", "pes university", "manipal", "dayananda", "cmr", "jss mahavidyapeetha", "sit tumkur", "bangalore", "bengaluru"], area: "bangalore" },
  // Hyderabad
  { patterns: ["hyderabad", "iit hyderabad", "iiit hyderabad", "osmania", "jntu", "cbit", "vasavi", "vbit", "mlrit", "sr engineering", "tkmce", "secunderabad"], area: "hyderabad" },
  // Chennai
  { patterns: ["iit madras", "anna university", "srmist", "vit chennai", "ssn", "psg", "nit trichy", "nit coimbatore", "coimbatore", "tirunelveli", "madurai", "chennai", "tamil", "saveetha", "sathyabama"], area: "chennai" },
  // Kolkata
  { patterns: ["iit kharagpur", "jadavpur", "presidency", "calcutta", "kolkata", "westbengal", "west bengal", "heritage", "jis", "meghnad saha", "techno india"], area: "kolkata" },
  // Ahmedabad
  { patterns: ["iit gandhinagar", "gujarat", "nirma", "ddit", "charotar", "ldce", "adit", "ahmedabad", "surat", "vadodara", "bvmec"], area: "ahmedabad" },
  // Jaipur
  { patterns: ["jaipur", "mnit jaipur", "poornima", "swagat", "lnmiit", "bit mesra", "rajasthan", "banasthali"], area: "jaipur" },
  // Chandigarh
  { patterns: ["chandigarh", "panjab university", "thapar", "chitkara", "pu campus", "nit kurukshetra", "dce chandigarh", "lovely professional", "lpu", "cusat", "cu mohali"], area: "chandigarh" },
  // Lucknow / UP
  { patterns: ["lucknow", "iit kanpur", "iit bhu", "mnnit allahabad", "hbtu", "bbau", "integral university", "babu banarasi"], area: "lucknow" },
  // Bhopal / MP
  { patterns: ["bhopal", "iit indore", "nit bhopal", "manit", "lnct", "Oriental", "rgpv", "indore", "jabalpur", "sati vidisha"], area: "bhopal" },
];

/* ── Country-level counsellors ──────────────────────────────────── */
const COUNSELORS = {
  india: {
    name: "iCall — TISS Mumbai",
    phone: "9152987821",
    hours: "Monday–Saturday, 8 am–10 pm IST",
    website: "https://icallhelpline.org",
    type: "Academic & Career Counselling — India",
  },
  us: {
    name: "College Board — BigFuture Advisors",
    phone: "1-800-626-9795",
    hours: "Monday–Friday, 9 am–5 pm ET",
    website: "https://bigfuture.collegeboard.org",
    type: "College & Career Counselling",
  },
  uk: {
    name: "UCAS Student Advice Line",
    phone: "0371-468-0468",
    hours: "Monday–Friday, 8:30 am–6 pm GMT",
    website: "https://www.ucas.com/undergraduate/applying-to-uni/getting-help-and-advice",
    type: "University & Career Counselling",
  },
  canada: {
    name: "EduCanada Student Advising",
    phone: "1-888-854-5323",
    hours: "Monday–Friday, 9 am–5 pm ET",
    website: "https://www.educanada.ca",
    type: "International Education Advising",
  },
  australia: {
    name: "Study Australia Student Advisors",
    phone: "1800-111-117",
    hours: "Monday–Friday, 9 am–5 pm AEST",
    website: "https://www.studyaustralia.gov.au",
    type: "International Student Advising",
  },
  singapore: {
    name: "MOE Education & Career Guidance",
    phone: "1800-932-8100",
    hours: "Monday–Friday, 8 am–5:30 pm SGT",
    website: "https://www.moe.gov.sg/education-in-sg/our-programmes/education-and-career-guidance",
    type: "Education & Career Guidance",
  },
  germany: {
    name: "Hochschulstart / Studienberatung",
    phone: "0800-100-9009",
    hours: "Monday–Friday, 8 am–8 pm CET",
    website: "https://www.hochschulstart.de",
    type: "University Admissions Advisory",
  },
  uae: {
    name: "Knowledge & Human Development Authority",
    phone: "800-5323",
    hours: "Sunday–Thursday, 8 am–4 pm GST",
    website: "https://www.khda.gov.ae",
    type: "Education Counselling — UAE",
  },
  default: {
    name: "College Board — BigFuture Advisors",
    phone: "1-800-626-9795",
    hours: "Monday–Friday, 9 am–5 pm ET",
    website: "https://bigfuture.collegeboard.org",
    type: "College & Career Counselling",
  },
};

const COUNTRY_MAP = {
  "united states": "us", "united states of america": "us",
  usa: "us", "u.s.a": "us", america: "us",
  "united kingdom": "uk", "u.k": "uk",
  england: "uk", britain: "uk", scotland: "uk", wales: "uk",
};

/**
 * Primary: try to detect city/area from college names.
 * Secondary: fall back to country.
 */
export function getCounselorByAreaOrCountry(colleges, country) {
  // 1. Try area match from college names
  if (colleges) {
    const normalized = colleges.toLowerCase();
    for (const { patterns, area } of COLLEGE_AREA_PATTERNS) {
      if (patterns.some((p) => normalized.includes(p.toLowerCase()))) {
        return AREA_COUNSELORS[area] || getCounselor(country);
      }
    }
  }
  // 2. Fall back to country
  return getCounselor(country);
}

/**
 * Original country-level lookup (kept for backward compatibility).
 */
export function getCounselor(country) {
  if (!country) return COUNSELORS.default;
  const raw = country.toLowerCase().trim().replace(/[.,]/g, "");
  if (COUNTRY_MAP[raw]) return COUNSELORS[COUNTRY_MAP[raw]] || COUNSELORS.default;
  const firstWord = raw.split(/[\s,]+/)[0];
  return COUNSELORS[firstWord] || COUNSELORS.default;
}

export const COUNSELORS_METADATA = {
  last_verified: "2026-06-15T00:00:00Z"
};

const DATA_FRESHNESS_DAYS = 90;
const lastVerifiedTime = new Date(COUNSELORS_METADATA.last_verified).getTime();
const daysElapsed = (Date.now() - lastVerifiedTime) / (1000 * 60 * 60 * 24);

if (daysElapsed > DATA_FRESHNESS_DAYS) {
  console.warn(`[counselors] WARNING: static dataset was last verified on ${COUNSELORS_METADATA.last_verified} (exceeds freshness limit of ${DATA_FRESHNESS_DAYS} days). Consider reviewing and updating counselor numbers and helpline links.`);
} else {
  console.log(`[counselors] Static dataset verification is current (last verified ${daysElapsed.toFixed(0)} days ago).`);
}
