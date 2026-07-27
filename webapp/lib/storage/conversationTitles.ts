export function deriveConversationTitle(initialQuestion: string): string {
  const text = initialQuestion.toLowerCase();

  if (/\b(work|job|internship|commitment|busy)\b/.test(text)) {
    return "Work-friendly schedule";
  }
  if (/\b(morning|afternoon|evening|day off|days off|free|avoid)\b/.test(text)) {
    return "Preferred class times";
  }
  if (/\b(eligible|eligibility|prerequisite|prerequisites|what can i take|my options)\b/.test(text)) {
    return "Course eligibility";
  }
  if (/\b(lighter|heavier|balanced|workload|credit|credits)\b/.test(text)) {
    return "Course-load planning";
  }
  if (/\b(graduat|on track|faster progress)\b/.test(text)) {
    return "Graduation planning";
  }
  if (/\belective|electives\b/.test(text)) {
    return "Elective planning";
  }
  if (/\b(remaining|requirements|have left|still need)\b/.test(text)) {
    return "Remaining requirements";
  }

  return "Next-term plan";
}

export function getConversationDisplayTitle(
  storedTitle: string,
  programLabel: string
): string {
  // Conversations created before context-aware titles used
  // "[Program] — [date]". Give them a useful neutral label without
  // rewriting the student's localStorage history.
  if (storedTitle.startsWith(`${programLabel} —`)) {
    return "Next-term plan";
  }
  return storedTitle;
}

export function formatConversationDate(createdAt: number): string {
  return new Date(createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
