import type { Node, Edge } from "@xyflow/react";
import type { Course } from "@/lib/program-data/types";
import { groupCourses } from "@/lib/utils/groupCourses";

export interface CourseNodeData extends Record<string, unknown> {
  course: Course;
  completed: boolean;
}

const COLUMN_WIDTH = 300;
const ROW_HEIGHT = 108;
const NODE_WIDTH = 240;
const TOP_MARGIN = 70;

/**
 * Computes fixed node positions from each course's year/term — deterministic,
 * no auto-layout algorithm needed since the data already encodes ordering
 * (mirrors the official QU flowchart images: columns = Year/Term, courses
 * stacked within a column). Courses with no year/term (electives, generic
 * package slots) land in a trailing "Electives / Other" column.
 */
export function buildCourseFlow(courses: Course[]): { nodes: Node<CourseNodeData>[]; edges: Edge[] } {
  const groups = groupCourses(courses);
  const nodes: Node<CourseNodeData>[] = [];
  const codeSet = new Set(courses.map((c) => c.code));

  groups.forEach((group, columnIndex) => {
    nodes.push({
      id: `__header_${columnIndex}`,
      type: "columnHeader",
      position: { x: columnIndex * COLUMN_WIDTH, y: 0 },
      data: { label: group.label } as unknown as CourseNodeData,
      draggable: false,
      selectable: false,
      width: NODE_WIDTH,
    });

    group.courses.forEach((course, rowIndex) => {
      nodes.push({
        id: course.code,
        type: "courseNode",
        position: { x: columnIndex * COLUMN_WIDTH, y: TOP_MARGIN + rowIndex * ROW_HEIGHT },
        data: { course, completed: false },
        draggable: false,
        width: NODE_WIDTH,
      });
    });
  });

  const edges: Edge[] = [];
  for (const course of courses) {
    for (const prereqCode of course.prerequisites ?? []) {
      if (codeSet.has(prereqCode)) {
        edges.push({
          id: `${prereqCode}->${course.code}`,
          source: prereqCode,
          target: course.code,
          type: "smoothstep",
          style: { stroke: "#9ca3af", strokeWidth: 1.5 },
        });
      }
    }
    for (const prereqCode of course.prerequisites_one_of ?? []) {
      if (codeSet.has(prereqCode)) {
        edges.push({
          id: `${prereqCode}~>${course.code}`,
          source: prereqCode,
          target: course.code,
          type: "smoothstep",
          style: { stroke: "#c9a3ad", strokeWidth: 1.5, strokeDasharray: "4 4" },
        });
      }
    }
  }

  return { nodes, edges };
}
