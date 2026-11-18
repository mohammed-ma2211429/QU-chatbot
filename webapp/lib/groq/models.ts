// Two models are used depending on the turn:
// - TEXT_MODEL handles ordinary conversation. This is the model all prior
//   testing (Python version) and the design doc's model-selection history
//   are based on — stays the default for every turn with no image attached.
// - VISION_MODEL only gets used for turns where the student attaches an
//   image. Not a blanket replacement for TEXT_MODEL — its instruction-
//   following reliability for this agent's phase structure hasn't been
//   validated the way TEXT_MODEL's has.
//
// Groq has retired models twice under this app:
// - meta-llama/llama-4-scout-17b-16e-instruct (vision) -> qwen/qwen3.6-27b,
//   deprecated 2026-07-17.
// - llama-3.3-70b-versatile (text) and qwen/qwen3.6-27b (vision) both stopped
//   existing on Groq by 2026-11-18 (model_not_found, chat returned HTTP 500).
//   Replacements were picked from Groq's live /models list and spot-checked
//   directly against the API.
//
// TEXT_MODEL is a reasoning model, but Groq returns its reasoning in a separate
// `reasoning` field, so message.content stays clean with no extra params.
// VISION_MODEL is also a reasoning model, so route.ts passes
// reasoning_format: "hidden" so its <think> tokens never reach students.
export const TEXT_MODEL = "openai/gpt-oss-120b";
export const VISION_MODEL = "qwen/qwen3.8-27b";
