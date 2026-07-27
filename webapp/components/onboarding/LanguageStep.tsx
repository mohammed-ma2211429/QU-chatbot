"use client";

import { useState } from "react";

interface LanguageStepProps {
  onNext: () => void;
}

export function LanguageStep({ onNext }: LanguageStepProps) {
  const [language, setLanguage] = useState<"en" | "ar">("en");

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-qu-maroon">QU Schedule Planner</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-qu-ink">Hi! Ready to plan next term?</h2>
      <p className="mt-2 text-sm leading-6 text-qu-muted">First, which language would you like to use?</p>

      <div className="mt-6 space-y-3">
        <button
          onClick={() => setLanguage("en")}
          className={`w-full rounded-xl border px-4 py-3.5 text-left text-sm font-semibold text-qu-ink transition-colors ${
            language === "en" ? "border-qu-maroon bg-qu-rose" : "border-qu-rose-border bg-white hover:border-qu-maroon-light"
          }`}
        >
          English
        </button>
        <button
          onClick={() => setLanguage("ar")}
          className={`w-full rounded-xl border px-4 py-3.5 text-right text-sm font-semibold text-qu-ink transition-colors ${
            language === "ar" ? "border-qu-maroon bg-qu-rose" : "border-qu-rose-border bg-white hover:border-qu-maroon-light"
          }`}
          dir="rtl"
        >
          Arabic · العربية
        </button>
        {language === "ar" && (
          <p className="text-xs text-qu-muted">
            Arabic support is coming soon — continuing in English for now.
          </p>
        )}
      </div>

      <button
        onClick={onNext}
        className="mt-7 w-full rounded-xl bg-qu-maroon px-4 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-qu-maroon-dark"
      >
        Let&apos;s get started
      </button>

      <p className="mt-4 text-center text-[10px] leading-4 text-qu-muted">
        This is a beta academic planning tool. Please do not enter your name, student ID, email, phone
        number, or other personal information in chat messages.
      </p>
    </div>
  );
}
