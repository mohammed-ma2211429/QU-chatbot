"use client";

import { useState } from "react";
import type { ProgramData } from "@/lib/program-data/types";
import { useMediaQuery } from "@/lib/utils/useMediaQuery";
import { CloseButton } from "@/components/ui/CloseButton";
import { FlowchartPicker } from "./FlowchartPicker";
import { ChecklistPicker } from "./ChecklistPicker";

interface CoursePickerModalProps {
  programData: ProgramData;
  programLabel: string;
  onFinish: (completedCodes: string[]) => void;
  onClose: () => void;
}

export function CoursePickerModal({ programData, programLabel, onFinish, onClose }: CoursePickerModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [hasNoCourses, setHasNoCourses] = useState(false);

  const hasCourseData = programData.courses && programData.courses.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#201a1c]/40 p-2.5 backdrop-blur-[5px] sm:p-5">
      <div className="flex h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-[26px] border border-white/50 bg-white shadow-[0_30px_90px_rgba(35,20,25,0.25)] sm:h-[88dvh]">
        <div className="flex items-center justify-between border-b border-qu-rose-border px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-qu-maroon">Step 2 of 2 · Course history</p>
            <h2 className="mt-1 text-base font-semibold text-qu-ink sm:text-lg">{programLabel}</h2>
            <p className="mt-0.5 text-xs text-qu-muted">Select completed courses so prerequisite checks start from the right place.</p>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        <div className="flex-1 overflow-hidden">
          {!hasCourseData ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
              <p className="text-sm text-gray-600">
                {programData.fallback_instructions ??
                  "No detailed course data is available for this program yet."}
              </p>
              <button
                onClick={() => onFinish([])}
                className="rounded-xl bg-qu-maroon px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-qu-maroon-dark"
              >
                Continue to chat
              </button>
            </div>
          ) : isDesktop ? (
            <FlowchartPicker
              courses={programData.courses}
              onContinue={onFinish}
              hasNoCourses={hasNoCourses}
              onToggleNoCourses={setHasNoCourses}
            />
          ) : (
            <ChecklistPicker
              courses={programData.courses}
              onContinue={onFinish}
              hasNoCourses={hasNoCourses}
              onToggleNoCourses={setHasNoCourses}
            />
          )}
        </div>
      </div>
    </div>
  );
}
