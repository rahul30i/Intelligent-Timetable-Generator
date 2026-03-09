export type AdminUser = {
  sub: string;
  email: string;
};

export type BreakTime = {
  id: string;
  configId: string;
  startTime: string;
  endTime: string;
  label?: string | null;
};

export type GlobalConfig = {
  id: string;
  schoolStartTime: string;
  lectureDurationMinutes: number;
  lecturesPerDay: number;
  breaks: BreakTime[];
};

export type Teacher = {
  id: string;
  name: string;
  email?: string | null;
  availability?: Record<string, number[]> | null;
};

export type ClassItem = {
  id: string;
  name: string;
  semester?: number | null;
};

export type Subject = {
  id: string;
  name: string;
  code?: string | null;
  credits: number;
};

export type SubjectAssignment = {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  credits?: number | null;
  class?: ClassItem;
  subject?: Subject;
  teacher?: Teacher;
};

export type SubjectPriority = {
  id: string;
  classId: string;
  subjectId: string;
  priority: number;
};

export type GenerationSetup = {
  id: string;
  classId: string;
  semester?: number | null;
  prioritiesVerified: boolean;
  createdAt: string;
};

export type TimetableEntry = {
  id?: string;
  dayOfWeek: number;
  periodIndex: number;
  subjectId: string;
  teacherId: string;
  startTime: string;
  endTime: string;
  subject?: Subject;
  teacher?: Teacher;
};

export type Timetable = {
  id: string;
  classId: string;
  semester?: number | null;
  status: "DRAFT" | "PUBLISHED";
  createdAt: string;
  class?: ClassItem;
  entries: TimetableEntry[];
};
