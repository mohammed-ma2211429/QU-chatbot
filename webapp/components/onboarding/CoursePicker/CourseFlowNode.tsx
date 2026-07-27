"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CourseNodeData } from "./courseLayout";

export function CourseFlowNode({ data }: NodeProps) {
  const { course, completed } = data as CourseNodeData;

  return (
    <div
      className={`w-full rounded-lg border-2 px-3 py-2 text-xs shadow-sm transition-colors cursor-pointer select-none ${
        completed
          ? "border-qu-maroon bg-qu-maroon text-white"
          : "border-gray-300 bg-white text-gray-800 hover:border-qu-maroon-light"
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-gray-400" />
      <div className="font-semibold">{course.code}</div>
      <div className={`mt-0.5 leading-snug ${completed ? "text-white/90" : "text-gray-600"}`}>
        {course.name}
      </div>
      <div className={`mt-1 flex items-center justify-between text-[10px] ${completed ? "text-white/80" : "text-gray-500"}`}>
        <span>{course.credits ?? "?"} cr</span>
        {course.min_credit_hours && (
          <span className="rounded bg-black/10 px-1 py-0.5">{course.min_credit_hours} CH req.</span>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-gray-400" />
    </div>
  );
}

export function ColumnHeaderNode({ data }: NodeProps) {
  const { label } = data as unknown as { label: string };
  return (
    <div className="w-full rounded-md bg-qu-rose px-3 py-1.5 text-center text-xs font-semibold text-qu-maroon">
      {label}
    </div>
  );
}
