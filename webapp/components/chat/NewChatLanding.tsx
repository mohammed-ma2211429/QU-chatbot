"use client";

import { useState } from "react";

const QUICK_STARTS = [
  {
    label: "Help me plan from scratch",
    detail: "I want a balanced term, but I’m not sure where to begin.",
    prompt: "I'm not sure where to start. Help me build a balanced schedule for my next term.",
    number: "01",
    tag: "Start fresh",
    cardClass: "border-[#71102d] bg-qu-maroon text-white shadow-[0_12px_28px_rgba(138,21,56,0.2)]",
    numberClass: "border-white/25 bg-white/10 text-white",
    detailClass: "text-white/72",
    arrowClass: "bg-white text-qu-maroon",
  },
  {
    label: "Show me my options",
    detail: "I know what I’ve finished—what can I take next?",
    prompt: "I know which courses I've finished. Show me what I'm eligible to take next.",
    number: "02",
    tag: "See my options",
    cardClass: "border-[#d5abb7] bg-[#e7c8d1] text-[#431724] shadow-[0_12px_28px_rgba(94,48,62,0.1)]",
    numberClass: "border-[#8a1538]/15 bg-white/35 text-qu-maroon",
    detailClass: "text-[#684956]",
    arrowClass: "bg-[#8a1538] text-white",
  },
  {
    label: "Fit classes around my life",
    detail: "I have work, an internship, or days I need to keep free.",
    prompt: "Help me build a realistic schedule around my work, internship, or personal commitments.",
    number: "03",
    tag: "Work around life",
    cardClass: "border-[#b9cec6] bg-[#d9e7e2] text-[#183d32] shadow-[0_12px_28px_rgba(48,83,72,0.1)]",
    numberClass: "border-[#356657]/15 bg-white/35 text-[#356657]",
    detailClass: "text-[#506d64]",
    arrowClass: "bg-[#356657] text-white",
  },
];

interface NewChatLandingProps {
  onStart: (question: string) => void;
}

export function NewChatLanding({ onStart }: NewChatLandingProps) {
  const [question, setQuestion] = useState("");

  function submit(value: string) {
    const trimmed = value.trim();
    onStart(trimmed || QUICK_STARTS[0].prompt);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit(question);
    }
  }

  return (
    <div className="landing-surface soft-scrollbar relative flex h-full flex-col overflow-x-hidden overflow-y-auto md:overflow-hidden">
      <div className="pointer-events-none absolute -left-24 top-[18%] h-56 w-56 rounded-full border-[36px] border-white/20" />
      <div className="pointer-events-none absolute -right-16 bottom-[12%] h-48 w-48 rounded-full bg-white/15" />

      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-5 py-8 sm:px-8 md:py-5 lg:px-12">
        <div className="rise-in mx-auto w-full max-w-3xl text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/70 bg-white/75 shadow-[0_10px_30px_rgba(138,21,56,0.1)] backdrop-blur-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/qu-logo.png" alt="" className="h-10 w-10 object-contain" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-qu-maroon">
            A schedule that fits you
          </p>
          <h1 className="mx-auto mt-2 max-w-2xl text-balance text-[clamp(1.9rem,4.5vw,3.25rem)] font-semibold leading-[1.04] tracking-[-0.045em] text-qu-ink">
            Let&apos;s figure out next term together.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-sm leading-6 text-qu-muted sm:text-[15px]">
            Maybe you want a lighter workload, faster progress, or a few days kept free.
            Tell me what matters, and we&apos;ll build from there.
          </p>
        </div>

        <div className="rise-in mx-auto mt-5 w-full max-w-3xl [animation-delay:80ms]">
          <div className="rounded-[22px] border border-white/70 bg-white/72 p-2.5 shadow-[0_18px_55px_rgba(66,37,47,0.12)] backdrop-blur-md transition-shadow focus-within:bg-white/90 focus-within:shadow-[0_20px_65px_rgba(138,21,56,0.15)] sm:p-3">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              className="max-h-28 w-full resize-none bg-transparent px-2 py-2 text-sm leading-6 text-qu-ink outline-none placeholder:text-[#8e7e83] sm:px-3 sm:text-base"
              placeholder="What’s on your mind for next term?"
              aria-label="What’s on your mind for next term?"
            />
            <div className="flex items-center justify-between gap-3 border-t border-qu-rose-border/70 px-1 pt-2 sm:px-2">
              <p className="hidden text-[11px] text-qu-muted sm:block">
                Write it your way, or choose a starting point below.
              </p>
              <button
                type="button"
                onClick={() => submit(question)}
                className="ml-auto inline-flex items-center gap-2 rounded-xl bg-qu-maroon px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-qu-maroon-dark"
              >
                Let&apos;s start
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>

        <div className="rise-in mx-auto mt-4 grid w-full max-w-3xl gap-2.5 sm:grid-cols-3 [animation-delay:140ms]">
          {QUICK_STARTS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => submit(item.prompt)}
              className={`group relative overflow-hidden rounded-[20px] border p-4 text-left transition-all hover:-translate-y-1 hover:shadow-lg ${item.cardClass}`}
            >
              <span className="relative flex items-center justify-between gap-3">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-[10px] font-bold tracking-[0.08em] ${item.numberClass}`}>
                  {item.number}
                </span>
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm shadow-sm transition-transform group-hover:translate-x-0.5 ${item.arrowClass}`}>
                  →
                </span>
              </span>
              <span className="relative mt-4 block text-[9px] font-bold uppercase tracking-[0.14em] opacity-70">
                {item.tag}
              </span>
              <span className="relative mt-1.5 block text-sm font-semibold leading-snug">
                {item.label}
              </span>
              <span className={`relative mt-1.5 block text-xs leading-5 ${item.detailClass}`}>{item.detail}</span>
            </button>
          ))}
        </div>

        <div className="rise-in mx-auto mt-4 flex w-full max-w-3xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-qu-muted [animation-delay:200ms]">
          {["Checks your prerequisites", "Keeps credits realistic"].map((item) => (
            <span key={item} className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-qu-maroon" aria-hidden="true" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
