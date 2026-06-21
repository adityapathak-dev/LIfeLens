/**
 * DEGREE CATALOG
 * Flat list of all degrees grouped by category.
 * Each entry: { value, label, category }
 *
 * This replaces the two-step Stream → Degree flow with a single
 * searchable degree picker. The `category` field is sent to the
 * backend so exam discovery still has category context.
 */

export const DEGREE_CATALOG = [
  // ── Engineering ──────────────────────────────────────────────
  { value: "btech",         label: "B.Tech",                       category: "Engineering" },
  { value: "be",            label: "B.E.",                         category: "Engineering" },
  { value: "btech_mtech",   label: "Integrated B.Tech + M.Tech",   category: "Engineering" },
  { value: "mtech",         label: "M.Tech",                       category: "Engineering" },
  { value: "me",            label: "M.E.",                         category: "Engineering" },
  { value: "ms_engg",       label: "M.S. (Engineering)",           category: "Engineering" },

  // ── Medical ──────────────────────────────────────────────────
  { value: "mbbs",          label: "MBBS",                         category: "Medical" },
  { value: "bds",           label: "BDS",                          category: "Medical" },
  { value: "bams",          label: "BAMS",                         category: "Medical" },
  { value: "bhms",          label: "BHMS",                         category: "Medical" },
  { value: "bums",          label: "BUMS",                         category: "Medical" },
  { value: "bnys",          label: "BNYS",                         category: "Medical" },
  { value: "bpt",           label: "BPT (Physiotherapy)",          category: "Medical" },
  { value: "bsc_nursing",   label: "B.Sc Nursing",                 category: "Medical" },
  { value: "md",            label: "MD",                           category: "Medical" },
  { value: "ms_medical",    label: "MS (Medical)",                 category: "Medical" },

  // ── Science ──────────────────────────────────────────────────
  { value: "bsc",           label: "B.Sc",                         category: "Science" },
  { value: "bsc_physics",   label: "B.Sc Physics",                 category: "Science" },
  { value: "bsc_chemistry", label: "B.Sc Chemistry",               category: "Science" },
  { value: "bsc_maths",     label: "B.Sc Mathematics",             category: "Science" },
  { value: "bsc_biology",   label: "B.Sc Biology",                 category: "Science" },
  { value: "bs",            label: "BS",                           category: "Science" },
  { value: "bs_ms",         label: "BS-MS (Dual Degree)",          category: "Science" },
  { value: "bstat",         label: "B.Stat",                       category: "Science" },
  { value: "bmath",         label: "B.Math",                       category: "Science" },
  { value: "msc",           label: "M.Sc",                         category: "Science" },

  // ── Computer Science ─────────────────────────────────────────
  { value: "bca",           label: "BCA",                          category: "Computer Science" },
  { value: "bsc_cs",        label: "B.Sc Computer Science",        category: "Computer Science" },
  { value: "bsc_ai",        label: "B.Sc AI",                      category: "Computer Science" },
  { value: "bsc_ds",        label: "B.Sc Data Science",            category: "Computer Science" },
  { value: "bsc_it",        label: "B.Sc IT",                      category: "Computer Science" },
  { value: "mca",           label: "MCA",                          category: "Computer Science" },
  { value: "mtech_cs",      label: "M.Tech Computer Science",      category: "Computer Science" },

  // ── Commerce ─────────────────────────────────────────────────
  { value: "bcom",          label: "B.Com",                        category: "Commerce" },
  { value: "bcom_hons",     label: "B.Com (Hons)",                 category: "Commerce" },
  { value: "bba",           label: "BBA",                          category: "Commerce" },
  { value: "bms",           label: "BMS",                          category: "Commerce" },
  { value: "mcom",          label: "M.Com",                        category: "Commerce" },

  // ── Management ───────────────────────────────────────────────
  { value: "mba",           label: "MBA",                          category: "Management" },
  { value: "pgdm",          label: "PGDM",                         category: "Management" },
  { value: "mba_dual",      label: "Dual Degree MBA",              category: "Management" },
  { value: "executive_mba", label: "Executive MBA",                category: "Management" },

  // ── Law ──────────────────────────────────────────────────────
  { value: "ba_llb",        label: "BA LLB",                       category: "Law" },
  { value: "bba_llb",       label: "BBA LLB",                      category: "Law" },
  { value: "bcom_llb",      label: "B.Com LLB",                    category: "Law" },
  { value: "llb",           label: "LLB (3-year)",                 category: "Law" },
  { value: "llm",           label: "LLM",                          category: "Law" },

  // ── Design ───────────────────────────────────────────────────
  { value: "bdes",          label: "B.Des",                        category: "Design" },
  { value: "bfa",           label: "BFA",                          category: "Design" },
  { value: "fashion_design",label: "Fashion Design",               category: "Design" },
  { value: "product_design",label: "Product Design",               category: "Design" },
  { value: "mdes",          label: "M.Des",                        category: "Design" },

  // ── Architecture ─────────────────────────────────────────────
  { value: "barch",         label: "B.Arch",                       category: "Architecture" },
  { value: "bplan",         label: "B.Plan",                       category: "Architecture" },
  { value: "march",         label: "M.Arch",                       category: "Architecture" },

  // ── Agriculture ──────────────────────────────────────────────
  { value: "bsc_agri",      label: "B.Sc Agriculture",             category: "Agriculture" },
  { value: "btech_agri",    label: "B.Tech Agriculture",           category: "Agriculture" },
  { value: "msc_agri",      label: "M.Sc Agriculture",             category: "Agriculture" },

  // ── Defence ──────────────────────────────────────────────────
  { value: "btech_def",     label: "B.Tech (Defence)",             category: "Defence" },
  { value: "ba_def",        label: "BA (Military Studies)",        category: "Defence" },

  // ── Hotel Management ─────────────────────────────────────────
  { value: "bsc_hm",        label: "B.Sc Hotel Management",        category: "Hotel Management" },
  { value: "bhmct",         label: "BHMCT",                        category: "Hotel Management" },
  { value: "mba_hm",        label: "MBA (Hospitality)",            category: "Hotel Management" },

  // ── Pharmacy ─────────────────────────────────────────────────
  { value: "bpharm",        label: "B.Pharm",                      category: "Pharmacy" },
  { value: "dpharm",        label: "D.Pharm",                      category: "Pharmacy" },
  { value: "mpharm",        label: "M.Pharm",                      category: "Pharmacy" },
  { value: "pharmd",        label: "Pharm.D",                      category: "Pharmacy" },

  // ── Arts & Humanities ────────────────────────────────────────
  { value: "ba",            label: "BA",                           category: "Arts & Humanities" },
  { value: "ba_hons",       label: "BA (Hons)",                    category: "Arts & Humanities" },
  { value: "ba_psychology", label: "BA Psychology",                category: "Arts & Humanities" },
  { value: "ba_economics",  label: "BA Economics",                 category: "Arts & Humanities" },
  { value: "ba_english",    label: "BA English",                   category: "Arts & Humanities" },
  { value: "ba_sociology",  label: "BA Sociology",                 category: "Arts & Humanities" },
  { value: "ma",            label: "MA",                           category: "Arts & Humanities" },
  { value: "bfa_arts",      label: "BFA (Fine Arts)",              category: "Arts & Humanities" },

  // ── Teaching ─────────────────────────────────────────────────
  { value: "bed",           label: "B.Ed",                         category: "Teaching" },
  { value: "med",           label: "M.Ed",                         category: "Teaching" },
  { value: "deled",         label: "D.El.Ed",                      category: "Teaching" },
  { value: "beled",         label: "B.El.Ed",                      category: "Teaching" },

  // ── Research ─────────────────────────────────────────────────
  { value: "phd",           label: "PhD",                          category: "Research" },
  { value: "int_phd",       label: "Integrated PhD",               category: "Research" },
  { value: "ms_research",   label: "M.S. (Research)",              category: "Research" },
  { value: "mphil",         label: "M.Phil",                       category: "Research" },
];

/**
 * Get unique category names in display order
 */
export const DEGREE_CATEGORIES = [
  "Engineering",
  "Medical",
  "Science",
  "Computer Science",
  "Commerce",
  "Management",
  "Law",
  "Design",
  "Architecture",
  "Agriculture",
  "Defence",
  "Hotel Management",
  "Pharmacy",
  "Arts & Humanities",
  "Teaching",
  "Research",
];

/**
 * Get degrees grouped by category (for grouped dropdown rendering)
 */
export function getDegreesByCategory() {
  return DEGREE_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = DEGREE_CATALOG.filter((d) => d.category === cat);
    return acc;
  }, {});
}

/**
 * Look up a degree entry by value
 */
export function getDegreeByValue(value) {
  return DEGREE_CATALOG.find((d) => d.value === value) || null;
}

// Keep legacy exports for any other component that may still reference them
export const EXAM_CATEGORIES = DEGREE_CATEGORIES;
export const STREAM_DEGREE_MAP = getDegreesByCategory();
