import { PROGRAM_DATA_MAP } from "./programDataMap";

export interface MajorOption {
  filename: string;
  label: string; // major name only, e.g. "Computer Science" or "Accounting"
}

export interface CollegeOption {
  college: string;
  majors: MajorOption[];
}

// Built once from the actual program JSON files' `college`/`program` fields
// (not hand-duplicated), so this can never drift out of sync with the data.
// "Other / not listed" is appended separately since other_programs.json
// has no real college.
function buildCollegeMajorMap(): CollegeOption[] {
  const byCollege = new Map<string, MajorOption[]>();

  for (const [filename, data] of Object.entries(PROGRAM_DATA_MAP)) {
    if (filename === "other_programs.json") continue;
    const college = data.college ?? "Other";
    // BBA program names are "Business Administration — <Concentration>";
    // show just the concentration in the major dropdown, since the college
    // ("College of Business and Economics") already establishes context.
    const label = data.program.includes("—") ? data.program.split("—")[1].trim() : data.program;
    const list = byCollege.get(college) ?? [];
    list.push({ filename, label });
    byCollege.set(college, list);
  }

  const colleges = [...byCollege.entries()]
    .map(([college, majors]) => ({
      college,
      majors: majors.sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .sort((a, b) => a.college.localeCompare(b.college));

  colleges.push({
    college: "Other",
    majors: [{ filename: "other_programs.json", label: "Other / not listed" }],
  });

  return colleges;
}

export const COLLEGE_MAJOR_MAP: CollegeOption[] = buildCollegeMajorMap();
