import type Groq from "groq-sdk";
import type { ChatCompletionCreateParamsNonStreaming } from "groq-sdk/resources/chat/completions";
import type { ProgramData } from "@/lib/program-data/types";
import { createChatCompletionWithRetry } from "@/lib/groq/createCompletion";
import {
  type PlanningMessage,
  validateScheduleReply,
} from "./scheduleValidation";

interface EnsureValidScheduleReplyOptions {
  client: Groq;
  model: string;
  completionMessages: ChatCompletionCreateParamsNonStreaming["messages"];
  planningMessages: PlanningMessage[];
  programData: ProgramData;
  reply: string;
}

const SAFE_FALLBACK =
  "I couldn't verify a schedule that meets every prerequisite and credit rule from the information available. " +
  "Please double-check that your completed-course list is complete, then ask me to try the schedule again.";

/**
 * Schedules receive a deterministic second pass after generation. If the
 * first draft breaks a catalog prerequisite or credit rule, the model gets
 * one hidden repair attempt. An unverified schedule is never shown.
 */
export async function ensureValidScheduleReply({
  client,
  model,
  completionMessages,
  planningMessages,
  programData,
  reply,
}: EnsureValidScheduleReplyOptions): Promise<string> {
  const firstCheck = validateScheduleReply(reply, planningMessages, programData);
  if (!firstCheck.containsSchedule || firstCheck.valid) return reply;

  const repairInstruction = [
    "Revise your previous schedule before showing it to the student.",
    "A deterministic catalog check found these problems:",
    ...firstCheck.issues.map((issue) => `- ${issue}`),
    "",
    "Return the complete corrected schedule in the required four-column markdown format.",
    "Use only courses from the supplied program data, respect completed prerequisites and the credit limit,",
    "include the rationale, total credits, alternatives, and academic-advisor verification note.",
    "Do not mention this internal validation step.",
  ].join("\n");

  const repairCompletion = await createChatCompletionWithRetry(client, {
    model,
    messages: [
      ...completionMessages,
      { role: "assistant", content: reply },
      { role: "user", content: repairInstruction },
    ],
    temperature: 0.15,
    max_tokens: 1400,
  });
  const repairedReply =
    repairCompletion.choices[0]?.message?.content?.trim() ?? "";
  const secondCheck = validateScheduleReply(
    repairedReply,
    planningMessages,
    programData
  );

  if (secondCheck.containsSchedule && secondCheck.valid) {
    return repairedReply;
  }

  console.error("Schedule validation failed after repair", {
    firstIssues: firstCheck.issues,
    secondIssues: secondCheck.issues,
  });
  return SAFE_FALLBACK;
}
