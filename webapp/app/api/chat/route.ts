import { NextResponse } from "next/server";
import { z } from "zod";
import { getGroqClient } from "@/lib/groq/client";
import { createChatCompletionWithRetry } from "@/lib/groq/createCompletion";
import { TEXT_MODEL, VISION_MODEL } from "@/lib/groq/models";
import { getProgramDataByFile } from "@/lib/program-data/loadProgramData";
import { formatProgramData } from "@/lib/program-data/formatProgramData";
import { buildSystemPrompt } from "@/lib/prompt/buildSystemPrompt";
import { validateImageDataUrl, UnsupportedAttachmentError } from "@/lib/image/validateImage";
import { ALL_PROGRAM_FILENAMES } from "@/lib/program-data/programFiles";
import {
  GREETING_REPLY,
  isSimpleGreeting,
  isClearlyOutOfScopePlanningRequest,
  OUT_OF_SCOPE_REPLY,
} from "@/lib/guardrails/scopeGuard";
import { ensureValidScheduleReply } from "@/lib/scheduling/ensureValidScheduleReply";

// Schedule turns can run a generation plus a repair pass on a reasoning model.
export const maxDuration = 120;

const EMPTY_REPLY_FALLBACK =
  "Sorry, I wasn't able to put that answer together just now. Please send your last message again.";

const ChatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
  programFile: z.enum(ALL_PROGRAM_FILENAMES as [string, ...string[]]),
  newMessage: z.string(),
  images: z
    .array(
      z.object({
        dataUrl: z.string(),
        name: z.string(),
      })
    )
    .optional(),
});

export async function POST(request: Request) {
  let body: z.infer<typeof ChatRequestSchema>;
  try {
    const json = await request.json();
    body = ChatRequestSchema.parse(json);
  } catch {
    return NextResponse.json(
      { error: "Invalid request body", code: "SERVER_ERROR" },
      { status: 400 }
    );
  }

  // Keep simple greetings warm and instant without spending a model request.
  // If an image is attached, continue to the vision flow instead of ignoring it.
  if ((!body.images || body.images.length === 0) && isSimpleGreeting(body.newMessage)) {
    return NextResponse.json({ reply: GREETING_REPLY });
  }

  // Enforce the product boundary before initializing Groq or sending any
  // content to a model. The system prompt repeats this rule, but prompt-only
  // guardrails are probabilistic and can occasionally answer trivia before
  // redirecting, so clearly unrelated requests are rejected in code.
  if (isClearlyOutOfScopePlanningRequest(body.newMessage)) {
    return NextResponse.json({ reply: OUT_OF_SCOPE_REPLY });
  }

  const programData = getProgramDataByFile(body.programFile);
  if (!programData) {
    return NextResponse.json(
      { error: `Unknown programFile: ${body.programFile}`, code: "SERVER_ERROR" },
      { status: 400 }
    );
  }

  const systemPrompt = buildSystemPrompt(formatProgramData(programData));

  const priorMessages = body.messages.map((m) => ({ role: m.role, content: m.content }));
  const planningMessages = [
    ...priorMessages,
    { role: "user" as const, content: body.newMessage },
  ];

  let groqClient;
  try {
    groqClient = getGroqClient();
  } catch (e) {
    console.error("Groq client init failed:", e);
    return NextResponse.json(
      { error: "Server is not configured correctly (missing API key).", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }

  // Image turn: validate first (in-character rejection, HTTP 200, matches
  // the Python UX where a bad attachment is a normal conversational turn,
  // not an error toast) then route to VISION_MODEL.
  if (body.images && body.images.length > 0) {
    let imageContent: Array<{ type: "image_url"; image_url: { url: string } }>;
    try {
      imageContent = body.images.map((img) => {
        const validated = validateImageDataUrl(img.dataUrl, img.name);
        return { type: "image_url" as const, image_url: { url: validated.dataUrl } };
      });
    } catch (e) {
      if (e instanceof UnsupportedAttachmentError) {
        const reply =
          `I can only read image files (screenshots or photos), not this attachment (${e.message}). ` +
          "Please attach an image of your transcript or degree audit, or just type your answer instead.";
        return NextResponse.json({ reply });
      }
      throw e;
    }

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...priorMessages,
      {
        role: "user" as const,
        content: [
          { type: "text" as const, text: body.newMessage || "(see attached image)" },
          ...imageContent,
        ],
      },
    ];

    try {
      const completion = await createChatCompletionWithRetry(groqClient, {
        model: VISION_MODEL,
        messages,
        temperature: 0.3,
        max_tokens: 3072,
        reasoning_format: "hidden",
      });
      const rawReply = completion.choices[0]?.message?.content?.trim() ?? "";
      if (!rawReply) {
        return NextResponse.json({ reply: EMPTY_REPLY_FALLBACK });
      }
      const reply = await ensureValidScheduleReply({
        client: groqClient,
        model: VISION_MODEL,
        completionMessages: messages,
        planningMessages,
        programData,
        reply: rawReply,
      });
      return NextResponse.json({ reply });
    } catch (e) {
      console.error("Groq vision call failed:", e);
      return NextResponse.json(
        { error: "The assistant is temporarily unavailable. Please try again.", code: "SERVER_ERROR" },
        { status: 500 }
      );
    }
  }

  // Plain text turn.
  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...priorMessages,
    { role: "user" as const, content: body.newMessage },
  ];

  try {
    // TEXT_MODEL is a reasoning model: reasoning tokens count against
    // max_tokens, so a small cap can leave the visible answer empty on long
    // turns (schedule generation). Keep effort low and the budget generous.
    const textParams = {
      model: TEXT_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 4096,
      reasoning_effort: "low" as const,
    };
    let completion = await createChatCompletionWithRetry(groqClient, textParams);
    let rawReply = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!rawReply) {
      completion = await createChatCompletionWithRetry(groqClient, { ...textParams, max_tokens: 8192 });
      rawReply = completion.choices[0]?.message?.content?.trim() ?? "";
    }
    if (!rawReply) {
      return NextResponse.json({ reply: EMPTY_REPLY_FALLBACK });
    }
    const reply = await ensureValidScheduleReply({
      client: groqClient,
      model: TEXT_MODEL,
      completionMessages: messages,
      planningMessages,
      programData,
      reply: rawReply,
    });
    return NextResponse.json({ reply });
  } catch (e) {
    console.error("Groq text call failed:", e);
    return NextResponse.json(
      { error: "The assistant is temporarily unavailable. Please try again.", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
