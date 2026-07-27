"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Conversation } from "@/lib/storage/types";
import {
  formatConversationDate,
  getConversationDisplayTitle,
} from "@/lib/storage/conversationTitles";

interface ConversationListItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function ConversationListItem({ conversation, isActive, onSelect, onDelete }: ConversationListItemProps) {
  const displayTitle = getConversationDisplayTitle(
    conversation.title,
    conversation.programLabel
  );
  const conversationDate = formatConversationDate(conversation.createdAt);
  const titleViewportRef = useRef<HTMLSpanElement>(null);
  const titleTextRef = useRef<HTMLSpanElement>(null);
  const [overflowDistance, setOverflowDistance] = useState(0);

  useEffect(() => {
    const viewport = titleViewportRef.current;
    const text = titleTextRef.current;
    if (!viewport || !text) return;
    const viewportElement = viewport;
    const textElement = text;

    function measure() {
      setOverflowDistance(
        Math.max(0, textElement.scrollWidth - viewportElement.clientWidth)
      );
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewportElement);
    observer.observe(textElement);
    return () => observer.disconnect();
  }, [displayTitle]);

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (window.confirm(`Delete "${conversation.title}"? This can't be undone.`)) {
      onDelete();
    }
  }

  return (
    <div
      className={`group flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${
        isActive
          ? "bg-white font-semibold text-qu-maroon shadow-sm ring-1 ring-qu-rose-border"
          : "text-qu-ink/75 hover:bg-white hover:text-qu-ink"
      }`}
    >
      <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-start gap-2.5 text-left">
        <span
          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
            isActive ? "bg-qu-maroon" : "bg-qu-rose-border group-hover:bg-qu-maroon-light"
          }`}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span ref={titleViewportRef} className="block overflow-hidden">
            <span
              ref={titleTextRef}
              title={displayTitle}
              className={`block w-max whitespace-nowrap text-[13px] font-semibold ${
                overflowDistance > 0 ? "sidebar-title-reveal" : ""
              }`}
              style={
                {
                  "--title-overflow": `${overflowDistance}px`,
                } as CSSProperties
              }
            >
              {displayTitle}
            </span>
          </span>
          <span
            className={`mt-0.5 block truncate text-[10px] font-normal ${
              isActive ? "text-qu-maroon/65" : "text-qu-muted"
            }`}
            title={`${conversation.programLabel} · ${conversationDate}`}
          >
            {conversation.programLabel} · {conversationDate}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={handleDelete}
        aria-label="Delete conversation"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-sm text-qu-muted opacity-0 hover:bg-[#f8e6e9] hover:text-qu-maroon group-hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}
