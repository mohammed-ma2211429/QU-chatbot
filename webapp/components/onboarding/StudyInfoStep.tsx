"use client";

import { useState } from "react";
import { OnboardingModal } from "./OnboardingModal";
import { COLLEGE_MAJOR_MAP } from "@/lib/program-data/collegeMajorMap";

interface StudyInfoStepProps {
  onFinish: (programFile: string, programLabel: string) => void;
  onClose: () => void;
}

export function StudyInfoStep({ onFinish, onClose }: StudyInfoStepProps) {
  const [college, setCollege] = useState("");
  const [majorFile, setMajorFile] = useState("");
  const [accepted, setAccepted] = useState(false);

  const majors = COLLEGE_MAJOR_MAP.find((c) => c.college === college)?.majors ?? [];
  const selectedMajor = majors.find((m) => m.filename === majorFile);
  const canFinish = college !== "" && majorFile !== "" && accepted;

  function handleCollegeChange(value: string) {
    setCollege(value);
    setMajorFile(""); // reset major when college changes, mirrors the reference's dependent dropdown
  }

  function handleFinish() {
    if (!canFinish || !selectedMajor) return;
    onFinish(majorFile, selectedMajor.label);
  }

  return (
    <OnboardingModal progress={0.5} onClose={onClose}>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-qu-maroon">A couple of quick details</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-qu-ink">What are you studying?</h2>
      <p className="mt-2 text-sm leading-6 text-qu-muted">
        Pick your college and major so I can use the right course map—not a generic one.
      </p>

      <div className="mt-7">
        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-qu-ink">College</label>
        <select
          value={college}
          onChange={(e) => handleCollegeChange(e.target.value)}
          className="w-full rounded-xl border border-qu-rose-border bg-white px-4 py-3.5 text-sm text-qu-ink shadow-sm outline-none focus:border-qu-maroon"
        >
          <option value="">Select your college</option>
          {COLLEGE_MAJOR_MAP.map((c) => (
            <option key={c.college} value={c.college}>
              {c.college}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-qu-ink">Major</label>
        <select
          value={majorFile}
          onChange={(e) => setMajorFile(e.target.value)}
          disabled={!college}
          className="w-full rounded-xl border border-qu-rose-border bg-white px-4 py-3.5 text-sm text-qu-ink shadow-sm outline-none focus:border-qu-maroon disabled:bg-[#f4f1f2] disabled:text-[#9b9295]"
        >
          <option value="">{college ? "Select your major" : "Select a college first"}</option>
          {majors.map((m) => (
            <option key={m.filename} value={m.filename}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <label className="mt-5 flex items-start gap-3 rounded-xl bg-[#f7f1f3] p-3.5 text-xs leading-5 text-qu-muted">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-qu-rose-border accent-qu-maroon"
        />
        <span>
          <span className="font-semibold text-qu-ink">I&apos;ll double-check the final plan</span> with
          my academic advisor before I register.
        </span>
      </label>

      <button
        onClick={handleFinish}
        disabled={!canFinish}
        className="mt-7 w-full rounded-xl bg-qu-maroon px-4 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(138,21,56,0.16)] transition-all enabled:hover:-translate-y-0.5 enabled:hover:bg-qu-maroon-dark disabled:bg-[#d9b6c1]"
      >
        Next: courses you&apos;ve finished
      </button>

      <p className="mt-4 text-center text-[10px] leading-4 text-qu-muted">
        No need to share your name, student ID, email, phone number, or other personal details.
      </p>
    </OnboardingModal>
  );
}
