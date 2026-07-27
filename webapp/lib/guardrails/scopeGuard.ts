export const OUT_OF_SCOPE_REPLY =
  "I can only help with next-term course schedule planning—things like course choices, prerequisites, " +
  "credit load, and fitting classes around your commitments. What would you like to plan for your next term?";

export const GREETING_REPLY =
  "Hi! I’m here to help you shape a realistic next-term schedule. We can check what you’re eligible " +
  "to take, balance your credit load, or work around your commitments. What would you like to start with?";

const SIMPLE_GREETING_PATTERN =
  /^(hi|hello|hey|hiya|hi there|hello there|hey there|good (morning|afternoon|evening)|salaam|salam|marhaba)[!,.?\s]*$/i;

const PROMPT_ATTACK_PATTERN =
  /\b(system prompt|developer message|hidden instructions?|internal rules?|ignore (all |any )?(previous|prior) instructions?|jailbreak|prompt injection|do anything now|\bdan\b)\b/i;

const STRONG_PLANNING_PATTERN =
  /\b(course|courses|class|classes|schedule|timetable|semester|term|prerequisite|prerequisites|credit|credits|credit hours?|degree|major|minor|elective|electives|graduation|graduate|registration|register|advisor|transcript|degree audit|gpa)\b/i;

const PLANNING_CONTEXT_PATTERN =
  /\b(fall|spring|summer|morning|afternoon|evening|workload|lighter|heavier|balanced|days? off|keep .{0,24} free|work|job|internship|commitments?|availability|available|prefer|preference|avoid|completed|eligible|eligibility|swap|adjust|remove|add|faster progress|on track)\b/i;

const CLEARLY_OTHER_TOPIC_PATTERN =
  /\b(capital|weather|temperature|forecast|news|president|prime minister|population|currency|restaurant|recipe|food|movie|music|song|sports?|football|basketball|game|joke|poem|essay|story|coding|programming|debug|software|email|cover letter|resume|translate|translation|stock|crypto|bitcoin|relationship|dating|medical|diagnosis|legal advice)\b/i;

const STANDALONE_REQUEST_PATTERN =
  /^(who|what|what's|whats|where|when|why|how|can you|could you|would you|do you|tell me|give me|show me|write|create|generate|explain|summarize|solve|calculate|recommend|find)\b/i;

const NATURAL_PLANNING_FOLLOW_UP_PATTERN =
  /\b(what do you (suggest|recommend)|which one|how many|next step|change it|adjust it|make it|that option|those options|the plan|the first|the second|the third)\b/i;

export function isSimpleGreeting(message: string): boolean {
  return SIMPLE_GREETING_PATTERN.test(message.trim());
}

/**
 * Deterministic first-line scope gate.
 *
 * This intentionally blocks only clearly standalone, non-planning requests.
 * Short contextual answers such as "15", "Fall 2026", "mornings", or
 * "no preference" must still reach the model because they are normal answers
 * to the planner's one-question-at-a-time intake.
 */
export function isClearlyOutOfScopePlanningRequest(message: string): boolean {
  const text = message.trim();
  if (!text) return false;

  if (PROMPT_ATTACK_PATTERN.test(text)) return true;
  if (STRONG_PLANNING_PATTERN.test(text)) return false;
  if (PLANNING_CONTEXT_PATTERN.test(text)) return false;
  if (CLEARLY_OTHER_TOPIC_PATTERN.test(text)) return true;
  if (NATURAL_PLANNING_FOLLOW_UP_PATTERN.test(text)) return false;

  const looksLikeStandaloneRequest =
    STANDALONE_REQUEST_PATTERN.test(text) || text.endsWith("?");

  return looksLikeStandaloneRequest;
}
