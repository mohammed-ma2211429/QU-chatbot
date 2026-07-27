"use client";

import type { StoredMessage } from "@/lib/storage/types";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface MessageBubbleProps {
  message: StoredMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-qu-maroon text-[10px] font-bold text-white shadow-sm">
          QU
        </div>
      )}
      <div
        className={
          isUser
            ? "max-w-[85%] rounded-[20px] rounded-tr-md bg-qu-maroon px-4 py-3 text-white shadow-[0_8px_20px_rgba(138,21,56,0.14)] sm:max-w-[72%]"
            : "min-w-0 max-w-[calc(100%-44px)] flex-1 rounded-[20px] rounded-tl-md border border-white/80 bg-white/82 px-4 py-3 text-qu-ink shadow-sm backdrop-blur-sm"
        }
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-6">
            {message.content}
            {message.hasImage && <span className="ml-1.5 text-white/75"> · attachment</span>}
          </p>
        ) : (
          <MarkdownRenderer content={message.content} />
        )}
      </div>
    </div>
  );
}
