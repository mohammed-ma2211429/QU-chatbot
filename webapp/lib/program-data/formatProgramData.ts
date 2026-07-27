import type { ProgramData, Course } from "./types";

/** Turn structured catalog data into the knowledge block sent to the model. */
export function formatProgramData(data: ProgramData): string {
  if (!data.courses || data.courses.length === 0) {
    const lines = [`== ${data.program ?? "Unknown Program"} ==`];
    lines.push(data.fallback_instructions ?? "");
    return lines.join("\n");
  }

  const lines: string[] = [`== ${data.program} (${data.college ?? "N/A"}) ==`];
  if (data.total_credits) {
    lines.push(`Total Required: ${data.total_credits} credit hours`);
  }
  if (data.note) {
    lines.push(`[DATA NOTE: ${data.note}]`);
  }
  lines.push("");

  const groups = new Map<string, { year: number | null; term: string | null; courses: Course[] }>();
  for (const course of data.courses) {
    const year = course.year ?? null;
    const term = course.term ?? null;
    const key = `${year}|${term}`;
    if (!groups.has(key)) {
      groups.set(key, { year, term, courses: [] });
    }
    groups.get(key)!.courses.push(course);
  }

  const sortedGroups = [...groups.values()].sort((a, b) => {
    const aYear = a.year ?? 999;
    const bYear = b.year ?? 999;
    if (aYear !== bYear) return aYear - bYear;
    return (a.term ?? "").localeCompare(b.term ?? "");
  });

  for (const { year, term, courses } of sortedGroups) {
    if (year !== null && term) {
      lines.push(`YEAR ${year} — ${term.toUpperCase()}:`);
    } else if (year !== null) {
      lines.push(`YEAR ${year}:`);
    } else {
      lines.push("YEAR/TERM NOT SPECIFIED IN SOURCE DATA:");
    }

    for (const course of courses) {
      const prereqParts: string[] = [];
      if (course.prerequisites && course.prerequisites.length > 0) {
        prereqParts.push(course.prerequisites.join(" AND "));
      }
      if (course.prerequisites_one_of && course.prerequisites_one_of.length > 0) {
        prereqParts.push("one of: " + course.prerequisites_one_of.join(" or "));
      }
      if (course.min_credit_hours) {
        prereqParts.push(`${course.min_credit_hours} CH completed`);
      }
      if (course.corequisites && course.corequisites.length > 0) {
        prereqParts.push(`concurrent or completed: ${course.corequisites.join(" AND ")}`);
      }
      const prereqStr = prereqParts.length > 0 ? ` [requires ${prereqParts.join(" AND ")}]` : " [no prerequisite]";
      const details = [
        course.prerequisite_note
          ? `CATALOG PREREQUISITE NOTE: ${course.prerequisite_note}`
          : null,
        course.corequisite_note
          ? `CATALOG COREQUISITE NOTE: ${course.corequisite_note}`
          : null,
        course.approval_required
          ? `APPROVAL REQUIRED: ${course.approval_required}`
          : null,
        course.note ? `DATA NOTE: ${course.note}` : null,
      ].filter(Boolean);
      const noteStr = details.length > 0 ? ` (${details.join("; ")})` : "";
      lines.push(
        `- ${course.code} ${course.name} | ${course.credits} credits${prereqStr}${noteStr}`
      );
    }
    lines.push("");
  }

  if (data.electives) {
    const e = data.electives;
    lines.push(
      `MAJOR ELECTIVES: ${e.count ?? e.credits_required ?? ""} courses, ${e.credits_each ?? ""} credits each. ${e.prerequisite_note ?? ""}`
    );
    if (e.topics && e.topics.length > 0) {
      lines.push("Topics include: " + e.topics.join(", "));
    }
    if (e.note) {
      lines.push(`[DATA NOTE: ${e.note}]`);
    }
  }

  return lines.join("\n");
}
