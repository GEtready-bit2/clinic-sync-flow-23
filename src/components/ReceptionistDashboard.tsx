import { useMemo, useState } from "react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { AlertTriangle, Calendar, Clock, GripVertical, MapPin, Search, UserCheck } from "lucide-react";
import {
  appointmentsStore,
  useAppointments,
  type RescheduleConflict,
} from "@/lib/appointments-store";
import { usePatients } from "@/lib/patients-store";
import { locations, profiles, services } from "@/lib/mock-data";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { NewAppointmentDialog } from "./NewAppointmentDialog";
import { NewPatientDialog } from "./NewPatientDialog";
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
const SLOT_MIN = 15; // drop granularity in minutes
const SLOTS_PER_HOUR = 60 / SLOT_MIN;
const SLOT_PX = HOUR_PX / SLOTS_PER_HOUR;
const MIN_CARD_PX = 64; // garante leitura completa mesmo em consultas curtas

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
  const [conflict, setConflict] = useState<{
    info: RescheduleConflict;
    at: number;
  } | null>(null);

  const doctors = profiles.filter((p) => p.role === "doctor");
  const patients = usePatients();

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
  }, [all, doctorFilter, search, today, patients]);

  const visibleDoctors =
    doctorFilter === "all" ? doctors : doctors.filter((d) => d.id === doctorFilter);

  const stats = useMemo(() => {
    const total = dayAppts.length;
    const checked = dayAppts.filter((a) => a.status === "checked_in" || a.status === "in_progress" || a.status === "completed").length;
    const upcoming = dayAppts.filter((a) => a.status === "booked" || a.status === "confirmed").length;
    const noShow = dayAppts.filter((a) => a.status === "no_show").length;
    return { total, checked, upcoming, noShow };
  }, [dayAppts]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const apptId = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;
    const [, doctorId, time] = overId.split("::");
    if (!doctorId || !time) return;
    const [h, m] = time.split(":").map(Number);
    const startsAt = new Date(today);
    startsAt.setHours(h, m, 0, 0);

    const result = appointmentsStore.reschedule(apptId, {
      doctor_id: doctorId,
      starts_at: startsAt.toISOString(),
    });
    if (result) {
      setConflict({ info: result, at: Date.now() });
      window.setTimeout(() => setConflict(null), 4000);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
            <Calendar className="h-3.5 w-3.5" />
            {format(today, "EEEE", { locale: ptBR })}
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {format(today, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </h1>
          <p className="text-sm text-muted-foreground">
            Recepção em tempo real
          </p>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <div className="flex gap-2">
            <NewPatientDialog />
            <NewAppointmentDialog />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <Stat label="Hoje" value={stats.total} />
            <Stat label="Próximos" value={stats.upcoming} tone="primary" />
            <Stat label="Na clínica" value={stats.checked} tone="success" />
            <Stat label="Faltas" value={stats.noShow} tone="destructive" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-[var(--shadow-card)] md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar paciente..."
            className="pl-9"
          />
        </div>
        <Select value={doctorFilter} onValueChange={setDoctorFilter}>
          <SelectTrigger className="md:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os médicos</SelectItem>
            {doctors.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.full_name} · {d.specialty}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {conflict && <ConflictBanner conflict={conflict.info} />}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Agenda */}
          <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Agenda do dia</h2>
              <p className="text-xs text-muted-foreground">
                Arraste um cartão para reagendar · grade de 15 min · sem sobreposição
              </p>
            </div>
            <div className="overflow-x-auto">
              <div className="relative flex min-w-fit">
                {/* Coluna de horas */}
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
                {/* Colunas dos médicos */}
                {visibleDoctors.length === 0 && (
                  <div className="flex flex-1 items-center justify-center px-6 py-16 text-sm text-muted-foreground">
                    Nenhum médico cadastrado. Adicione profissionais em
                    Administração da clínica.
                  </div>
                )}
                {visibleDoctors.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex min-w-[220px] flex-1 flex-col border-r border-border last:border-r-0"
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
                    <DoctorColumn doctorId={doc.id}>
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
                    </DoctorColumn>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Painel da recepção */}
          <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
            <div className="border-b border-border px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <UserCheck className="h-4 w-4 text-primary" />
                Recepção em tempo real
              </h2>
              <p className="text-xs text-muted-foreground">
                Toque em um status para avançar a consulta
              </p>
            </div>
            <ul className="max-h-[560px] divide-y divide-border overflow-y-auto">
              {dayAppts.length === 0 && (
                <li className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Nenhuma consulta encontrada com os filtros atuais.
                </li>
              )}
              {dayAppts.map((a) => (
                <FrontDeskRow
                  key={a.id}
                  appt={a}
                  active={selectedId === a.id}
                  onSelect={() => setSelectedId(a.id)}
                  patients={patients}
                />
              ))}
            </ul>
          </div>
        </div>
      </DndContext>
    </div>
  );
}

function ConflictBanner({ conflict }: { conflict: RescheduleConflict }) {
  const patients = usePatients();
  const other = conflict.with;
  const patient = patients.find((p) => p.id === other.patient_id);
  const doctor = profiles.find((p) => p.id === other.doctor_id);
  const room = locations.find((l) => l.id === other.location_id);
  return (
    <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <div className="font-semibold">
          Reagendamento bloqueado — sobreposição de{" "}
          {conflict.kind === "doctor" ? "médico" : "sala"}
        </div>
        <div className="text-xs opacity-90">
          Conflito com {patient?.full_name} às {format(new Date(other.starts_at), "HH:mm")}{" "}
          ({conflict.kind === "doctor" ? doctor?.full_name : room?.name}).
        </div>
      </div>
    </div>
  );
}

function DoctorColumn({
  doctorId,
  children,
}: {
  doctorId: string;
  children: React.ReactNode;
}) {
  const slots = HOURS.flatMap((h) =>
    Array.from({ length: SLOTS_PER_HOUR }, (_, s) => ({
      h,
      m: s * SLOT_MIN,
    })),
  );
  return (
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
      {slots.map(({ h, m }) => (
        <DropSlot key={`${h}:${m}`} doctorId={doctorId} hour={h} minute={m} />
      ))}
      {children}
    </div>
  );
}

function DropSlot({
  doctorId,
  hour,
  minute,
}: {
  doctorId: string;
  hour: number;
  minute: number;
}) {
  const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const id = `slot::${doctorId}::${time}`;
  const top = (hour - 8) * HOUR_PX + (minute / 60) * HOUR_PX;
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ top, height: SLOT_PX }}
      className={`absolute inset-x-0 transition-colors ${isOver ? "bg-primary/15 ring-1 ring-inset ring-primary/40" : ""}`}
    />
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
  const patients = usePatients();
  const start = new Date(appt.starts_at);
  const end = new Date(appt.ends_at);
  const startMinutes = (start.getHours() - 8) * 60 + start.getMinutes();
  const durationMin = (end.getTime() - start.getTime()) / 60_000;
  const top = (startMinutes / 60) * HOUR_PX;
  // Altura natural baseada na duração, mas com piso para que TODAS as informações
  // do cartão fiquem visíveis mesmo em consultas curtas (15/30 min).
  const naturalHeight = (durationMin / 60) * HOUR_PX - 2;
  const height = Math.max(naturalHeight, MIN_CARD_PX);
  const patient = patients.find((p) => p.id === appt.patient_id);
  const service = services.find((s) => s.id === appt.service_id);
  const location = locations.find((l) => l.id === appt.location_id);

  const dim =
    appt.status === "cancelled" || appt.status === "no_show"
      ? "opacity-60"
      : "";

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: appt.id });

  const dragStyle: React.CSSProperties = {
    top,
    height,
    minHeight: MIN_CARD_PX,
    borderLeftColor: service?.color,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    zIndex: isDragging ? 30 : naturalHeight < MIN_CARD_PX ? 5 : 1,
    opacity: isDragging ? 0.85 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      onClick={onSelect}
      {...listeners}
      {...attributes}
      className={`absolute inset-x-1 flex flex-col gap-0.5 overflow-hidden rounded-md border border-border border-l-4 bg-card px-2 py-1.5 text-left text-xs shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-elevated)] hover:z-20 ${dim} ${selected ? "ring-2 ring-primary z-20" : ""} ${isDragging ? "shadow-[var(--shadow-elevated)]" : ""}`}
    >
      <div className="flex items-start gap-1">
        <GripVertical className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/60" />
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="truncate text-[12px] font-semibold leading-tight text-foreground">
            {patient?.full_name ?? "Paciente"}
          </div>
          <div className="truncate text-[10px] leading-tight text-muted-foreground">
            {format(start, "HH:mm")}–{format(end, "HH:mm")} · {service?.name ?? "Serviço"}
          </div>
          <div className="truncate text-[10px] leading-tight text-muted-foreground">
            {location?.name ?? "Sala"}
          </div>
        </div>
      </div>
    </div>
  );
}

function FrontDeskRow({
  appt,
  active,
  onSelect,
  patients,
}: {
  appt: Appointment;
  active: boolean;
  onSelect: () => void;
  patients: ReturnType<typeof usePatients>;
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
    booked: "Agendado",
    confirmed: "Confirmar",
    checked_in: "Check-in",
    in_progress: "Iniciar",
    completed: "Concluir",
    cancelled: "Cancelar",
    no_show: "Faltou",
  }[s];
}
