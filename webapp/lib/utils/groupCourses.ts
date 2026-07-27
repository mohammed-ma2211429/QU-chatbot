import type { Course } from "@/lib/program-data/types";

export interface CourseGroup {
  year: number | null;
  term: string | null;
  label: string;
  courses: Course[];
}

/** Groups courses by (year, term), sorted chronologically, with courses
 * that have no year/term (electives, generic packages) collected into a
 * trailing "Other" group. Shared by the checklist and flowchart pickers so
 * both render the exact same grouping the system prompt was built from. */
export function groupCourses(courses: Course[]): CourseGroup[] {
  const groups = new Map<string, CourseGroup>();

  for (const course of courses) {
    const year = course.year ?? null;
    const term = course.term ?? null;
    const key = `${year}|${term}`;
    if (!groups.has(key)) {
      let label: string;
      if (year !== null && term) {
        label = `Year ${year} — ${term}`;
      } else if (year !== null) {
        label = `Year ${year}`;
      } else {
        label = "Other / unspecified term";
      }
      groups.set(key, { year, term, label, courses: [] });
    }
    groups.get(key)!.courses.push(course);
  }

  return [...groups.values()].sort((a, b) => {
    const aYear = a.year ?? 999;
    const bYear = b.year ?? 999;
    if (aYear !== bYear) return aYear - bYear;
    return (a.term ?? "").localeCompare(b.term ?? "");
  });
}
