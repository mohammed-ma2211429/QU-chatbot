export interface SendChatArgs {
  messages: { role: "user" | "assistant"; content: string }[];
  programFile: string;
  newMessage: string;
  image?: { dataUrl: string; name: string } | null;
}

export interface SendChatResult {
  reply: string;
}

export async function sendChat(args: SendChatArgs): Promise<SendChatResult> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: args.messages,
      programFile: args.programFile,
      newMessage: args.newMessage,
      images: args.image ? [{ dataUrl: args.image.dataUrl, name: args.image.name }] : undefined,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }

  return res.json();
}
