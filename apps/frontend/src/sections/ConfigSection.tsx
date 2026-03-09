import { useEffect, useState } from "react";
import type { GlobalConfig } from "../api/types";
import { Section } from "../components/Section";
import { Banner, LoadingState } from "../components/Status";
import { Button, Field, Input } from "../components/ui";

export function ConfigSection({
  config,
  loading,
  error,
  onSave,
}: {
  config: GlobalConfig | null;
  loading: boolean;
  error: string | null;
  onSave: (payload: {
    schoolStartTime: string;
    lectureDurationMinutes: number;
    lecturesPerDay: number;
    breaks: Array<{ startTime: string; endTime: string; label?: string }>;
  }) => Promise<void>;
}) {
  const [schoolStartTime, setSchoolStartTime] = useState("08:00");
  const [lectureDuration, setLectureDuration] = useState(60);
  const [lecturesPerDay, setLecturesPerDay] = useState(6);
  const [breaks, setBreaks] = useState<Array<{ startTime: string; endTime: string; label?: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (config) {
      setSchoolStartTime(config.schoolStartTime);
      setLectureDuration(config.lectureDurationMinutes);
      setLecturesPerDay(config.lecturesPerDay);
      setBreaks(
        config.breaks.map((br) => ({
          startTime: br.startTime,
          endTime: br.endTime,
          label: br.label ?? "",
        })),
      );
    }
  }, [config]);

  const handleSave = async () => {
    setLocalError(null);
    setSaving(true);
    try {
      await onSave({
        schoolStartTime,
        lectureDurationMinutes: Number(lectureDuration),
        lecturesPerDay: Number(lecturesPerDay),
        breaks,
      });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Failed to update configuration");
    } finally {
      setSaving(false);
    }
  };

  const updateBreak = (index: number, key: "startTime" | "endTime" | "label", value: string) => {
    setBreaks((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)),
    );
  };

  const removeBreak = (index: number) => {
    setBreaks((prev) => prev.filter((_, idx) => idx !== index));
  };

  if (loading && !config) {
    return (
      <Section title="Global Configuration" subtitle="Define the baseline schedule settings.">
        <LoadingState label="Loading configuration" />
      </Section>
    );
  }

  return (
    <Section title="Global Configuration" subtitle="Set school timing, lecture duration, and breaks.">
      {error ? <Banner tone="error">{error}</Banner> : null}
      {localError ? <Banner tone="error">{localError}</Banner> : null}
      <div className="grid two">
        <div className="card">
          <div className="card-header">
            <h3>School Timing</h3>
            <p>Keep the schedule consistent across all classes.</p>
          </div>
          <div className="card-body">
            <Field label="School start time">
              <Input value={schoolStartTime} onChange={(event) => setSchoolStartTime(event.target.value)} />
            </Field>
            <Field label="Lecture duration (minutes)">
              <Input
                type="number"
                min={15}
                max={240}
                value={lectureDuration}
                onChange={(event) => setLectureDuration(Number(event.target.value))}
              />
            </Field>
            <Field label="Lectures per day">
              <Input
                type="number"
                min={1}
                max={12}
                value={lecturesPerDay}
                onChange={(event) => setLecturesPerDay(Number(event.target.value))}
              />
            </Field>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3>Break Timings</h3>
            <p>Insert lunch and short breaks between lectures.</p>
          </div>
          <div className="card-body">
            {breaks.length === 0 ? <div className="pill muted">No breaks defined</div> : null}
            {breaks.map((br, idx) => (
              <div key={`${br.startTime}-${idx}`} className="break-row">
                <Input
                  value={br.startTime}
                  placeholder="09:30"
                  onChange={(event) => updateBreak(idx, "startTime", event.target.value)}
                />
                <Input
                  value={br.endTime}
                  placeholder="09:45"
                  onChange={(event) => updateBreak(idx, "endTime", event.target.value)}
                />
                <Input
                  value={br.label ?? ""}
                  placeholder="Short break"
                  onChange={(event) => updateBreak(idx, "label", event.target.value)}
                />
                <Button variant="ghost" onClick={() => removeBreak(idx)}>
                  Remove
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => setBreaks((prev) => [...prev, { startTime: "", endTime: "", label: "" }])}
            >
              Add break
            </Button>
          </div>
        </div>
      </div>
      <div className="section-actions">
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save configuration"}
        </Button>
      </div>
    </Section>
  );
}
