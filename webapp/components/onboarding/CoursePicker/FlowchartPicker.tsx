"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Course } from "@/lib/program-data/types";
import {
  getDependentsBlockingRemoval,
  getMissingPrerequisiteLabels,
} from "@/lib/program-data/courseSelection";
import { buildCourseFlow, type CourseNodeData } from "./courseLayout";
import { CourseFlowNode, ColumnHeaderNode } from "./CourseFlowNode";

const nodeTypes = {
  courseNode: CourseFlowNode,
  columnHeader: ColumnHeaderNode,
};

interface FlowchartPickerProps {
  courses: Course[];
  onContinue: (completedCodes: string[]) => void;
  hasNoCourses: boolean;
  onToggleNoCourses: (value: boolean) => void;
}

export function FlowchartPicker({ courses, onContinue, hasNoCourses, onToggleNoCourses }: FlowchartPickerProps) {
  const { nodes: initialNodes, edges } = useMemo(() => buildCourseFlow(courses), [courses]);
  const [nodes, setNodes] = useState<Node<CourseNodeData>[]>(initialNodes);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  // Auto-dismiss the "missing prerequisite" message after a few seconds
  // rather than leaving it stuck until the next click.
  useEffect(() => {
    if (!blockedMessage) return;
    const timer = setTimeout(() => setBlockedMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [blockedMessage]);

  const onNodeClick = useCallback<NodeMouseHandler>(
    (_event, clickedNode) => {
      if (clickedNode.type !== "courseNode") return;
      const nodeData = clickedNode.data as CourseNodeData;
      const course = nodeData.course;
      const isCurrentlyCompleted = nodeData.completed;
      const completedSet = new Set(
        nodes
          .filter(
            (node) =>
              node.type === "courseNode" &&
              (node.data as CourseNodeData).completed
          )
          .map((node) => node.id)
      );

      if (!isCurrentlyCompleted) {
        const missing = getMissingPrerequisiteLabels(course, completedSet);
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
          completedSet
        );
        if (blockingDependents.length > 0) {
          setBlockedMessage(
            `Unmark ${blockingDependents.join(", ")} before removing ${course.code}.`
          );
          return;
        }
      }

      setBlockedMessage(null);
      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id === clickedNode.id && node.type === "courseNode"
            ? {
                ...node,
                data: {
                  ...(node.data as CourseNodeData),
                  completed: !isCurrentlyCompleted,
                },
              }
            : node
        )
      );
    },
    [courses, nodes]
  );

  const completedCount = nodes.filter((n) => n.type === "courseNode" && (n.data as CourseNodeData).completed).length;

  function handleContinue() {
    const completedCodes = hasNoCourses
      ? []
      : nodes
          .filter((n) => n.type === "courseNode" && (n.data as CourseNodeData).completed)
          .map((n) => n.id);
    onContinue(completedCodes);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-3 border-b border-qu-rose-border bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-qu-ink">Click the courses you&apos;ve completed</p>
          <p className="text-xs text-qu-muted">
            {hasNoCourses ? "No completed courses" : `${completedCount} course${completedCount === 1 ? "" : "s"} selected`} · drag to explore and use the controls to zoom
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-qu-muted">
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

      <div className="relative flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={!hasNoCourses}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={24} color="#e8c9d0" />
          <Controls showInteractive={false} />
        </ReactFlow>
        {hasNoCourses && (
          <div className="pointer-events-none absolute inset-0 bg-white/60" />
        )}
      </div>

      <div className="border-t border-qu-rose-border bg-white px-4 py-3">
        <button
          onClick={handleContinue}
          className="w-full rounded-xl bg-qu-maroon px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-qu-maroon-dark sm:ml-auto sm:w-auto sm:min-w-56"
        >
          Build my planning session
        </button>
      </div>
    </div>
  );
}
