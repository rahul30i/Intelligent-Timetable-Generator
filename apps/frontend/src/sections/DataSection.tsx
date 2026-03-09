import { useEffect, useMemo, useState } from "react";
import type { ClassItem, Subject, SubjectAssignment, Teacher } from "../api/types";
import type { ApiClient } from "../api/client";
import { Section } from "../components/Section";
import { Banner, EmptyState, LoadingState } from "../components/Status";
import { Button, Field, Input, Select, TextArea } from "../components/ui";

type DataSectionProps = {
  api: ApiClient;
  teachers: Teacher[];
  classes: ClassItem[];
  subjects: Subject[];
  loading: boolean;
  error: string | null;
  refreshTeachers: () => Promise<void>;
  refreshClasses: () => Promise<void>;
  refreshSubjects: () => Promise<void>;
};

export function DataSection({
  api,
  teachers,
  classes,
  subjects,
  loading,
  error,
  refreshTeachers,
  refreshClasses,
  refreshSubjects,
}: DataSectionProps) {
  const [teacherForm, setTeacherForm] = useState({ id: "", name: "", email: "", availability: "" });
  const [classForm, setClassForm] = useState({ id: "", name: "", semester: "" });
  const [subjectForm, setSubjectForm] = useState({ id: "", name: "", code: "", credits: "1" });
  const [assignmentForm, setAssignmentForm] = useState({
    classId: "",
    subjectId: "",
    teacherId: "",
    credits: "",
  });
  const [assignments, setAssignments] = useState<SubjectAssignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignmentsError, setAssignmentsError] = useState<string | null>(null);
  const [filterClassId, setFilterClassId] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const hasCoreData = teachers.length + classes.length + subjects.length > 0;

  const availabilityHint =
    'Optional JSON: {"0":[0,1,2],"1":[2,3]} means Mon/Tue periods allowed.';

  const fetchAssignments = async () => {
    setAssignmentsError(null);
    setAssignmentsLoading(true);
    try {
      const result = await api.getAssignments(filterClassId || undefined);
      setAssignments(result.assignments);
    } catch (err) {
      setAssignmentsError(err instanceof Error ? err.message : "Failed to load assignments");
    } finally {
      setAssignmentsLoading(false);
    }
  };

  useEffect(() => {
    if (classes.length > 0 && !filterClassId) {
      setFilterClassId(classes[0].id);
    }
  }, [classes, filterClassId]);

  useEffect(() => {
    if (filterClassId) {
      fetchAssignments();
    }
  }, [filterClassId]);

  const assignmentOptionsReady = useMemo(
    () => classes.length > 0 && subjects.length > 0 && teachers.length > 0,
    [classes.length, subjects.length, teachers.length],
  );

  const handleTeacherSave = async () => {
    setLocalError(null);
    let availability: Record<string, number[]> | undefined;
    if (teacherForm.availability.trim()) {
      try {
        availability = JSON.parse(teacherForm.availability.trim());
      } catch (err) {
        setLocalError("Availability JSON is invalid.");
        return;
      }
    }

    if (teacherForm.id) {
      await api.updateTeacher(teacherForm.id, {
        name: teacherForm.name,
        email: teacherForm.email || null,
        availability,
      });
    } else {
      await api.createTeacher({ name: teacherForm.name, email: teacherForm.email || undefined, availability });
    }
    setTeacherForm({ id: "", name: "", email: "", availability: "" });
    await refreshTeachers();
  };

  const handleClassSave = async () => {
    setLocalError(null);
    const semester = classForm.semester ? Number(classForm.semester) : undefined;
    if (classForm.id) {
      await api.updateClass(classForm.id, { name: classForm.name, semester: semester ?? null });
    } else {
      await api.createClass({ name: classForm.name, semester });
    }
    setClassForm({ id: "", name: "", semester: "" });
    await refreshClasses();
  };

  const handleSubjectSave = async () => {
    setLocalError(null);
    const credits = Number(subjectForm.credits || 1);
    if (subjectForm.id) {
      await api.updateSubject(subjectForm.id, {
        name: subjectForm.name,
        code: subjectForm.code || null,
        credits,
      });
    } else {
      await api.createSubject({ name: subjectForm.name, code: subjectForm.code || undefined, credits });
    }
    setSubjectForm({ id: "", name: "", code: "", credits: "1" });
    await refreshSubjects();
  };

  const handleAssignmentCreate = async () => {
    setLocalError(null);
    if (!assignmentForm.classId || !assignmentForm.subjectId || !assignmentForm.teacherId) {
      setLocalError("Select a class, subject, and teacher.");
      return;
    }
    await api.createAssignment({
      classId: assignmentForm.classId,
      subjectId: assignmentForm.subjectId,
      teacherId: assignmentForm.teacherId,
      credits: assignmentForm.credits ? Number(assignmentForm.credits) : undefined,
    });
    setAssignmentForm({
      classId: assignmentForm.classId,
      subjectId: "",
      teacherId: "",
      credits: "",
    });
    await fetchAssignments();
  };

  const handleDelete = async (action: () => Promise<void>) => {
    setLocalError(null);
    try {
      await action();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <Section title="Data Management" subtitle="Create teachers, classes, subjects, and assign them.">
      {error ? <Banner tone="error">{error}</Banner> : null}
      {localError ? <Banner tone="error">{localError}</Banner> : null}
      {loading && !hasCoreData ? <LoadingState label="Loading data" /> : null}
      <div className="grid three">
        <div className="card">
          <div className="card-header">
            <h3>Teachers</h3>
            <p>Manage faculty and their availability.</p>
          </div>
          <div className="card-body">
            <Field label="Name">
              <Input value={teacherForm.name} onChange={(event) => setTeacherForm({ ...teacherForm, name: event.target.value })} />
            </Field>
            <Field label="Email">
              <Input value={teacherForm.email} onChange={(event) => setTeacherForm({ ...teacherForm, email: event.target.value })} />
            </Field>
            <Field label="Availability" hint={availabilityHint}>
              <TextArea
                value={teacherForm.availability}
                rows={3}
                onChange={(event) => setTeacherForm({ ...teacherForm, availability: event.target.value })}
              />
            </Field>
            <div className="inline-actions">
              <Button variant="primary" onClick={handleTeacherSave} disabled={!teacherForm.name}>
                {teacherForm.id ? "Update" : "Add teacher"}
              </Button>
              {teacherForm.id ? (
                <Button variant="ghost" onClick={() => setTeacherForm({ id: "", name: "", email: "", availability: "" })}>
                  Cancel
                </Button>
              ) : null}
            </div>
            {teachers.length === 0 ? (
              <EmptyState title="No teachers yet" body="Add faculty to enable assignments." />
            ) : (
              <div className="table">
                <div className="table-row header">
                  <span>Name</span>
                  <span>Email</span>
                  <span>Actions</span>
                </div>
                {teachers.map((teacher) => (
                  <div key={teacher.id} className="table-row">
                    <span>{teacher.name}</span>
                    <span>{teacher.email ?? "-"}</span>
                    <span>
                      <Button
                        variant="ghost"
                        onClick={() =>
                          setTeacherForm({
                            id: teacher.id,
                            name: teacher.name,
                            email: teacher.email ?? "",
                            availability: teacher.availability ? JSON.stringify(teacher.availability) : "",
                          })
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleDelete(() => api.deleteTeacher(teacher.id).then(refreshTeachers))}
                      >
                        Delete
                      </Button>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Classes</h3>
            <p>Create cohorts and semesters.</p>
          </div>
          <div className="card-body">
            <Field label="Class name">
              <Input value={classForm.name} onChange={(event) => setClassForm({ ...classForm, name: event.target.value })} />
            </Field>
            <Field label="Semester">
              <Input
                type="number"
                min={1}
                max={12}
                value={classForm.semester}
                onChange={(event) => setClassForm({ ...classForm, semester: event.target.value })}
              />
            </Field>
            <div className="inline-actions">
              <Button variant="primary" onClick={handleClassSave} disabled={!classForm.name}>
                {classForm.id ? "Update" : "Add class"}
              </Button>
              {classForm.id ? (
                <Button variant="ghost" onClick={() => setClassForm({ id: "", name: "", semester: "" })}>
                  Cancel
                </Button>
              ) : null}
            </div>
            {classes.length === 0 ? (
              <EmptyState title="No classes yet" body="Create at least one class to assign subjects." />
            ) : (
              <div className="table">
                <div className="table-row header">
                  <span>Name</span>
                  <span>Semester</span>
                  <span>Actions</span>
                </div>
                {classes.map((item) => (
                  <div key={item.id} className="table-row">
                    <span>{item.name}</span>
                    <span>{item.semester ?? "-"}</span>
                    <span>
                      <Button
                        variant="ghost"
                        onClick={() =>
                          setClassForm({ id: item.id, name: item.name, semester: item.semester?.toString() ?? "" })
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleDelete(() => api.deleteClass(item.id).then(refreshClasses))}
                      >
                        Delete
                      </Button>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Subjects</h3>
            <p>Define subjects and their credits.</p>
          </div>
          <div className="card-body">
            <Field label="Subject name">
              <Input value={subjectForm.name} onChange={(event) => setSubjectForm({ ...subjectForm, name: event.target.value })} />
            </Field>
            <Field label="Code">
              <Input value={subjectForm.code} onChange={(event) => setSubjectForm({ ...subjectForm, code: event.target.value })} />
            </Field>
            <Field label="Credits">
              <Input
                type="number"
                min={1}
                max={10}
                value={subjectForm.credits}
                onChange={(event) => setSubjectForm({ ...subjectForm, credits: event.target.value })}
              />
            </Field>
            <div className="inline-actions">
              <Button variant="primary" onClick={handleSubjectSave} disabled={!subjectForm.name}>
                {subjectForm.id ? "Update" : "Add subject"}
              </Button>
              {subjectForm.id ? (
                <Button variant="ghost" onClick={() => setSubjectForm({ id: "", name: "", code: "", credits: "1" })}>
                  Cancel
                </Button>
              ) : null}
            </div>
            {subjects.length === 0 ? (
              <EmptyState title="No subjects yet" body="Create subjects before assigning them to classes." />
            ) : (
              <div className="table">
                <div className="table-row header">
                  <span>Name</span>
                  <span>Credits</span>
                  <span>Actions</span>
                </div>
                {subjects.map((item) => (
                  <div key={item.id} className="table-row">
                    <span>{item.name}</span>
                    <span>{item.credits}</span>
                    <span>
                      <Button
                        variant="ghost"
                        onClick={() =>
                          setSubjectForm({
                            id: item.id,
                            name: item.name,
                            code: item.code ?? "",
                            credits: item.credits.toString(),
                          })
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleDelete(() => api.deleteSubject(item.id).then(refreshSubjects))}
                      >
                        Delete
                      </Button>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Assignments</h3>
          <p>Assign subjects to classes and teachers.</p>
        </div>
        <div className="card-body">
          {!assignmentOptionsReady ? (
            <EmptyState title="Complete core data" body="Add classes, subjects, and teachers first." />
          ) : (
            <div className="grid four">
              <Field label="Class">
                <Select
                  value={assignmentForm.classId}
                  onChange={(event) => setAssignmentForm({ ...assignmentForm, classId: event.target.value })}
                >
                  <option value="">Select class</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Subject">
                <Select
                  value={assignmentForm.subjectId}
                  onChange={(event) => setAssignmentForm({ ...assignmentForm, subjectId: event.target.value })}
                >
                  <option value="">Select subject</option>
                  {subjects.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Teacher">
                <Select
                  value={assignmentForm.teacherId}
                  onChange={(event) => setAssignmentForm({ ...assignmentForm, teacherId: event.target.value })}
                >
                  <option value="">Select teacher</option>
                  {teachers.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Credits (override)">
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={assignmentForm.credits}
                  onChange={(event) => setAssignmentForm({ ...assignmentForm, credits: event.target.value })}
                />
              </Field>
            </div>
          )}
          <div className="inline-actions">
            <Button variant="primary" onClick={handleAssignmentCreate} disabled={!assignmentOptionsReady}>
              Add assignment
            </Button>
            <Field label="Filter by class">
              <Select value={filterClassId} onChange={(event) => setFilterClassId(event.target.value)}>
                <option value="">All classes</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          {assignmentsError ? <Banner tone="error">{assignmentsError}</Banner> : null}
          {assignmentsLoading ? (
            <LoadingState label="Loading assignments" />
          ) : assignments.length === 0 ? (
            <EmptyState title="No assignments" body="Start by assigning subjects to classes." />
          ) : (
            <div className="table">
              <div className="table-row header">
                <span>Class</span>
                <span>Subject</span>
                <span>Teacher</span>
                <span>Credits</span>
                <span>Actions</span>
              </div>
              {assignments.map((assignment) => (
                <div key={assignment.id} className="table-row">
                  <span>{assignment.class?.name ?? "-"}</span>
                  <span>{assignment.subject?.name ?? "-"}</span>
                  <span>{assignment.teacher?.name ?? "-"}</span>
                  <span>{assignment.credits ?? assignment.subject?.credits ?? "-"}</span>
                  <span>
                    <Button
                      variant="ghost"
                      onClick={() => handleDelete(() => api.deleteAssignment(assignment.id).then(fetchAssignments))}
                    >
                      Remove
                    </Button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
