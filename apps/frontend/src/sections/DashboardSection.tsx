import type { GlobalConfig } from "../api/types";
import { Section } from "../components/Section";
import { Badge } from "../components/ui";

export function DashboardSection({
  stats,
  config,
}: {
  stats: {
    teachers: number;
    classes: number;
    subjects: number;
    assignments: number;
    timetables: number;
  };
  config: GlobalConfig | null;
}) {
  return (
    <Section title="Admin Dashboard" subtitle="A quick snapshot of your scheduling workspace.">
      <div className="grid three">
        <div className="card metric">
          <h4>Teachers</h4>
          <p>{stats.teachers}</p>
          <Badge tone="info">Availability tracked</Badge>
        </div>
        <div className="card metric">
          <h4>Classes</h4>
          <p>{stats.classes}</p>
          <Badge tone="info">Semester ready</Badge>
        </div>
        <div className="card metric">
          <h4>Subjects</h4>
          <p>{stats.subjects}</p>
          <Badge tone="info">Credits mapped</Badge>
        </div>
        <div className="card metric">
          <h4>Assignments</h4>
          <p>{stats.assignments}</p>
          <Badge tone="warning">Workload check</Badge>
        </div>
        <div className="card metric">
          <h4>Timetables</h4>
          <p>{stats.timetables}</p>
          <Badge tone="success">Generated</Badge>
        </div>
        <div className="card metric">
          <h4>Global Config</h4>
          <p>{config ? `${config.lecturesPerDay} lectures/day` : "Not set"}</p>
          <Badge tone={config ? "success" : "warning"}>{config ? "Ready" : "Pending"}</Badge>
        </div>
      </div>
    </Section>
  );
}
