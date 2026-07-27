// Two models are used depending on the turn:
// - TEXT_MODEL handles ordinary conversation. This is the model all prior
//   testing (Python version) and the design doc's model-selection history
//   are based on — stays the default for every turn with no image attached.
// - VISION_MODEL only gets used for turns where the student attaches an
//   image. Not a blanket replacement for TEXT_MODEL — its instruction-
//   following reliability for this agent's phase structure hasn't been
//   validated the way TEXT_MODEL's has.
//
// The previous VISION_MODEL (meta-llama/llama-4-scout-17b-16e-instruct) was
// deprecated by Groq on 2026-07-17. qwen/qwen3.6-27b is its confirmed
// vision-capable replacement (verified directly against the Groq API — it's
// a reasoning model, so route.ts passes reasoning_format: "hidden" so its
// internal <think> tokens never leak into the reply shown to students).
export const TEXT_MODEL = "llama-3.3-70b-versatile";
export const VISION_MODEL = "qwen/qwen3.6-27b";
