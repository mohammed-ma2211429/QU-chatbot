"use client";

import { useEffect, useState } from "react";
import type { Course } from "@/lib/program-data/types";
import { groupCourses } from "@/lib/utils/groupCourses";
import {
  getDependentsBlockingRemoval,
  getMissingPrerequisiteLabels,
} from "@/lib/program-data/courseSelection";

interface ChecklistPickerProps {
  courses: Course[];
  onContinue: (completedCodes: string[]) => void;
  hasNoCourses: boolean;
  onToggleNoCourses: (value: boolean) => void;
}

export function ChecklistPicker({ courses, onContinue, hasNoCourses, onToggleNoCourses }: ChecklistPickerProps) {
  const groups = groupCourses(courses);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!blockedMessage) return;
    const timer = setTimeout(() => setBlockedMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [blockedMessage]);

  function toggle(course: Course) {
    const isCurrentlyChecked = checked.has(course.code);

    if (!isCurrentlyChecked) {
      const missing = getMissingPrerequisiteLabels(course, checked);
      if (missing.length > 0) {
        setBlockedMessage(
          `Mark ${missing.join(", ")} complete first before ${course.code}.`
        );
        return;
      }
    } else {
      const blockingDependents = getDependentsBlockingRemoval(
        course.code,
        courses,
        checked
      );
      if (blockingDependents.length > 0) {
        setBlockedMessage(
          `Unmark ${blockingDependents.join(", ")} before removing ${course.code}.`
        );
        return;
      }
    }

    setBlockedMessage(null);
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(course.code)) next.delete(course.code);
      else next.add(course.code);
      return next;
    });
  }

  function handleContinue() {
    onContinue(hasNoCourses ? [] : [...checked]);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-qu-rose-border bg-white px-4 py-3">
        <p className="text-sm font-semibold text-qu-ink">Which courses have you already completed?</p>
        <label className="mt-2 flex items-center gap-2 text-xs text-qu-muted">
          <input
            type="checkbox"
            checked={hasNoCourses}
            onChange={(e) => onToggleNoCourses(e.target.checked)}
            className="h-4 w-4 rounded border-qu-rose-border accent-qu-maroon"
          />
          I haven&apos;t completed any courses yet
        </label>
      </div>

      {blockedMessage && (
        <div className="border-b border-[#f0c987] bg-[#fff4e5] px-4 py-2 text-center text-xs text-[#6b4a1a]">
          {blockedMessage}
        </div>
      )}

      <div className={`soft-scrollbar flex-1 overflow-y-auto px-4 py-4 ${hasNoCourses ? "pointer-events-none opacity-50" : ""}`}>
        {groups.map((group) => (
          <div key={group.label} className="mb-6">
            <p className="mb-3 inline-block rounded-full bg-qu-maroon px-3 py-1 text-xs font-semibold text-white">
              {group.label}
            </p>
            <div className="flex flex-wrap gap-2.5">
              {group.courses.map((course) => {
                const isChecked = checked.has(course.code);
                return (
                  <button
                    key={course.code}
                    onClick={() => toggle(course)}
                    className={`rounded-xl border px-3.5 py-2.5 text-left text-xs transition-colors ${
                      isChecked
                        ? "border-qu-maroon bg-qu-maroon text-white"
                        : "border-qu-rose-border bg-white text-qu-ink"
                    }`}
                  >
                    <span className="font-semibold">{course.code}</span> — {course.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-qu-rose-border bg-white px-4 py-3">
        <button
          onClick={handleContinue}
          className="w-full rounded-xl bg-qu-maroon px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-qu-maroon-dark"
        >
          Build my planning session
        </button>
      </div>
    </div>
  );
}
