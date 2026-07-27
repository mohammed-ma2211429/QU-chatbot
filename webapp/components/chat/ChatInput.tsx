"use client";

import { useRef, useState } from "react";
import { fileToDownscaledDataUrl } from "@/lib/image/downscaleImage";

export interface PendingImage {
  dataUrl: string;
  name: string;
}

interface ChatInputProps {
  onSend: (text: string, image: PendingImage | null) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    const dataUrl = await fileToDownscaledDataUrl(file);
    setPendingImage({ dataUrl, name: file.name });
  }

  function handleSend() {
    if (disabled) return;
    if (!text.trim() && !pendingImage) return;
    onSend(text.trim(), pendingImage);
    setText("");
    setPendingImage(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="shrink-0 border-t border-[#decbd1] bg-[#eee2e6] px-3 pb-3 pt-3 sm:px-6 sm:pb-4">
      <div className="mx-auto w-full max-w-3xl">
        {pendingImage && (
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-qu-rose-border bg-qu-rose px-3 py-2 text-xs text-qu-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pendingImage.dataUrl} alt={pendingImage.name} className="h-10 w-10 rounded-lg object-cover" />
            <span className="flex-1 truncate">{pendingImage.name}</span>
            <button type="button" onClick={() => setPendingImage(null)} className="text-qu-muted hover:text-qu-maroon" aria-label="Remove attachment">
              ×
            </button>
          </div>
        )}
        <div className="flex min-h-14 items-center gap-2 rounded-[20px] border border-white/90 bg-white/85 p-2 shadow-[0_8px_30px_rgba(66,37,47,0.1)] backdrop-blur-sm transition-colors focus-within:border-qu-maroon-light focus-within:bg-white">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f2e7eb] text-xl font-light leading-none text-qu-maroon transition-all hover:bg-[#ead8de] disabled:opacity-40"
            aria-label="Attach a transcript or degree-audit image"
            title="Attach a transcript or degree-audit image"
            type="button"
          >
            <span className="-mt-0.5" aria-hidden="true">+</span>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
          <span className="h-7 w-px shrink-0 bg-[#eadde1]" aria-hidden="true" />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Ask about your plan or request a change…"
            rows={1}
            className="max-h-32 flex-1 resize-none bg-transparent px-1 py-2.5 text-sm leading-5 text-qu-ink outline-none placeholder:text-[#93868a] disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={disabled || (!text.trim() && !pendingImage)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-qu-maroon text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-qu-maroon-dark disabled:translate-y-0 disabled:bg-[#eee7e9] disabled:text-[#aa9da1] disabled:shadow-none"
            aria-label="Send message"
            type="button"
          >
            <span className="text-lg leading-none" aria-hidden="true">↑</span>
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] leading-4 text-qu-muted">
          QU Schedule Planner may make mistakes. Verify prerequisites and course availability before registration.
        </p>
      </div>
    </div>
  );
}
