// Maps a data file to the keywords that identify it in a student's free-text
// major answer. Multi-word keywords are matched as substrings (safe, since
// they're specific); single-word/abbreviation keywords are matched as whole
// words only, to avoid false positives (e.g. "ce" matching inside "science").
// Order matters: more specific entries are checked first so e.g. "management
// information systems" resolves to MIS rather than the generic Management
// concentration (which also contains the word "management").
// Ported verbatim from agent_groq.py PROGRAM_FILES.
export const PROGRAM_FILES: Array<[filename: string, keywords: string[]]> = [
  ["cs_prerequisites.json", ["computer science", "cs", "cmps"]],
  ["ce_prerequisites.json", ["computer engineering", "ce", "cmpe"]],
  ["ee_prerequisites.json", ["electrical engineering", "ee", "elec"]],
  ["bba_mis_prerequisites.json", ["management information systems", "mis", "mist"]],
  ["bba_accounting_prerequisites.json", ["accounting", "acct"]],
  ["bba_finance_prerequisites.json", ["finance", "fina"]],
  ["bba_economics_prerequisites.json", ["economics", "econ"]],
  ["bba_marketing_prerequisites.json", ["marketing", "makt"]],
  ["bba_management_prerequisites.json", ["management", "magt"]],
];

export const FALLBACK_FILE = "other_programs.json";

// If a student says "business administration"/"bba"/"business" without
// naming a specific concentration, none of the 6 BBA-specific keyword sets
// above match (each requires its own concentration name). Rather than
// routing that to the generic "unlisted major" fallback — which would be
// misleading, since we DO support BBA, just need to know which of the 6 —
// load_program_data returns a dedicated response asking the student to pick one.
export const BBA_GENERIC_KEYWORDS = ["business administration", "bba", "business"];
export const BBA_CONCENTRATIONS = [
  "Accounting",
  "Management Information Systems",
  "Economics",
  "Finance",
  "Management",
  "Marketing",
];

export const ALL_PROGRAM_FILENAMES = [...PROGRAM_FILES.map(([f]) => f), FALLBACK_FILE];
