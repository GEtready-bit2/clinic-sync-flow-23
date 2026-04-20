import { useMemo, useState } from "react";
import { format, isSameDay } from "date-fns";
import { Calendar, Clock, MapPin, Search, UserCheck } from "lucide-react";
import { useAppointments, appointmentsStore } from "@/lib/appointments-store";
import { locations, patients, profiles, services } from "@/lib/mock-data";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8 → 18
const HOUR_PX = 64;

const QUICK_TRANSITIONS: AppointmentStatus[] = [
  "confirmed",
  "checked_in",
  "in_progress",
  "completed",
  "no_show",
];

export function ReceptionistDashboard() {
  const all = useAppointments();
  const today = useMemo(() => new Date(), []);
  const [search, setSearch] = useState("");
  const [doctorFilter, setDoctorFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const doctors = profiles.filter((p) => p.role === "doctor");

  const dayAppts = useMemo(() => {
    return all
      .filter((a) => isSameDay(new Date(a.starts_at), today))
      .filter((a) => doctorFilter === "all" || a.doctor_id === doctorFilter)
      .filter((a) => {
        if (!search.trim()) return true;
        const p = patients.find((x) => x.id === a.patient_id);
        return p?.full_name.toLowerCase().includes(search.toLowerCase());
      })
      .sort(
        (a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
      );
  }, [all, doctorFilter, search, today]);

  const visibleDoctors =
    doctorFilter === "all" ? doctors : doctors.filter((d) => d.id === doctorFilter);

  const stats = useMemo(() => {
    const total = dayAppts.length;
    const checked = dayAppts.filter((a) => a.status === "checked_in" || a.status === "in_progress" || a.status === "completed").length;
    const upcoming = dayAppts.filter((a) => a.status === "booked" || a.status === "confirmed").length;
    const noShow = dayAppts.filter((a) => a.status === "no_show").length;
    return { total, checked, upcoming, noShow };
  }, [dayAppts]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
            <Calendar className="h-3.5 w-3.5" />
            {format(today, "EEEE")}
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {format(today, "MMMM d, yyyy")}
          </h1>
          <p className="text-sm text-muted-foreground">
            Live front desk · NexusPulse Medical Center
          </p>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <Stat label="Today" value={stats.total} />
          <Stat label="Upcoming" value={stats.upcoming} tone="primary" />
          <Stat label="In clinic" value={stats.checked} tone="success" />
          <Stat label="No-show" value={stats.noShow} tone="destructive" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-[var(--shadow-card)] md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patients..."
            className="pl-9"
          />
        </div>
        <Select value={doctorFilter} onValueChange={setDoctorFilter}>
          <SelectTrigger className="md:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All doctors</SelectItem>
            {doctors.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.full_name} · {d.specialty}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Calendar */}
        <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Day schedule</h2>
            <p className="text-xs text-muted-foreground">
              Doctor columns · 8:00 to 18:00
            </p>
          </div>
          <div className="overflow-x-auto">
            <div className="relative flex min-w-fit">
              {/* Hour gutter */}
              <div className="sticky left-0 z-10 flex w-14 flex-col border-r border-border bg-card">
                <div className="h-10" />
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
              {/* Doctor columns */}
              {visibleDoctors.map((doc) => (
                <div
                  key={doc.id}
                  className="flex min-w-[200px] flex-1 flex-col border-r border-border last:border-r-0"
                >
                  <div className="flex h-10 items-center gap-2 border-b border-border bg-muted/40 px-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-soft text-[10px] font-semibold text-primary">
                      {doc.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="leading-tight">
                      <div className="text-xs font-semibold">{doc.full_name}</div>
                      <div className="text-[10px] text-muted-foreground">{doc.specialty}</div>
                    </div>
                  </div>
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
                    {dayAppts
                      .filter((a) => a.doctor_id === doc.id)
                      .map((a) => (
                        <ApptBlock
                          key={a.id}
                          appt={a}
                          selected={selectedId === a.id}
                          onSelect={() => setSelectedId(a.id)}
                        />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Front Desk */}
        <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="border-b border-border px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <UserCheck className="h-4 w-4 text-primary" />
              Live front desk
            </h2>
            <p className="text-xs text-muted-foreground">
              Tap a status to advance the visit
            </p>
          </div>
          <ul className="max-h-[560px] divide-y divide-border overflow-y-auto">
            {dayAppts.length === 0 && (
              <li className="px-4 py-10 text-center text-sm text-muted-foreground">
                No appointments match your filters.
              </li>
            )}
            {dayAppts.map((a) => (
              <FrontDeskRow
                key={a.id}
                appt={a}
                active={selectedId === a.id}
                onSelect={() => setSelectedId(a.id)}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

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
      <div className={`text-2xl font-semibold tabular-nums ${toneCls}`}>{value}</div>
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
      style={{
        top,
        height,
        borderLeftColor: service?.color,
      }}
      className={`absolute inset-x-1 overflow-hidden rounded-md border border-border border-l-4 bg-card px-2 py-1 text-left text-xs shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-elevated)] ${dim} ${selected ? "ring-2 ring-primary" : ""}`}
    >
      <div className="truncate font-semibold text-foreground">
        {patient?.full_name}
      </div>
      <div className="truncate text-[10px] text-muted-foreground">
        {format(start, "HH:mm")} · {service?.name}
      </div>
      <div className="truncate text-[10px] text-muted-foreground">
        {location?.name}
      </div>
    </button>
  );
}

function FrontDeskRow({
  appt,
  active,
  onSelect,
}: {
  appt: Appointment;
  active: boolean;
  onSelect: () => void;
}) {
  const patient = patients.find((p) => p.id === appt.patient_id);
  const service = services.find((s) => s.id === appt.service_id);
  const location = locations.find((l) => l.id === appt.location_id);
  const doctor = profiles.find((p) => p.id === appt.doctor_id);

  return (
    <li
      onClick={onSelect}
      className={`cursor-pointer px-4 py-3 transition ${active ? "bg-primary-soft/40" : "hover:bg-muted/40"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            {format(new Date(appt.starts_at), "HH:mm")}
            <span className="truncate">· {patient?.full_name}</span>
          </div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">
            {service?.name} · {doctor?.full_name}
          </div>
          <div className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {location?.name}
          </div>
        </div>
        <StatusBadge status={appt.status} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {QUICK_TRANSITIONS.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={appt.status === s ? "default" : "outline"}
            className="h-7 px-2 text-[11px]"
            onClick={(e) => {
              e.stopPropagation();
              appointmentsStore.setStatus(appt.id, s);
            }}
          >
            {labelOf(s)}
          </Button>
        ))}
      </div>
    </li>
  );
}

function labelOf(s: AppointmentStatus) {
  return {
    booked: "Booked",
    confirmed: "Confirm",
    checked_in: "Check in",
    in_progress: "Start",
    completed: "Complete",
    cancelled: "Cancel",
    no_show: "No-show",
  }[s];
}
