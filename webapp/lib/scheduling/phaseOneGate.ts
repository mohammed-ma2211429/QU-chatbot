import type { ProgramData } from "@/lib/program-data/types";
import {
  type PlanningMessage,
  inferRequestedCreditLimit,
  validateScheduleReply,
} from "./scheduleValidation";

const CREDIT_QUESTION =
  "What's the maximum number of credit hours you'd like to take next term? (Minimum 12, standard 15, maximum 18)";
const COMMITMENTS_QUESTION =
  "Do you have any work, internship, or personal commitments that might affect which days or times you can attend classes?";

const ASKS_CREDITS = /\bcredit hours?\b|\bcredits?\b.*\?/i;
const ASKS_COMMITMENTS = /\b(work|internship|commitments?)\b/i;
const MENTIONS_COMMITMENTS = /\b(work|job|internship|commitments?)\b/i;

/** True if an assistant message matching `pattern` is followed by any user message. */
function askedAndAnswered(messages: PlanningMessage[], pattern: RegExp): boolean {
  const askedAt = messages.findIndex(
    (m) => m.role === "assistant" && pattern.test(m.content) && m.content.includes("?")
  );
  return askedAt !== -1 && messages.slice(askedAt + 1).some((m) => m.role === "user");
}

/**
 * Rule 1 of the system prompt: never propose a schedule before Phase 1 is
 * complete. The model occasionally ignores it (e.g. jumping to a schedule
 * right after the term is confirmed), so enforce it in code. Returns the
 * missing Phase 1 question to show instead of the schedule, or null if the
 * reply is not a schedule or the required info has been collected.
 *
 * Term and completed courses are gathered earlier in the flow; this checks
 * the two answers the model most often skips: credit limit and commitments.
 */
export function missingPhaseOneQuestion(
  reply: string,
  messages: PlanningMessage[],
  programData: ProgramData
): string | null {
  if (!validateScheduleReply(reply, messages, programData).containsSchedule) {
    return null;
  }

  const creditLimitKnown =
    inferRequestedCreditLimit(messages) !== null ||
    askedAndAnswered(messages, ASKS_CREDITS);
  if (!creditLimitKnown) return CREDIT_QUESTION;

  const commitmentsKnown =
    askedAndAnswered(messages, ASKS_COMMITMENTS) ||
    messages.some((m) => m.role === "user" && MENTIONS_COMMITMENTS.test(m.content));
  if (!commitmentsKnown) return COMMITMENTS_QUESTION;

  return null;
}
