import { BASE_SYSTEM_PROMPT } from "./basePrompt";

/** Substitutes the {PROGRAM_DATA} and {CURRENT_DATE} placeholders — ported
 * from agent_groq.py's _inject_program_data, extended with a real current
 * date so the model can reason correctly about which term is actually
 * upcoming instead of inventing example terms that may already be in the
 * past. Since each request rebuilds the system prompt fresh (the stateless
 * design), this is always today's real date, not a stale cached value. */
export function buildSystemPrompt(programDataText: string): string {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return BASE_SYSTEM_PROMPT.replace("{PROGRAM_DATA}", programDataText).replace("{CURRENT_DATE}", currentDate);
}
