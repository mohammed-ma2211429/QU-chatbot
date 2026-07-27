import type { Course, ProgramData } from "@/lib/program-data/types";

export interface PlanningMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ParsedScheduleRow {
  code: string;
  name: string;
  credits: number | null;
  reason: string;
}

export interface ScheduleValidationResult {
  containsSchedule: boolean;
  valid: boolean;
  rows: ParsedScheduleRow[];
  calculatedCredits: number | null;
  declaredCredits: number | null;
  requestedCreditLimit: number | null;
  completedCourseCodes: string[];
  issues: string[];
  warnings: string[];
}

const COURSE_CODE_PATTERN = /^[A-Z]{2,5}\s*\d{3}[A-Z]?$/;
const TERM_PATTERN = /\b(Fall|Spring|Summer)\s+(20\d{2})\b/i;

function normalizeCourseCode(value: string): string {
  return value
    .replace(/[*_`]/g, "")
    .trim()
    .toUpperCase()
    .replace(/^([A-Z]{2,5})\s*(\d{3}[A-Z]?)$/, "$1 $2");
}

function allCatalogCourses(programData: ProgramData): Course[] {
  const electiveOptions: Course[] = (programData.electives?.options ?? []).map(
    (course) => ({
      code: course.code,
      name: course.name,
      credits: course.credits,
      prerequisite_note: course.prerequisite_text ?? undefined,
    })
  );
  return [...programData.courses, ...electiveOptions];
}

export function parseScheduleRows(reply: string): ParsedScheduleRow[] {
  const rows: ParsedScheduleRow[] = [];

  for (const line of reply.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) continue;

    const cells = trimmed
      .slice(1, -1)
      .split("|")
      .map((cell) => cell.trim());
    if (cells.length < 4) continue;

    const code = normalizeCourseCode(cells[0]);
    if (!COURSE_CODE_PATTERN.test(code)) continue;

    const creditMatch = cells[2].replace(/[*_`]/g, "").match(/\d+(?:\.\d+)?/);
    rows.push({
      code,
      name: cells[1].replace(/[*_`]/g, "").trim(),
      credits: creditMatch ? Number(creditMatch[0]) : null,
      reason: cells.slice(3).join(" | ").replace(/[*_`]/g, "").trim(),
    });
  }

  return rows;
}

export function inferCompletedCourseCodes(
  messages: PlanningMessage[],
  programData: ProgramData
): Set<string> {
  const knownCodes = allCatalogCourses(programData).map((course) =>
    normalizeCourseCode(course.code)
  );
  const completed = new Set<string>();

  for (const message of messages) {
    if (message.role !== "user") continue;
    if (
      !/\b(completed|finished|passed|already took|already taken|have taken|i've taken)\b/i.test(
        message.content
      )
    ) {
      continue;
    }

    const upper = message.content.toUpperCase();
    for (const code of knownCodes) {
      const flexibleCode = code.replace(" ", "\\s*");
      if (new RegExp(`(^|[^A-Z0-9])${flexibleCode}(?=$|[^A-Z0-9])`).test(upper)) {
        completed.add(code);
      }
    }
  }

  return completed;
}

export function inferRequestedCreditLimit(
  messages: PlanningMessage[]
): number | null {
  for (const message of [...messages].reverse()) {
    if (message.role !== "user") continue;
    const text = message.content;
    if (
      !/\b(take|load|maximum|max|limit|handle|manage|credits?|credit hours?|drop|reduce|instead|standard)\b/i.test(
        text
      )
    ) {
      continue;
    }

    const matches = [...text.matchAll(/\b(\d{1,2})\s*(?:credits?|credit hours?|CH)\b/gi)];
    if (matches.length > 0) {
      return Number(matches.at(-1)![1]);
    }
  }
  return null;
}

function inferCompletedCreditHours(
  messages: PlanningMessage[],
  completedCodes: ReadonlySet<string>,
  catalogByCode: ReadonlyMap<string, Course>
): number {
  let statedTotal = 0;
  for (const message of messages) {
    if (message.role !== "user") continue;
    if (!/\b(completed|earned|finished|passed|total)\b/i.test(message.content)) {
      continue;
    }
    for (const match of message.content.matchAll(
      /\b(?:about\s+)?(\d{2,3})\s+(?:completed\s+|total\s+)?credit hours?\b/gi
    )) {
      statedTotal = Math.max(statedTotal, Number(match[1]));
    }
  }

  const catalogTotal = [...completedCodes].reduce((total, code) => {
    return total + (catalogByCode.get(code)?.credits ?? 0);
  }, 0);

  return Math.max(statedTotal, catalogTotal);
}

function inferConfirmedTerm(messages: PlanningMessage[]): string | null {
  for (const message of [...messages].reverse()) {
    if (message.role !== "user") continue;
    const match = message.content.match(TERM_PATTERN);
    if (match) return `${match[1][0].toUpperCase()}${match[1].slice(1).toLowerCase()} ${match[2]}`;
  }
  return null;
}

function inferDeclaredCredits(reply: string): number | null {
  const match = reply.match(
    /(?:total credits?|credit total)\s*:?\s*\*{0,2}\s*(\d+(?:\.\d+)?)/i
  );
  return match ? Number(match[1]) : null;
}

function hasAdvisorVerification(reply: string): boolean {
  return (
    /\bacademic advisor\b/i.test(reply) &&
    /\b(before registering|before (?:you )?register|verify|double-check)\b/i.test(
      reply
    )
  );
}

export function validateScheduleReply(
  reply: string,
  messages: PlanningMessage[],
  programData: ProgramData
): ScheduleValidationResult {
  const rows = parseScheduleRows(reply);
  const containsSchedule =
    rows.length > 0 ||
    /recommended schedule/i.test(reply) ||
    /\|\s*course code\s*\|.*\bcredits?\b/i.test(reply);

  if (!containsSchedule) {
    return {
      containsSchedule: false,
      valid: true,
      rows: [],
      calculatedCredits: null,
      declaredCredits: null,
      requestedCreditLimit: inferRequestedCreditLimit(messages),
      completedCourseCodes: [],
      issues: [],
      warnings: [],
    };
  }

  const issues: string[] = [];
  const warnings: string[] = [];
  const catalogByCode = new Map(
    allCatalogCourses(programData).map((course) => [
      normalizeCourseCode(course.code),
      course,
    ])
  );
  const completedCodes = inferCompletedCourseCodes(messages, programData);
  const requestedCreditLimit = inferRequestedCreditLimit(messages);
  const scheduledCodes = new Set(rows.map((row) => row.code));
  const seenCodes = new Set<string>();

  if (rows.length === 0) {
    issues.push("The schedule heading is present, but no readable four-column course rows were found.");
  }

  for (const row of rows) {
    if (seenCodes.has(row.code)) {
      issues.push(`${row.code} appears more than once.`);
      continue;
    }
    seenCodes.add(row.code);

    const catalogCourse = catalogByCode.get(row.code);
    if (!catalogCourse) {
      issues.push(`${row.code} is not in the selected program data.`);
      continue;
    }
    if (completedCodes.has(row.code)) {
      issues.push(`${row.code} is already listed as completed.`);
    }
    if (row.credits === null) {
      issues.push(`${row.code} has no readable credit value.`);
    } else if (
      catalogCourse.credits !== null &&
      row.credits !== catalogCourse.credits
    ) {
      issues.push(
        `${row.code} is shown as ${row.credits} credits, but the catalog data says ${catalogCourse.credits}.`
      );
    }
    if (!row.reason) {
      issues.push(`${row.code} is missing a rationale.`);
    }

    const missingRequired = (catalogCourse.prerequisites ?? []).filter(
      (code) => !completedCodes.has(normalizeCourseCode(code))
    );
    if (missingRequired.length > 0) {
      issues.push(
        `${row.code} is missing completed prerequisite${missingRequired.length > 1 ? "s" : ""}: ${missingRequired.join(", ")}.`
      );
    }

    const oneOf = (catalogCourse.prerequisites_one_of ?? []).map(
      normalizeCourseCode
    );
    if (oneOf.length > 0 && !oneOf.some((code) => completedCodes.has(code))) {
      issues.push(`${row.code} needs one completed course from: ${oneOf.join(" or ")}.`);
    }

    const missingCorequisites = (catalogCourse.corequisites ?? [])
      .map(normalizeCourseCode)
      .filter(
        (code) => !completedCodes.has(code) && !scheduledCodes.has(code)
      );
    if (missingCorequisites.length > 0) {
      issues.push(
        `${row.code} needs ${missingCorequisites.join(", ")} completed or scheduled concurrently.`
      );
    }

    if (catalogCourse.approval_required) {
      const approvalWords = catalogCourse.approval_required
        .split(/\s+/)
        .filter((word) => word.length > 3);
      if (
        !approvalWords.every((word) =>
          reply.toLowerCase().includes(word.toLowerCase())
        )
      ) {
        issues.push(
          `${row.code} requires ${catalogCourse.approval_required}, which the response does not mention.`
        );
      }
    }

    if (catalogCourse.prerequisite_note) {
      warnings.push(
        `${row.code} also has a catalog prerequisite note that should be checked during advisor verification.`
      );
    }
  }

  const calculatedCredits =
    rows.length > 0 && rows.every((row) => row.credits !== null)
      ? rows.reduce((sum, row) => sum + (row.credits ?? 0), 0)
      : null;
  const declaredCredits = inferDeclaredCredits(reply);

  if (calculatedCredits !== null) {
    if (calculatedCredits < 12) {
      issues.push(`The schedule totals ${calculatedCredits} credits, below the 12-credit guardrail.`);
    }
    if (calculatedCredits > 18) {
      issues.push(`The schedule totals ${calculatedCredits} credits, above the 18-credit guardrail.`);
    }
    if (
      requestedCreditLimit !== null &&
      requestedCreditLimit >= 12 &&
      requestedCreditLimit <= 18 &&
      calculatedCredits > requestedCreditLimit
    ) {
      issues.push(
        `The schedule totals ${calculatedCredits} credits, above the student's ${requestedCreditLimit}-credit limit.`
      );
    }
    if (
      declaredCredits !== null &&
      declaredCredits !== calculatedCredits
    ) {
      issues.push(
        `The stated total (${declaredCredits}) does not match the course rows (${calculatedCredits}).`
      );
    }
  }

  if (declaredCredits === null) {
    issues.push("The response does not state a total credit count.");
  }

  const confirmedTerm = inferConfirmedTerm(messages);
  if (confirmedTerm && !reply.toLowerCase().includes(confirmedTerm.toLowerCase())) {
    issues.push(`The schedule does not use the student's confirmed term, ${confirmedTerm}.`);
  }

  if (!hasAdvisorVerification(reply)) {
    issues.push("The required academic-advisor verification note is missing.");
  }

  const completedCreditHours = inferCompletedCreditHours(
    messages,
    completedCodes,
    catalogByCode
  );
  for (const row of rows) {
    const minimum = catalogByCode.get(row.code)?.min_credit_hours;
    if (minimum && completedCreditHours < minimum) {
      issues.push(
        `${row.code} requires ${minimum} completed credit hours; only ${completedCreditHours} could be verified.`
      );
    }
  }

  return {
    containsSchedule,
    valid: issues.length === 0,
    rows,
    calculatedCredits,
    declaredCredits,
    requestedCreditLimit,
    completedCourseCodes: [...completedCodes].sort(),
    issues,
    warnings: [...new Set(warnings)],
  };
}
