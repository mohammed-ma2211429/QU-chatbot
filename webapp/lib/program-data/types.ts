export interface Course {
  code: string;
  name: string;
  credits: number | null;
  prerequisites?: string[];
  prerequisites_one_of?: string[];
  corequisites?: string[];
  min_credit_hours?: number;
  year?: number | null;
  term?: string | null;
  prerequisite_note?: string;
  corequisite_note?: string;
  approval_required?: string;
  note?: string;
}

export interface Electives {
  count?: number;
  credits_each?: number;
  credits_required?: number;
  prerequisite_note?: string;
  topics?: string[];
  note?: string;
  options?: Array<{
    code: string;
    name: string;
    credits: number | null;
    prerequisite_text?: string | null;
  }>;
}

export interface ProgramData {
  program: string;
  college?: string | null;
  total_credits?: number | null;
  source?: string;
  note?: string;
  courses: Course[];
  electives?: Electives;
  fallback_instructions?: string;
}
