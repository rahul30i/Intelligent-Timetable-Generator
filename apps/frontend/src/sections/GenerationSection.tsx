import { useEffect, useState } from "react";
import type { ClassItem, GenerationSetup, Timetable } from "../api/types";
import type { ApiClient } from "../api/client";
import { Section } from "../components/Section";
import { Banner, EmptyState, LoadingState } from "../components/Status";
import { Button, Field, Input, Select } from "../components/ui";

type GenerationSectionProps = {
  api: ApiClient;
  classes: ClassItem[];
  onGenerated: (timetable: Timetable) => void;
};

export function GenerationSection({ api, classes, onGenerated }: GenerationSectionProps) {
  const [classId, setClassId] = useState("");
  const [semester, setSemester] = useState("");
  const [setups, setSetups] = useState<GenerationSetup[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (classes.length > 0 && !classId) {
      setClassId(classes[0].id);
    }
  }, [classes, classId]);

  const fetchSetups = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getGenerationSetups(classId || undefined);
      setSetups(result.setups);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load setups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classId) {
      fetchSetups();
    }
  }, [classId]);

  const verifyPriorities = async () => {
    if (!classId) return;
    setLoading(true);
    setError(null);
    try {
      await api.createGenerationSetup({ classId, semester: semester ? Number(semester) : undefined });
      await fetchSetups();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save setup");
    } finally {
      setLoading(false);
    }
  };

  const runGeneration = async () => {
    if (!classId) return;
    setRunning(true);
    setError(null);
    try {
      const result = await api.runGeneration({ classId, semester: semester ? Number(semester) : undefined });
      onGenerated(result.timetable);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setRunning(false);
    }
  };

  if (classes.length === 0) {
    return (
      <Section title="Generation Setup" subtitle="Select a class and semester before running GA.">
        <EmptyState title="No classes" body="Create a class in Data Management." />
      </Section>
    );
  }

  return (
    <Section title="Generation Setup" subtitle="Confirm priorities, then run the genetic algorithm.">
      {error ? <Banner tone="error">{error}</Banner> : null}
      <div className="grid two">
        <div className="card">
          <div className="card-header">
            <h3>Setup</h3>
            <p>Select class and semester to verify priorities.</p>
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
            <Field label="Semester">
              <Input
                type="number"
                min={1}
                max={12}
                value={semester}
                onChange={(event) => setSemester(event.target.value)}
              />
            </Field>
            <div className="inline-actions">
              <Button variant="outline" onClick={verifyPriorities} disabled={loading}>
                {loading ? "Verifying..." : "Verify priorities"}
              </Button>
              <Button variant="primary" onClick={runGeneration} disabled={running}>
                {running ? "Running GA..." : "Run generation"}
              </Button>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3>Recent Setup Checks</h3>
            <p>Verify priorities before each generation.</p>
          </div>
          <div className="card-body">
            {loading ? (
              <LoadingState label="Loading setups" />
            ) : setups.length === 0 ? (
              <EmptyState title="No setups" body="Verify priorities to log a setup." />
            ) : (
              <div className="table">
                <div className="table-row header">
                  <span>Date</span>
                  <span>Semester</span>
                  <span>Status</span>
                </div>
                {setups.map((setup) => (
                  <div key={setup.id} className="table-row">
                    <span>{new Date(setup.createdAt).toLocaleString()}</span>
                    <span>{setup.semester ?? "-"}</span>
                    <span>{setup.prioritiesVerified ? "Verified" : "Pending"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}
