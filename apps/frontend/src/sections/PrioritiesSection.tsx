import { useEffect, useMemo, useState } from "react";
import type { ClassItem, Subject, SubjectPriority } from "../api/types";
import type { ApiClient } from "../api/client";
import { Section } from "../components/Section";
import { Banner, EmptyState, LoadingState } from "../components/Status";
import { Button, Field, Select } from "../components/ui";

type PrioritiesSectionProps = {
  api: ApiClient;
  classes: ClassItem[];
  subjects: Subject[];
};

export function PrioritiesSection({ api, classes, subjects }: PrioritiesSectionProps) {
  const [classId, setClassId] = useState("");
  const [priorities, setPriorities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const hasData = classes.length > 0 && subjects.length > 0;

  useEffect(() => {
    if (classes.length > 0 && !classId) {
      setClassId(classes[0].id);
    }
  }, [classes, classId]);

  const loadPriorities = async () => {
    if (!classId) return;
    setError(null);
    setLoading(true);
    try {
      const result = await api.getPriorities(classId);
      const mapped: Record<string, number> = {};
      result.priorities.forEach((item: SubjectPriority) => {
        mapped[item.subjectId] = item.priority;
      });
      setPriorities(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load priorities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPriorities();
  }, [classId]);

  const defaultPriority = useMemo(() => 3, []);

  const handleSave = async () => {
    if (!classId) return;
    setSaving(true);
    setError(null);
    try {
      await api.setPriorities({
        classId,
        priorities: subjects.map((subject) => ({
          subjectId: subject.id,
          priority: priorities[subject.id] ?? defaultPriority,
        })),
      });
      await loadPriorities();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save priorities");
    } finally {
      setSaving(false);
    }
  };

  if (!hasData) {
    return (
      <Section title="Subject Priorities" subtitle="Prioritize subjects before generation.">
        <EmptyState title="No data yet" body="Create classes and subjects first." />
      </Section>
    );
  }

  return (
    <Section title="Subject Priorities" subtitle="Adjust priorities for each class before generation.">
      {error ? <Banner tone="error">{error}</Banner> : null}
      <div className="inline-actions">
        <Field label="Class">
          <Select value={classId} onChange={(event) => setClassId(event.target.value)}>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {loading ? (
        <LoadingState label="Loading priorities" />
      ) : (
        <div className="card">
          <div className="card-header">
            <h3>Priorities</h3>
            <p>1 is lowest, 5 is highest.</p>
          </div>
          <div className="card-body">
            <div className="table">
              <div className="table-row header">
                <span>Subject</span>
                <span>Priority</span>
              </div>
              {subjects.map((subject) => (
                <div key={subject.id} className="table-row">
                  <span>{subject.name}</span>
                  <span>
                    <Select
                      value={priorities[subject.id] ?? defaultPriority}
                      onChange={(event) =>
                        setPriorities((prev) => ({ ...prev, [subject.id]: Number(event.target.value) }))
                      }
                    >
                      {[1, 2, 3, 4, 5].map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </Select>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="section-actions">
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save priorities"}
        </Button>
      </div>
    </Section>
  );
}
