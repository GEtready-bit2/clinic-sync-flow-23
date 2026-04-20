import { useMemo, useState } from "react";
import {
  addDays,
  endOfWeek,
  format,
  isSameDay,
  startOfWeek,
} from "date-fns";
import {
  Activity,
  CalendarDays,
  ClipboardList,
  Clock,
  FileText,
  MapPin,
  Save,
  Stethoscope,
  Users,
} from "lucide-react";
import { useAppointments } from "@/lib/appointments-store";
import { useNotes, notesStore } from "@/lib/notes-store";
import { auth } from "@/lib/auth-store";
import { locations, patients, services } from "@/lib/mock-data";
import type { Appointment } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8 → 18
const HOUR_PX = 56;

export function DoctorWorkspace() {
  const me = auth.current()!;
  const all = useAppointments();
  const today = useMemo(() => new Date(), []);
  const [selectedDay, setSelectedDay] = useState<Date>(today);
  const [selectedApptId, setSelectedApptId] = useState<string | null>(null);

  // Only my appointments — RLS-style filter at the UI layer for the mock.
  const mine = useMemo(
    () => all.filter((a) => a.doctor_id === me.id),
    [all, me.id],
  );

  const todayAppts = useMemo(
    () =>
      mine
        .filter((a) => isSameDay(new Date(a.starts_at), today))
        .sort(
          (a, b) =>
            new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
        ),
    [mine, today],
  );

  const dayAppts = useMemo(
    () =>
      mine
        .filter((a) => isSameDay(new Date(a.starts_at), selectedDay))
        .sort(
          (a, b) =>
            new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
        ),
    [mine, selectedDay],
  );

  // Unique patients pulled from my appointments.
  const myPatients = useMemo(() => {
    const seen = new Map<string, { lastVisit: Date; visits: number }>();
    for (const a of mine) {
      const cur = seen.get(a.patient_id);
      const d = new Date(a.starts_at);
      if (!cur) seen.set(a.patient_id, { lastVisit: d, visits: 1 });
      else
        seen.set(a.patient_id, {
          lastVisit: d > cur.lastVisit ? d : cur.lastVisit,
          visits: cur.visits + 1,
        });
    }
    return [...seen.entries()]
      .map(([id, meta]) => ({
        patient: patients.find((p) => p.id === id)!,
        ...meta,
      }))
      .filter((x) => x.patient)
      .sort((a, b) => b.lastVisit.getTime() - a.lastVisit.getTime());
  }, [mine]);

  const stats = {
    today: todayAppts.length,
    inClinic: todayAppts.filter(
      (a) => a.status === "checked_in" || a.status === "in_progress",
    ).length,
    completed: todayAppts.filter((a) => a.status === "completed").length,
    patients: myPatients.length,
  };

  const selectedAppt = selectedApptId
    ? mine.find((a) => a.id === selectedApptId) ?? null
    : null;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
            <Stethoscope className="h-3.5 w-3.5" />
            {me.specialty ?? "Clinician"}
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Welcome, {me.full_name.replace(/^Dr\.\s*/, "Dr. ")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(today, "EEEE, MMMM d")} · {stats.today} on the books today
          </p>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <Stat label="Today" value={stats.today} />
          <Stat label="In clinic" value={stats.inClinic} tone="primary" />
          <Stat label="Completed" value={stats.completed} tone="success" />
          <Stat label="Patients" value={stats.patients} />
        </div>
      </div>

      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schedule" className="gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="patients" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            My patients
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Visit notes
          </TabsTrigger>
        </TabsList>

        {/* SCHEDULE */}
        <TabsContent value="schedule" className="space-y-4">
          <WeekStrip
            anchor={today}
            selected={selectedDay}
            mine={mine}
            onPick={setSelectedDay}
          />
          <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
            <DayColumn
              date={selectedDay}
              appts={dayAppts}
              selectedId={selectedApptId}
              onSelect={setSelectedApptId}
            />
            <TodayQueue
              appts={todayAppts}
              now={today}
              onSelect={(id) => {
                setSelectedApptId(id);
                setSelectedDay(today);
              }}
              activeId={selectedApptId}
            />
          </div>
        </TabsContent>

        {/* PATIENTS */}
        <TabsContent value="patients">
          <PatientList
            rows={myPatients}
            mine={mine}
            onOpenAppt={(id) => setSelectedApptId(id)}
          />
        </TabsContent>

        {/* NOTES */}
        <TabsContent value="notes">
          <NotesEditor
            appt={selectedAppt}
            authorId={me.id}
            recent={mine
              .filter(
                (a) => a.status === "completed" || a.status === "in_progress",
              )
              .sort(
                (a, b) =>
                  new Date(b.starts_at).getTime() -
                  new Date(a.starts_at).getTime(),
              )
              .slice(0, 8)}
            onSelect={setSelectedApptId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Schedule subcomponents                                                     */
/* -------------------------------------------------------------------------- */

function WeekStrip({
  anchor,
  selected,
  mine,
  onPick,
}: {
  anchor: Date;
  selected: Date;
  mine: Appointment[];
  onPick: (d: Date) => void;
}) {
  const start = startOfWeek(anchor, { weekStartsOn: 1 });
  const end = endOfWeek(anchor, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Week of {format(start, "MMM d")} – {format(end, "MMM d")}
        </div>
        <div className="text-[11px] text-muted-foreground">
          Tap a day to view
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => {
          const count = mine.filter((a) =>
            isSameDay(new Date(a.starts_at), d),
          ).length;
          const isSel = isSameDay(d, selected);
          const isToday = isSameDay(d, anchor);
          return (
            <button
              key={d.toISOString()}
              onClick={() => onPick(d)}
              className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left transition ${
                isSel
                  ? "border-primary bg-primary-soft"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {format(d, "EEE")}
                {isToday && (
                  <span className="rounded bg-primary px-1 py-0.5 text-[9px] font-semibold text-primary-foreground">
                    TODAY
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-lg font-semibold tabular-nums">
                {format(d, "d")}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {count} {count === 1 ? "visit" : "visits"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DayColumn({
  date,
  appts,
  selectedId,
  onSelect,
}: {
  date: Date;
  appts: Appointment[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">{format(date, "EEEE, MMM d")}</h2>
        <p className="text-xs text-muted-foreground">
          {appts.length} appointment{appts.length === 1 ? "" : "s"} · 8:00 to
          18:00
        </p>
      </div>
      <div className="overflow-x-auto">
        <div className="relative flex min-w-fit">
          {/* Hour gutter */}
          <div className="sticky left-0 z-10 flex w-14 flex-col border-r border-border bg-card">
            {HOURS.map((h) => (
              <div
                key={h}
                style={{ height: HOUR_PX }}
                className="px-2 pt-1 text-right text-[11px] font-medium text-muted-foreground"
              >
                {h}:00
              </div>
            ))}
          </div>
          {/* Single column */}
          <div className="flex-1">
            <div
              className="relative"
              style={{ height: HOURS.length * HOUR_PX }}
            >
              {HOURS.map((_, idx) => (
                <div
                  key={idx}
                  style={{ top: idx * HOUR_PX, height: HOUR_PX }}
                  className="absolute inset-x-0 border-b border-border/60"
                />
              ))}
              {appts.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                  No appointments scheduled.
                </div>
              )}
              {appts.map((a) => (
                <ApptBlock
                  key={a.id}
                  appt={a}
                  selected={selectedId === a.id}
                  onSelect={() => onSelect(a.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApptBlock({
  appt,
  selected,
  onSelect,
}: {
  appt: Appointment;
  selected: boolean;
  onSelect: () => void;
}) {
  const start = new Date(appt.starts_at);
  const end = new Date(appt.ends_at);
  const startMinutes = (start.getHours() - 8) * 60 + start.getMinutes();
  const durationMin = (end.getTime() - start.getTime()) / 60_000;
  const top = (startMinutes / 60) * HOUR_PX;
  const height = (durationMin / 60) * HOUR_PX - 2;
  const patient = patients.find((p) => p.id === appt.patient_id);
  const service = services.find((s) => s.id === appt.service_id);
  const location = locations.find((l) => l.id === appt.location_id);

  const dim =
    appt.status === "cancelled" || appt.status === "no_show"
      ? "opacity-60"
      : "";

  return (
    <button
      onClick={onSelect}
      style={{ top, height, borderLeftColor: service?.color }}
      className={`absolute inset-x-2 overflow-hidden rounded-md border border-border border-l-4 bg-card px-2 py-1 text-left text-xs shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-elevated)] ${dim} ${selected ? "ring-2 ring-primary" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="truncate font-semibold text-foreground">
          {patient?.full_name}
        </div>
        <StatusBadge status={appt.status} />
      </div>
      <div className="truncate text-[10px] text-muted-foreground">
        {format(start, "HH:mm")} – {format(end, "HH:mm")} · {service?.name}
      </div>
      <div className="truncate text-[10px] text-muted-foreground">
        {location?.name}
      </div>
    </button>
  );
}

function TodayQueue({
  appts,
  now,
  onSelect,
  activeId,
}: {
  appts: Appointment[];
  now: Date;
  onSelect: (id: string) => void;
  activeId: string | null;
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="border-b border-border px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Activity className="h-4 w-4 text-primary" />
          Today's queue
        </h2>
        <p className="text-xs text-muted-foreground">
          Tap to open · jump to notes from any visit
        </p>
      </div>
      <ul className="max-h-[560px] divide-y divide-border overflow-y-auto">
        {appts.length === 0 && (
          <li className="px-4 py-10 text-center text-sm text-muted-foreground">
            Nothing scheduled today. Enjoy the breather.
          </li>
        )}
        {appts.map((a) => {
          const start = new Date(a.starts_at);
          const patient = patients.find((p) => p.id === a.patient_id);
          const service = services.find((s) => s.id === a.service_id);
          const location = locations.find((l) => l.id === a.location_id);
          const isPast = start < now;
          return (
            <li
              key={a.id}
              onClick={() => onSelect(a.id)}
              className={`cursor-pointer px-4 py-3 transition ${
                activeId === a.id
                  ? "bg-primary-soft/40"
                  : "hover:bg-muted/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Clock
                      className={`h-3.5 w-3.5 ${isPast ? "text-muted-foreground" : "text-primary"}`}
                    />
                    {format(start, "HH:mm")}
                    <span className="truncate">· {patient?.full_name}</span>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {service?.name}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {location?.name}
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Patient list                                                               */
/* -------------------------------------------------------------------------- */

function PatientList({
  rows,
  mine,
  onOpenAppt,
}: {
  rows: { patient: (typeof patients)[number]; lastVisit: Date; visits: number }[];
  mine: Appointment[];
  onOpenAppt: (id: string) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="border-b border-border px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <ClipboardList className="h-4 w-4 text-primary" />
          My patients ({rows.length})
        </h2>
        <p className="text-xs text-muted-foreground">
          Pulled from your appointment history
        </p>
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-muted-foreground">
          No patients yet — once appointments are booked they'll appear here.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map(({ patient, lastVisit, visits }) => {
            const isOpen = openId === patient.id;
            const history = mine
              .filter((a) => a.patient_id === patient.id)
              .sort(
                (a, b) =>
                  new Date(b.starts_at).getTime() -
                  new Date(a.starts_at).getTime(),
              );
            return (
              <li key={patient.id} className="px-4 py-3">
                <button
                  onClick={() => setOpenId(isOpen ? null : patient.id)}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                      {patient.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">
                        {patient.full_name}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        DOB {patient.date_of_birth} · {patient.phone}
                        {patient.allergies && (
                          <span className="ml-2 rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                            ⚠ {patient.allergies}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <div className="text-xs font-medium">
                      {visits} visit{visits === 1 ? "" : "s"}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Last {format(lastVisit, "MMM d")}
                    </div>
                  </div>
                </button>
                {isOpen && (
                  <div className="mt-3 space-y-1 rounded-lg border border-border bg-muted/30 p-2">
                    {history.map((a) => {
                      const svc = services.find((s) => s.id === a.service_id);
                      return (
                        <button
                          key={a.id}
                          onClick={() => onOpenAppt(a.id)}
                          className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-card"
                        >
                          <span className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(a.starts_at), "MMM d, HH:mm")}
                            <span className="text-muted-foreground">
                              · {svc?.name}
                            </span>
                          </span>
                          <StatusBadge status={a.status} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Notes editor                                                               */
/* -------------------------------------------------------------------------- */

function NotesEditor({
  appt,
  authorId,
  recent,
  onSelect,
}: {
  appt: Appointment | null;
  authorId: string;
  recent: Appointment[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      {/* Visit picker */}
      <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Recent visits</h2>
          <p className="text-xs text-muted-foreground">
            Pick a visit to write or review notes
          </p>
        </div>
        <ul className="max-h-[520px] divide-y divide-border overflow-y-auto">
          {recent.length === 0 && (
            <li className="px-4 py-8 text-center text-xs text-muted-foreground">
              No completed visits yet.
            </li>
          )}
          {recent.map((a) => {
            const p = patients.find((x) => x.id === a.patient_id);
            const s = services.find((x) => x.id === a.service_id);
            const isActive = appt?.id === a.id;
            return (
              <li key={a.id}>
                <button
                  onClick={() => onSelect(a.id)}
                  className={`block w-full px-4 py-3 text-left transition ${
                    isActive ? "bg-primary-soft/50" : "hover:bg-muted/40"
                  }`}
                >
                  <div className="text-sm font-semibold">{p?.full_name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {format(new Date(a.starts_at), "MMM d, HH:mm")} · {s?.name}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Editor */}
      <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
        {!appt ? (
          <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm font-medium">Select a visit</div>
            <div className="max-w-sm text-xs text-muted-foreground">
              Notes are visible only to clinicians on this clinic. Pick a visit
              from the list — or jump in from the Schedule or Patients tab.
            </div>
          </div>
        ) : (
          <NoteForm appt={appt} authorId={authorId} />
        )}
      </div>
    </div>
  );
}

function NoteForm({ appt, authorId }: { appt: Appointment; authorId: string }) {
  const all = useNotes();
  const existing = all.find((n) => n.appointment_id === appt.id);
  const patient = patients.find((p) => p.id === appt.patient_id);
  const service = services.find((s) => s.id === appt.service_id);
  const location = locations.find((l) => l.id === appt.location_id);
  const [body, setBody] = useState(existing?.body ?? "");
  const [saved, setSaved] = useState(false);

  // Reset draft when switching visits.
  const apptKey = appt.id;
  const lastKey = useMemo(() => ({ k: apptKey }), [apptKey]);
  if (lastKey.k !== apptKey) {
    setBody(existing?.body ?? "");
  }

  const handleSave = () => {
    notesStore.upsert({
      appointment_id: appt.id,
      author_id: authorId,
      body,
      updated_at: new Date().toISOString(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              Visit note
            </div>
            <h3 className="mt-0.5 truncate text-lg font-semibold">
              {patient?.full_name}
            </h3>
            <div className="text-xs text-muted-foreground">
              {format(new Date(appt.starts_at), "EEE, MMM d · HH:mm")} –{" "}
              {format(new Date(appt.ends_at), "HH:mm")} · {service?.name} ·{" "}
              {location?.name}
            </div>
          </div>
          <StatusBadge status={appt.status} />
        </div>
        {patient && (
          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-muted-foreground">
              DOB {patient.date_of_birth}
            </span>
            <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-muted-foreground">
              {patient.phone}
            </span>
            {patient.allergies && (
              <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 font-medium text-destructive">
                ⚠ Allergies: {patient.allergies}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex-1 px-5 py-4">
        <Textarea
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            setSaved(false);
          }}
          placeholder="Subjective · Objective · Assessment · Plan…"
          className="min-h-[280px] resize-y font-mono text-sm leading-relaxed"
        />
        <p className="mt-2 text-[11px] text-muted-foreground">
          Stored privately under <code>appointment_notes</code> — RLS restricts
          read/write to clinicians of this clinic.
        </p>
      </div>
      <div className="flex items-center justify-between border-t border-border px-5 py-3">
        <div className="text-xs text-muted-foreground">
          {existing
            ? `Last saved ${format(new Date(existing.updated_at), "MMM d, HH:mm")}`
            : "Unsaved draft"}
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs font-medium text-[oklch(0.55_0.13_160)]">
              Saved
            </span>
          )}
          <Button onClick={handleSave} disabled={!body.trim()} className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            Save note
          </Button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Stat card                                                                  */
/* -------------------------------------------------------------------------- */

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "primary" | "success" | "destructive";
}) {
  const toneCls = {
    default: "text-foreground",
    primary: "text-primary",
    success: "text-[oklch(0.55_0.13_160)]",
    destructive: "text-destructive",
  }[tone];
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-[var(--shadow-card)]">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`text-2xl font-semibold tabular-nums ${toneCls}`}>
        {value}
      </div>
    </div>
  );
}
