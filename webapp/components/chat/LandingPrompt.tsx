"use client";

import { useState } from "react";

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
function ListIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}
function FlagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3v18M5 4h11l-2 4 2 4H5" />
    </svg>
  );
}
function TargetIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.5" fill="currentColor" />
    </svg>
  );
}
function ScaleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18M7 21h10M5 7h5M3 11l4-4 4 4M14 7h5M12 11l4-4 4 4" />
    </svg>
  );
}

const SUGGESTIONS: { text: string; icon: () => React.ReactElement }[] = [
  { text: "Plan my schedule for next semester", icon: CalendarIcon },
  { text: "What are my remaining major electives?", icon: ListIcon },
  { text: "How many credit hours do I have left?", icon: ClockIcon },
  { text: "Am I on track to graduate on time?", icon: FlagIcon },
  { text: "What courses should I prioritize next?", icon: TargetIcon },
  { text: "What's a realistic course load for me?", icon: ScaleIcon },
];

interface LandingPromptProps {
  programLabel: string;
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

export function LandingPrompt({ programLabel, onSubmit, disabled }: LandingPromptProps) {
  const [text, setText] = useState("");

  function handleSubmit(value: string) {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setText("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(text);
    }
  }

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-y-auto bg-[#fffdfd] px-4 py-8">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, var(--color-qu-maroon) 1.5px, transparent 0)",
          backgroundSize: "28px 28px",
          maskImage: "linear-gradient(to top, black, transparent)",
          WebkitMaskImage: "linear-gradient(to top, black, transparent)",
        }}
      />

      <div className="relative w-full max-w-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/qu-logo.png" alt="" className="mx-auto mb-4 h-12 w-12 object-contain" />
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-qu-maroon">
          {programLabel}
        </p>
        <h1 className="mb-2 text-center text-3xl font-semibold tracking-[-0.03em] text-qu-ink">Okay—what should we work on first?</h1>
        <p className="mb-7 text-center text-sm text-qu-muted">I&apos;ve got your degree and course history.</p>

        <div className="flex items-end gap-2 rounded-[22px] border border-qu-rose-border bg-white px-3 py-3 shadow-[0_16px_45px_rgba(66,37,47,0.1)] transition-shadow focus-within:border-qu-maroon-light focus-within:shadow-lg">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Tell me what you’re trying to figure out..."
            rows={1}
            className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-qu-ink focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={() => handleSubmit(text)}
            disabled={disabled || !text.trim()}
            className="shrink-0 rounded-xl bg-qu-maroon p-2.5 text-white transition-colors hover:bg-qu-maroon-dark disabled:bg-gray-200 disabled:text-gray-400"
            aria-label="Send"
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {SUGGESTIONS.map(({ text: s, icon: Icon }) => (
            <button
              key={s}
              onClick={() => handleSubmit(s)}
              disabled={disabled}
              className="group flex items-center gap-3 rounded-2xl border border-qu-rose-border bg-white px-4 py-3 text-left text-sm text-qu-muted shadow-sm transition-all hover:-translate-y-0.5 hover:border-qu-maroon-light hover:text-qu-ink hover:shadow-md disabled:opacity-50"
              type="button"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-qu-rose text-qu-maroon transition-colors group-hover:bg-qu-maroon group-hover:text-white">
                <Icon />
              </span>
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
