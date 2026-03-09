import { useEffect, useMemo, useState } from "react";
import type { ClassItem, GlobalConfig, Subject, Teacher, Timetable, TimetableEntry } from "../api/types";
import type { ApiClient } from "../api/client";
import { publicApi } from "../api/client";
import { Section } from "../components/Section";
import { Badge, Button, Field, Select } from "../components/ui";
import { Banner, EmptyState, LoadingState } from "../components/Status";
import { buildEntryMap, DAY_NAMES } from "../utils/timetable";

type VisualizationSectionProps = {
  api: ApiClient;
  classes: ClassItem[];
  subjects: Subject[];
  teachers: Teacher[];
  config: GlobalConfig | null;
};

export function VisualizationSection({
  api,
  classes,
  subjects,
  teachers,
  config,
}: VisualizationSectionProps) {
  const [classId, setClassId] = useState("");
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualOverride, setManualOverride] = useState(false);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [publicTimetables, setPublicTimetables] = useState<Timetable[]>([]);
  const [publicLoading, setPublicLoading] = useState(false);

  useEffect(() => {
    if (classes.length > 0 && !classId) {
      setClassId(classes[0].id);
    }
  }, [classes, classId]);

  const fetchTimetables = async () => {
    if (!classId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.getTimetables(classId);
      setTimetables(result.timetables);
      if (result.timetables.length > 0) {
        setSelectedId(result.timetables[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load timetables");
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicTimetables = async () => {
    setPublicLoading(true);
    try {
      const result = await publicApi.getPublishedTimetables();
      setPublicTimetables(result.timetables);
    } catch {
      setPublicTimetables([]);
    } finally {
      setPublicLoading(false);
    }
  };

  useEffect(() => {
    if (classId) {
      fetchTimetables();
    }
  }, [classId]);

  useEffect(() => {
    fetchPublicTimetables();
  }, []);

  const selectedTimetable = timetables.find((item) => item.id === selectedId) ?? null;
  const selectedClass = selectedTimetable
    ? classes.find((item) => item.id === selectedTimetable.classId)
    : null;

  useEffect(() => {
    if (selectedTimetable) {
      setEntries(selectedTimetable.entries.map((entry) => ({ ...entry })));
    }
  }, [selectedTimetable]);

  const periods = config?.lecturesPerDay ?? 6;
  const days = 5;

  const entryMap = useMemo(() => buildEntryMap(selectedTimetable?.entries ?? []), [selectedTimetable]);

  const updateEntry = (index: number, key: "subjectId" | "teacherId", value: string) => {
    setEntries((prev) => prev.map((entry, idx) => (idx === index ? { ...entry, [key]: value } : entry)));
  };

  const handleSaveOverrides = async () => {
    if (!selectedTimetable) return;
    setSaving(true);
    setError(null);
    try {
      const result = await api.updateTimetableEntries(selectedTimetable.id, { entries });
      if (result.timetable) {
        setTimetables((prev) => prev.map((item) => (item.id === result.timetable?.id ? result.timetable : item)));
        setSelectedId(result.timetable.id);
        setManualOverride(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save overrides");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedTimetable) return;
    setSaving(true);
    setError(null);
    try {
      const result = await api.publishTimetable(selectedTimetable.id);
      setTimetables((prev) => prev.map((item) => (item.id === result.timetable.id ? result.timetable : item)));
      setSelectedId(result.timetable.id);
      await fetchPublicTimetables();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title="Visualization" subtitle="Inspect generated schedules, override, and publish.">
      {error ? <Banner tone="error">{error}</Banner> : null}
      <div className="grid two">
        <div className="card">
          <div className="card-header">
            <h3>Timetables</h3>
            <p>Saved schedules by class.</p>
          </div>
          <div className="card-body">
            <Field label="Class">
              <Select value={classId} onChange={(event) => setClassId(event.target.value)}>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>
            {loading ? (
              <LoadingState label="Loading timetables" />
            ) : timetables.length === 0 ? (
              <EmptyState title="No timetables" body="Run generation to create a schedule." />
            ) : (
              <div className="table">
                <div className="table-row header">
                  <span>Created</span>
                  <span>Semester</span>
                  <span>Status</span>
                </div>
                {timetables.map((item) => (
                  <button
                    key={item.id}
                    className={`table-row selectable ${selectedId === item.id ? "active" : ""}`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                    <span>{item.semester ?? "-"}</span>
                    <span>
                      <Badge tone={item.status === "PUBLISHED" ? "success" : "warning"}>{item.status}</Badge>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3>Public Timetable View</h3>
            <p>Published schedules visible without login.</p>
          </div>
          <div className="card-body">
            {publicLoading ? (
              <LoadingState label="Loading public view" />
            ) : publicTimetables.length === 0 ? (
              <EmptyState title="No published timetables" body="Publish a timetable to show it here." />
            ) : (
              <div className="table">
                <div className="table-row header">
                  <span>Class</span>
                  <span>Created</span>
                  <span>Status</span>
                </div>
                {publicTimetables.map((item) => (
                  <div key={item.id} className="table-row">
                    <span>{item.class?.name ?? "-"}</span>
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                    <span>
                      <Badge tone="success">Published</Badge>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedTimetable ? (
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Timetable Grid</h3>
              <p>{selectedClass?.name ?? "Class"} - {selectedTimetable.semester ?? "Semester"}</p>
            </div>
            <div className="inline-actions">
              <Button variant="outline" onClick={() => setManualOverride((prev) => !prev)}>
                {manualOverride ? "Cancel override" : "Manual override"}
              </Button>
              <Button variant="primary" onClick={handlePublish} disabled={saving}>
                {saving ? "Publishing..." : "Publish"}
              </Button>
            </div>
          </div>
          <div className="card-body">
            <div className="timetable-grid">
              <div className="grid-header" />
              {DAY_NAMES.slice(0, days).map((day) => (
                <div key={day} className="grid-header">
                  {day}
                </div>
              ))}
              {Array.from({ length: periods }).map((_, periodIndex) => (
                <div key={`row-${periodIndex}`} className="grid-row">
                  <div className="grid-time">Period {periodIndex + 1}</div>
                  {DAY_NAMES.slice(0, days).map((_, dayIndex) => {
                    const entry = entryMap.get(`${dayIndex}-${periodIndex}`);
                    const subject = subjects.find((item) => item.id === entry?.subjectId);
                    const teacher = teachers.find((item) => item.id === entry?.teacherId);
                    return (
                      <div key={`${dayIndex}-${periodIndex}`} className="grid-cell">
                        <div className="grid-subject">{subject?.name ?? "-"}</div>
                        <div className="grid-meta">{teacher?.name ?? "Unassigned"}</div>
                        <div className="grid-meta">
                          {entry?.startTime ?? ""} - {entry?.endTime ?? ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {manualOverride ? (
              <div className="override-panel">
                <h4>Manual Override</h4>
                <p>Edit subjects or teachers per slot and save.</p>
                <div className="table">
                  <div className="table-row header">
                    <span>Day</span>
                    <span>Period</span>
                    <span>Subject</span>
                    <span>Teacher</span>
                    <span>Time</span>
                  </div>
                  {entries.map((entry, idx) => (
                    <div key={`${entry.dayOfWeek}-${entry.periodIndex}`} className="table-row">
                      <span>{DAY_NAMES[entry.dayOfWeek] ?? entry.dayOfWeek}</span>
                      <span>{entry.periodIndex + 1}</span>
                      <span>
                        <Select
                          value={entry.subjectId}
                          onChange={(event) => updateEntry(idx, "subjectId", event.target.value)}
                        >
                          {subjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>
                              {subject.name}
                            </option>
                          ))}
                        </Select>
                      </span>
                      <span>
                        <Select
                          value={entry.teacherId}
                          onChange={(event) => updateEntry(idx, "teacherId", event.target.value)}
                        >
                          {teachers.map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>
                              {teacher.name}
                            </option>
                          ))}
                        </Select>
                      </span>
                      <span>
                        {entry.startTime} - {entry.endTime}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="inline-actions">
                  <Button variant="primary" onClick={handleSaveOverrides} disabled={saving}>
                    {saving ? "Saving..." : "Save overrides"}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </Section>
  );
}
