import type { Course } from "./types";

export function getMissingPrerequisiteLabels(
  course: Course,
  completedCodes: ReadonlySet<string>
): string[] {
  const missingRequired = (course.prerequisites ?? []).filter(
    (code) => !completedCodes.has(code)
  );

  const oneOf = course.prerequisites_one_of ?? [];
  const hasOneOfOption =
    oneOf.length === 0 || oneOf.some((code) => completedCodes.has(code));

  return hasOneOfOption
    ? missingRequired
    : [...missingRequired, `one of ${oneOf.join(" or ")}`];
}

export function getDependentsBlockingRemoval(
  courseCode: string,
  courses: Course[],
  completedCodes: ReadonlySet<string>
): string[] {
  return courses
    .filter(
      (course) =>
        course.code !== courseCode && completedCodes.has(course.code)
    )
    .filter((course) => {
      if ((course.prerequisites ?? []).includes(courseCode)) return true;

      const oneOf = course.prerequisites_one_of ?? [];
      if (!oneOf.includes(courseCode)) return false;

      return !oneOf.some(
        (alternative) =>
          alternative !== courseCode && completedCodes.has(alternative)
      );
    })
    .map((course) => course.code);
}
