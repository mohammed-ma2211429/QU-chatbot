import type { ProgramData } from "./types";
import { PROGRAM_FILES, FALLBACK_FILE, BBA_GENERIC_KEYWORDS, BBA_CONCENTRATIONS } from "./programFiles";
import { PROGRAM_DATA_MAP } from "./programDataMap";

function matches(text: string, words: Set<string>, keywords: string[]): boolean {
  for (const kw of keywords) {
    if (kw.includes(" ")) {
      if (text.includes(kw)) return true;
    } else if (words.has(kw)) {
      return true;
    }
  }
  return false;
}

/**
 * Match a student's free-text major answer to a program data file.
 * Ported from agent_groq.py's load_program_data. Not on the critical path
 * for the structured (dropdown-driven) onboarding flow — kept for parity
 * and for a possible future free-text/unstructured input path.
 */
export function loadProgramData(major: string | null | undefined): ProgramData {
  const majorLower = (major ?? "").toLowerCase();
  const words = new Set(majorLower.match(/[a-z]+/g) ?? []);

  for (const [filename, keywords] of PROGRAM_FILES) {
    if (matches(majorLower, words, keywords)) {
      const data = PROGRAM_DATA_MAP[filename];
      if (data) return data;
      break;
    }
  }

  if (matches(majorLower, words, BBA_GENERIC_KEYWORDS)) {
    return {
      program: "Business Administration (concentration not yet specified)",
      college: "College of Business and Economics",
      courses: [],
      fallback_instructions:
        "The student said they're in Business Administration but did not specify which of the 6 " +
        `concentrations: ${BBA_CONCENTRATIONS.join(", ")}. Ask them which concentration they're ` +
        "in before proceeding, since each has different required courses. Detailed course/prerequisite " +
        "data is not loaded until they specify — be transparent about this and advise them to verify " +
        "with their advisor in the meantime.",
    };
  }

  const fallback = PROGRAM_DATA_MAP[FALLBACK_FILE];
  if (fallback) return fallback;

  return {
    program: "Unknown Program",
    courses: [],
    fallback_instructions:
      "No program data is available. Ask the student to describe their " +
      "remaining required courses and prerequisites directly, and advise " +
      "them to verify everything with their academic advisor.",
  };
}

/** Direct lookup by exact filename — the primary path once onboarding has
 * already resolved the program via the structured college/major dropdown. */
export function getProgramDataByFile(filename: string): ProgramData | undefined {
  return PROGRAM_DATA_MAP[filename];
}
