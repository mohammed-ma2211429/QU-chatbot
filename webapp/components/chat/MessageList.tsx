"use client";

import { useEffect, useRef } from "react";
import type { StoredMessage } from "@/lib/storage/types";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  messages: StoredMessage[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const visibleMessages = messages.filter((message) => !message.hidden);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  return (
    <div className="chat-surface soft-scrollbar flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-3xl space-y-7">
        {visibleMessages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-qu-maroon text-[10px] font-bold text-white">
              QU
            </div>
            <div className="flex gap-1 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-qu-maroon-light [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-qu-maroon-light [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-qu-maroon-light" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
