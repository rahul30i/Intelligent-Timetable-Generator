import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createApiClient } from "./api/client";
import type { AdminUser } from "./api/types";
import { useAsyncResource } from "./hooks/useAsyncResource";
import { Section } from "./components/Section";
import { EmptyState } from "./components/Status";
import { Button } from "./components/ui";
import { AuthSection } from "./sections/AuthSection";
import { ConfigSection } from "./sections/ConfigSection";
import { DataSection } from "./sections/DataSection";
import { DashboardSection } from "./sections/DashboardSection";
import { GenerationSection } from "./sections/GenerationSection";
import { PrioritiesSection } from "./sections/PrioritiesSection";
import { VisualizationSection } from "./sections/VisualizationSection";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "auth", label: "Authentication" },
  { id: "config", label: "Global Configuration" },
  { id: "data", label: "Data Management" },
  { id: "priorities", label: "Subject Priorities" },
  { id: "generation", label: "Generation Setup" },
  { id: "visualization", label: "Visualization" },
];

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("itgen_token"));
  const [user, setUser] = useState<AdminUser | null>(null);
  const [active, setActive] = useState("dashboard");

  const api = useMemo(() => createApiClient(token), [token]);

  const teachersResource = useAsyncResource(
    () => api.getTeachers().then((res) => res.teachers),
    [api],
    Boolean(token),
  );
  const classesResource = useAsyncResource(
    () => api.getClasses().then((res) => res.classes),
    [api],
    Boolean(token),
  );
  const subjectsResource = useAsyncResource(
    () => api.getSubjects().then((res) => res.subjects),
    [api],
    Boolean(token),
  );
  const configResource = useAsyncResource(
    () => api.getGlobalConfig().then((res) => res.config),
    [api],
    Boolean(token),
  );
  const assignmentsResource = useAsyncResource(
    () => api.getAssignments().then((res) => res.assignments),
    [api],
    Boolean(token),
  );
  const timetablesResource = useAsyncResource(
    () => api.getTimetables().then((res) => res.timetables),
    [api],
    Boolean(token),
  );

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    api
      .me()
      .then((res) => setUser(res.user))
      .catch(() => {
        setToken(null);
        localStorage.removeItem("itgen_token");
      });
  }, [api, token]);

  const handleAuth = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem("itgen_token", newToken);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("itgen_token");
  };

  const requireAuth = (children: ReactNode) => {
    if (token) return children;
    return (
      <Section title="Authentication Required" subtitle="Sign in to access this area.">
        <EmptyState title="Locked" body="Log in as admin to unlock this module." />
      </Section>
    );
  };

  const stats = {
    teachers: teachersResource.data?.length ?? 0,
    classes: classesResource.data?.length ?? 0,
    subjects: subjectsResource.data?.length ?? 0,
    assignments: assignmentsResource.data?.length ?? 0,
    timetables: timetablesResource.data?.length ?? 0,
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">ITG</div>
          <div>
            <h1>Intelligent Timetable</h1>
            <p>Genetic Algorithm Scheduler</p>
          </div>
        </div>
        <nav className="nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${active === item.id ? "active" : ""}`}
              onClick={() => setActive(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          {token ? (
            <Button variant="ghost" onClick={handleLogout}>
              Sign out
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setActive("auth")}>
              Sign in
            </Button>
          )}
        </div>
      </aside>
      <main className="content">
        <header className="topbar">
          <div>
            <h2>{NAV_ITEMS.find((item) => item.id === active)?.label}</h2>
            <p>Plan, generate, and publish schedules in minutes.</p>
          </div>
          <div className="topbar-actions">
            <div className="pill">{user ? `Admin: ${user.email}` : "Guest"}</div>
          </div>
        </header>
        <div className="content-inner">
          {active === "dashboard" && <DashboardSection stats={stats} config={configResource.data} />}
          {active === "auth" && (
            <AuthSection token={token} user={user} onAuth={handleAuth} onLogout={handleLogout} api={api} />
          )}
          {active === "config" &&
            requireAuth(
              <ConfigSection
                config={configResource.data}
                loading={configResource.loading}
                error={configResource.error}
                onSave={async (payload) => {
                  await api.updateGlobalConfig(payload);
                  await configResource.refresh();
                }}
              />,
            )}
          {active === "data" &&
            requireAuth(
              <DataSection
                api={api}
                teachers={teachersResource.data ?? []}
                classes={classesResource.data ?? []}
                subjects={subjectsResource.data ?? []}
                loading={teachersResource.loading || classesResource.loading || subjectsResource.loading}
                error={teachersResource.error || classesResource.error || subjectsResource.error}
                refreshTeachers={teachersResource.refresh}
                refreshClasses={classesResource.refresh}
                refreshSubjects={subjectsResource.refresh}
              />,
            )}
          {active === "priorities" &&
            requireAuth(
              <PrioritiesSection
                api={api}
                classes={classesResource.data ?? []}
                subjects={subjectsResource.data ?? []}
              />,
            )}
          {active === "generation" &&
            requireAuth(
              <GenerationSection
                api={api}
                classes={classesResource.data ?? []}
                onGenerated={async () => {
                  await timetablesResource.refresh();
                }}
              />,
            )}
          {active === "visualization" &&
            requireAuth(
              <VisualizationSection
                api={api}
                classes={classesResource.data ?? []}
                subjects={subjectsResource.data ?? []}
                teachers={teachersResource.data ?? []}
                config={configResource.data}
              />,
            )}
        </div>
      </main>
    </div>
  );
}
