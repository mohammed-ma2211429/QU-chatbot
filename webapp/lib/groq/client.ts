import "server-only";
import Groq from "groq-sdk";

// Server-only singleton. GROQ_API_KEY must never be prefixed NEXT_PUBLIC_
// and this module must never be imported from a "use client" component.
let _client: Groq | null = null;

export function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY environment variable is not set. Set it in webapp/.env.local for local dev, " +
        "or as a Vercel Project Environment Variable in production."
    );
  }
  if (!_client) {
    _client = new Groq({ apiKey });
  }
  return _client;
}
