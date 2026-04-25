import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { AlertTriangle, CalendarPlus, Check } from "lucide-react";
import {
  appointmentsStore,
  useAppointments,
  type RescheduleConflict,
} from "@/lib/appointments-store";
import { clinic, locations, patients, profiles, services } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const TIME_OPTIONS = (() => {
  const out: string[] = [];
  for (let h = 8; h < 18; h++) {
    for (let m = 0; m < 60; m += 15) {
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out;
})();

export function NewAppointmentDialog() {
  const [open, setOpen] = useState(false);
  const doctors = useMemo(() => profiles.filter((p) => p.role === "doctor"), []);

  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "");
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [time, setTime] = useState("09:00");
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [conflict, setConflict] = useState<RescheduleConflict | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedService = services.find((s) => s.id === serviceId);
  const allAppts = useAppointments();

  // Compute which time options would conflict with the selected doctor or room on the chosen date.
  const slotConflicts = useMemo(() => {
    const map: Record<string, "doctor" | "room" | null> = {};
    if (!selectedService) {
      for (const t of TIME_OPTIONS) map[t] = null;
      return map;
    }
    const [yy, mm, dd] = date.split("-").map(Number);
    const duration = selectedService.duration_min * 60_000;
    const active = allAppts.filter(
      (a) => a.status !== "cancelled" && a.status !== "no_show",
    );
    for (const t of TIME_OPTIONS) {
      const [h, mi] = t.split(":").map(Number);
      const start = new Date(yy, mm - 1, dd, h, mi, 0, 0).getTime();
      const end = start + duration;
      let kind: "doctor" | "room" | null = null;
      for (const a of active) {
        const s = new Date(a.starts_at).getTime();
        const e = new Date(a.ends_at).getTime();
        if (start < e && s < end) {
          if (a.doctor_id === doctorId) {
            kind = "doctor";
            break;
          }
          if (a.location_id === locationId) {
            kind = "room";
          }
        }
      }
      map[t] = kind;
    }
    return map;
  }, [allAppts, date, doctorId, locationId, selectedService]);

  // If the currently selected time becomes unavailable, auto-advance to the next free slot.
  useEffect(() => {
    if (slotConflicts[time]) {
      const next = TIME_OPTIONS.find((t) => !slotConflicts[t]);
      if (next) setTime(next);
    }
  }, [slotConflicts, time]);

  const reset = () => {
    setConflict(null);
    setSuccess(false);
    setNotes("");
    setTime("09:00");
    setDate(format(new Date(), "yyyy-MM-dd"));
  };

  const submit = () => {
    if (!patientId || !doctorId || !serviceId || !locationId || !selectedService) return;
    const [h, m] = time.split(":").map(Number);
    const [yy, mm, dd] = date.split("-").map(Number);
    const starts = new Date(yy, mm - 1, dd, h, m, 0, 0);
    const result = appointmentsStore.book({
      clinic_id: clinic.id,
      patient_id: patientId,
      doctor_id: doctorId,
      service_id: serviceId,
      location_id: locationId,
      starts_at: starts.toISOString(),
      duration_min: selectedService.duration_min,
      notes: notes.trim() || undefined,
    });
    if (result) {
      setConflict(result);
      setSuccess(false);
      return;
    }
    setConflict(null);
    setSuccess(true);
    window.setTimeout(() => {
      setOpen(false);
      reset();
    }, 700);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <CalendarPlus className="h-4 w-4" />
          Nova consulta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Nova consulta</DialogTitle>
          <DialogDescription>
            Sobreposição de médico ou sala é bloqueada, igual ao arrastar e soltar.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <Field label="Paciente">
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger><SelectValue placeholder="Selecionar paciente" /></SelectTrigger>
              <SelectContent>
                {patients.length === 0 && (
                  <div className="px-2 py-3 text-xs text-muted-foreground">
                    Nenhum paciente cadastrado.
                  </div>
                )}
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Médico">
              <Select value={doctorId} onValueChange={setDoctorId}>
                <SelectTrigger><SelectValue placeholder="Selecionar médico" /></SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Sala">
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger><SelectValue placeholder="Selecionar sala" /></SelectTrigger>
                <SelectContent>
                  {locations.length === 0 && (
                    <div className="px-2 py-3 text-xs text-muted-foreground">
                      Nenhuma sala cadastrada.
                    </div>
                  )}
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Serviço">
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger><SelectValue placeholder="Selecionar serviço" /></SelectTrigger>
              <SelectContent>
                {services.length === 0 && (
                  <div className="px-2 py-3 text-xs text-muted-foreground">
                    Nenhum serviço cadastrado.
                  </div>
                )}
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} · {s.duration_min}min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Data">
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <Field label="Horário de início">
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {TIME_OPTIONS.map((t) => {
                    const c = slotConflicts[t];
                    return (
                      <SelectItem
                        key={t}
                        value={t}
                        disabled={!!c}
                        className={cn(c && "opacity-50")}
                      >
                        <span className="flex w-full items-center justify-between gap-3">
                          <span>{t}</span>
                          {c && (
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              {c === "doctor" ? "médico ocupado" : "sala ocupada"}
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Observações (opcional)">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Motivo da visita, instruções especiais…"
              rows={2}
            />
          </Field>

          {conflict && <ConflictNotice conflict={conflict} />}
          {success && (
            <div className="flex items-center gap-2 rounded-md border border-[oklch(0.85_0.08_160)] bg-[oklch(0.96_0.04_160)] px-3 py-2 text-sm text-[oklch(0.4_0.13_160)]">
              <Check className="h-4 w-4" />
              Consulta agendada.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit}>Agendar consulta</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ConflictNotice({ conflict }: { conflict: RescheduleConflict }) {
  const other = conflict.with;
  const patient = patients.find((p) => p.id === other.patient_id);
  const doctor = profiles.find((p) => p.id === other.doctor_id);
  const room = locations.find((l) => l.id === other.location_id);
  return (
    <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <div className="font-semibold">
          {conflict.kind === "doctor" ? "Doctor" : "Room"} double-booking blocked
        </div>
        <div className="text-xs opacity-90">
          Conflicts with {patient?.full_name} at{" "}
          {format(new Date(other.starts_at), "HH:mm")} (
          {conflict.kind === "doctor" ? doctor?.full_name : room?.name}).
        </div>
      </div>
    </div>
  );
}
