import {
  type AdminUser,
  type ClassItem,
  type GenerationSetup,
  type GlobalConfig,
  type Subject,
  type SubjectAssignment,
  type SubjectPriority,
  type Teacher,
  type Timetable,
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.error ?? data?.message ?? response.statusText;
    throw new Error(message);
  }

  return data as T;
}

export function createApiClient(token: string | null) {
  return {
    login: (payload: { email: string; password: string }) =>
      request<{ token: string }>("/api/auth/login", { method: "POST", body: payload }),
    register: (payload: { email: string; password: string }) =>
      request<{ token: string }>("/api/auth/register", { method: "POST", body: payload }),
    me: () => request<{ user: AdminUser }>("/api/auth/me", { token }),

    getGlobalConfig: () => request<{ config: GlobalConfig | null }>("/api/config/global", { token }),
    updateGlobalConfig: (payload: {
      schoolStartTime: string;
      lectureDurationMinutes: number;
      lecturesPerDay: number;
      breaks: Array<{ startTime: string; endTime: string; label?: string }>;
    }) => request<{ config: GlobalConfig }>("/api/config/global", { method: "PUT", body: payload, token }),

    getTeachers: () => request<{ teachers: Teacher[] }>("/api/teachers", { token }),
    createTeacher: (payload: {
      name: string;
      email?: string;
      availability?: Record<string, number[]>;
    }) => request<{ teacher: Teacher }>("/api/teachers", { method: "POST", body: payload, token }),
    updateTeacher: (id: string, payload: {
      name: string;
      email?: string | null;
      availability?: Record<string, number[]>;
    }) => request<{ teacher: Teacher }>(`/api/teachers/${id}`, { method: "PUT", body: payload, token }),
    deleteTeacher: (id: string) => request<void>(`/api/teachers/${id}`, { method: "DELETE", token }),

    getClasses: () => request<{ classes: ClassItem[] }>("/api/classes", { token }),
    createClass: (payload: { name: string; semester?: number }) =>
      request<{ class: ClassItem }>("/api/classes", { method: "POST", body: payload, token }),
    updateClass: (id: string, payload: { name: string; semester?: number | null }) =>
      request<{ class: ClassItem }>(`/api/classes/${id}`, { method: "PUT", body: payload, token }),
    deleteClass: (id: string) => request<void>(`/api/classes/${id}`, { method: "DELETE", token }),

    getSubjects: () => request<{ subjects: Subject[] }>("/api/subjects", { token }),
    createSubject: (payload: { name: string; code?: string; credits: number }) =>
      request<{ subject: Subject }>("/api/subjects", { method: "POST", body: payload, token }),
    updateSubject: (id: string, payload: { name: string; code?: string | null; credits: number }) =>
      request<{ subject: Subject }>(`/api/subjects/${id}`, { method: "PUT", body: payload, token }),
    deleteSubject: (id: string) => request<void>(`/api/subjects/${id}`, { method: "DELETE", token }),

    getAssignments: (classId?: string) =>
      request<{ assignments: SubjectAssignment[] }>(
        classId ? `/api/assignments?classId=${classId}` : "/api/assignments",
        { token },
      ),
    createAssignment: (payload: {
      classId: string;
      subjectId: string;
      teacherId: string;
      credits?: number;
    }) => request<{ assignment: SubjectAssignment }>("/api/assignments", { method: "POST", body: payload, token }),
    deleteAssignment: (id: string) => request<void>(`/api/assignments/${id}`, { method: "DELETE", token }),

    getPriorities: (classId: string) =>
      request<{ priorities: SubjectPriority[] }>(`/api/priorities?classId=${classId}`, { token }),
    setPriorities: (payload: { classId: string; priorities: Array<{ subjectId: string; priority: number }> }) =>
      request<{ priorities: SubjectPriority[] }>("/api/priorities", { method: "PUT", body: payload, token }),

    createGenerationSetup: (payload: { classId: string; semester?: number }) =>
      request<{ setup: GenerationSetup }>("/api/generation/setup", { method: "POST", body: payload, token }),
    getGenerationSetups: (classId?: string) =>
      request<{ setups: GenerationSetup[] }>(
        classId ? `/api/generation/setup?classId=${classId}` : "/api/generation/setup",
        { token },
      ),
    runGeneration: (payload: { classId: string; semester?: number }) =>
      request<{ timetable: Timetable }>("/api/generation/run", { method: "POST", body: payload, token }),

    getTimetables: (classId?: string, semester?: number) => {
      const params = new URLSearchParams();
      if (classId) params.set("classId", classId);
      if (semester) params.set("semester", String(semester));
      const query = params.toString();
      return request<{ timetables: Timetable[] }>(
        query ? `/api/timetables?${query}` : "/api/timetables",
        { token },
      );
    },
    getTimetable: (id: string) => request<{ timetable: Timetable | null }>(`/api/timetables/${id}`, { token }),
    updateTimetableEntries: (id: string, payload: { entries: Timetable["entries"] }) =>
      request<{ timetable: Timetable | null }>(`/api/timetables/${id}/entries`, { method: "PUT", body: payload, token }),
    publishTimetable: (id: string) =>
      request<{ timetable: Timetable }>(`/api/timetables/${id}/publish`, { method: "POST", token }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

export const publicApi = {
  getPublishedTimetables: (classId?: string) =>
    request<{ timetables: Timetable[] }>(
      classId ? `/api/public/timetables?classId=${classId}` : "/api/public/timetables",
    ),
  getPublishedTimetable: (id: string) =>
    request<{ timetable: Timetable | null }>(`/api/public/timetables/${id}`),
};
