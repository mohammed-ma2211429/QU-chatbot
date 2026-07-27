import type Groq from "groq-sdk";
import type { ChatCompletionCreateParamsNonStreaming } from "groq-sdk/resources/chat/completions";

/** Retry only Groq's transient capacity errors; other failures surface immediately. */
export async function createChatCompletionWithRetry(
  client: Groq,
  params: ChatCompletionCreateParamsNonStreaming,
  retries = 4
): Promise<Groq.Chat.Completions.ChatCompletion> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await client.chat.completions.create(params);
    } catch (error) {
      const status = (error as { status?: number })?.status;
      if (status !== 503 || attempt >= retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
    }
  }
}
