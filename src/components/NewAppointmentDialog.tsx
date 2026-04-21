import { useMemo, useState } from "react";
import { format } from "date-fns";
import { AlertTriangle, CalendarPlus, Check } from "lucide-react";
import { appointmentsStore, type RescheduleConflict } from "@/lib/appointments-store";
import { clinic, locations, patients, profiles, services } from "@/lib/mock-data";
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
          New appointment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>New appointment</DialogTitle>
          <DialogDescription>
            Double-booking of doctor or room is blocked, just like drag-and-drop.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <Field label="Patient">
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Doctor">
              <Select value={doctorId} onValueChange={setDoctorId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Room">
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Service">
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} · {s.duration_min}m
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <Field label="Start time">
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {TIME_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Notes (optional)">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for visit, special instructions…"
              rows={2}
            />
          </Field>

          {conflict && <ConflictNotice conflict={conflict} />}
          {success && (
            <div className="flex items-center gap-2 rounded-md border border-[oklch(0.85_0.08_160)] bg-[oklch(0.96_0.04_160)] px-3 py-2 text-sm text-[oklch(0.4_0.13_160)]">
              <Check className="h-4 w-4" />
              Appointment booked.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Book appointment</Button>
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
