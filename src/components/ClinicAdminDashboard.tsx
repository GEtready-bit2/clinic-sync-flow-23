// Clinic Admin: staff, services, locations, recurring availability + time-off.
// All mutations flow through clinic-admin-store so views stay in sync.
import { useMemo, useState } from "react";
import {
  Building2,
  CalendarOff,
  CalendarRange,
  CheckCircle2,
  MapPin,
  Plus,
  Stethoscope,
  Trash2,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  clinicAdmin,
  useAvailability,
  useLocations,
  useServices,
  useStaff,
  useTimeOff,
  WEEKDAYS,
} from "@/lib/clinic-admin-store";
import type { Role, Weekday } from "@/lib/types";

const roleLabel: Record<Role, string> = {
  super_admin: "Super Administrador",
  clinic_admin: "Administrador",
  doctor: "Médico(a)",
  receptionist: "Recepção",
  patient: "Paciente",
};

export function ClinicAdminDashboard() {
  const staff = useStaff();
  const services = useServices();
  const locations = useLocations();
  const availability = useAvailability();
  const timeOff = useTimeOff();
  const doctors = staff.filter((s) => s.role === "doctor" && s.active);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Administração da clínica</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie equipe, serviços, salas e horários recorrentes da sua clínica.
          </p>
        </div>
        <StatGrid
          stats={[
            { label: "Equipe", value: staff.filter((s) => s.active).length },
            { label: "Serviços", value: services.length },
            { label: "Salas", value: locations.length },
            { label: "Horários", value: availability.length },
          ]}
        />
      </header>

      <Tabs defaultValue="staff" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="staff" className="gap-2">
            <Users className="h-4 w-4" /> Equipe
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-2">
            <Stethoscope className="h-4 w-4" /> Serviços
          </TabsTrigger>
          <TabsTrigger value="locations" className="gap-2">
            <Building2 className="h-4 w-4" /> Salas
          </TabsTrigger>
          <TabsTrigger value="availability" className="gap-2">
            <CalendarRange className="h-4 w-4" /> Disponibilidade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="mt-4">
          <StaffPanel />
        </TabsContent>
        <TabsContent value="services" className="mt-4">
          <ServicesPanel />
        </TabsContent>
        <TabsContent value="locations" className="mt-4">
          <LocationsPanel />
        </TabsContent>
        <TabsContent value="availability" className="mt-4">
          <AvailabilityPanel
            doctors={doctors}
            locations={locations}
            availability={availability}
            timeOff={timeOff}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatGrid({ stats }: { stats: { label: string; value: number }[] }) {
  return (
    <div className="hidden gap-2 md:flex">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-lg border border-border bg-card px-3 py-2 text-center"
        >
          <div className="text-lg font-semibold leading-tight">{s.value}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------- Staff ---------------------------- */

function StaffPanel() {
  const staff = useStaff();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    role: "doctor" as Role,
    specialty: "",
  });

  const submit = () => {
    if (!form.full_name.trim() || !form.email.trim()) return;
    clinicAdmin.inviteStaff({
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      role: form.role,
      specialty: form.role === "doctor" ? form.specialty.trim() || undefined : undefined,
    });
    setForm({ full_name: "", email: "", role: "doctor", specialty: "" });
    setOpen(false);
  };

  return (
    <PanelCard
      title="Equipe e papéis"
      description="Convide novos membros e desative o acesso quando alguém sair."
      action={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" /> Convidar membro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar membro da equipe</DialogTitle>
              <DialogDescription>
                Eles receberão um e-mail para entrar na clínica com o papel atribuído.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <Field label="Nome completo">
                <Input
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Dra. Maria Silva"
                />
              </Field>
              <Field label="E-mail">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="maria@clinica.com"
                />
              </Field>
              <Field label="Papel">
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm({ ...form, role: v as Role })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor">Médico(a)</SelectItem>
                    <SelectItem value="receptionist">Recepção</SelectItem>
                    <SelectItem value="clinic_admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              {form.role === "doctor" && (
                <Field label="Especialidade">
                  <Input
                    value={form.specialty}
                    onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                    placeholder="Cardiologia"
                  />
                </Field>
              )}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={submit}>Enviar convite</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Papel</TableHead>
            <TableHead>Especialidade</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {staff.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                Nenhum membro cadastrado. Use “Convidar membro” para começar.
              </TableCell>
            </TableRow>
          )}
          {staff.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.full_name}</TableCell>
              <TableCell className="text-muted-foreground">{s.email}</TableCell>
              <TableCell>
                <span className="rounded-md bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                  {roleLabel[s.role]}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {s.specialty ?? "—"}
              </TableCell>
              <TableCell>
                {s.active ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Ativo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <XCircle className="h-3.5 w-3.5" /> Desativado
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant={s.active ? "outline" : "default"}
                  onClick={() => clinicAdmin.toggleStaffActive(s.id)}
                >
                  {s.active ? "Desativar" : "Reativar"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </PanelCard>
  );
}

/* ---------------------------- Services ---------------------------- */

const SERVICE_COLORS = [
  "oklch(0.7 0.13 235)",
  "oklch(0.7 0.15 25)",
  "oklch(0.75 0.13 165)",
  "oklch(0.7 0.14 75)",
  "oklch(0.68 0.16 305)",
  "oklch(0.72 0.14 130)",
];

function ServicesPanel() {
  const services = useServices();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    id: undefined as string | undefined,
    name: "",
    duration_min: 30,
    color: SERVICE_COLORS[0],
  });

  const reset = () => setForm({ id: undefined, name: "", duration_min: 30, color: SERVICE_COLORS[0] });

  const submit = () => {
    if (!form.name.trim() || form.duration_min < 5) return;
    clinicAdmin.upsertService({
      id: form.id,
      name: form.name.trim(),
      duration_min: form.duration_min,
      color: form.color,
    });
    reset();
    setOpen(false);
  };

  return (
    <PanelCard
      title="Serviços"
      description="Modelos de serviço definem duração e cor no calendário."
      action={
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) reset();
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Novo serviço
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{form.id ? "Editar serviço" : "Novo serviço"}</DialogTitle>
              <DialogDescription>
                Defina nome, duração e cor usada no calendário.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <Field label="Nome">
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Consulta geral"
                />
              </Field>
              <Field label="Duração (minutos)">
                <Input
                  type="number"
                  min={5}
                  step={5}
                  value={form.duration_min}
                  onChange={(e) =>
                    setForm({ ...form, duration_min: Number(e.target.value) || 0 })
                  }
                />
              </Field>
              <Field label="Cor">
                <div className="flex flex-wrap gap-2">
                  {SERVICE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className={`h-8 w-8 rounded-full border-2 transition ${
                        form.color === c ? "border-foreground" : "border-transparent"
                      }`}
                      style={{ background: c }}
                      aria-label="Selecionar cor"
                    />
                  ))}
                </div>
              </Field>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={submit}>{form.id ? "Salvar alterações" : "Criar serviço"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <div
            key={s.id}
            className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-start gap-3">
              <span
                className="mt-1 h-3 w-3 shrink-0 rounded-full"
                style={{ background: s.color }}
              />
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.duration_min} min</div>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setForm({
                    id: s.id,
                    name: s.name,
                    duration_min: s.duration_min,
                    color: s.color,
                  });
                  setOpen(true);
                }}
              >
                Editar
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => clinicAdmin.removeService(s.id)}
                aria-label="Excluir"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        {services.length === 0 && (
          <EmptyState message="Nenhum serviço ainda. Adicione um para começar a agendar." />
        )}
      </div>
    </PanelCard>
  );
}

/* ---------------------------- Locations ---------------------------- */

function LocationsPanel() {
  const locations = useLocations();
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const submit = () => {
    if (!name.trim()) return;
    clinicAdmin.upsertLocation({ id: editingId ?? undefined, name: name.trim() });
    setName("");
    setEditingId(null);
  };

  return (
    <PanelCard
      title="Salas e locais"
      description="Salas físicas usadas no agendamento. O sistema impede a sobreposição de uma mesma sala."
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={editingId ? "Atualizar nome da sala" : "ex.: Consultório 4"}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <Button onClick={submit} className="gap-2">
          {editingId ? "Salvar" : <><Plus className="h-4 w-4" /> Adicionar sala</>}
        </Button>
        {editingId && (
          <Button
            variant="ghost"
            onClick={() => {
              setEditingId(null);
              setName("");
            }}
          >
            Cancelar
          </Button>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {locations.map((l) => (
          <div
            key={l.id}
            className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{l.name}</span>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingId(l.id);
                  setName(l.name);
                }}
              >
                Editar
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => clinicAdmin.removeLocation(l.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        {locations.length === 0 && <EmptyState message="Nenhuma sala cadastrada ainda." />}
      </div>
    </PanelCard>
  );
}

/* ---------------------------- Availability ---------------------------- */

interface AvailabilityPanelProps {
  doctors: ReturnType<typeof useStaff>;
  locations: ReturnType<typeof useLocations>;
  availability: ReturnType<typeof useAvailability>;
  timeOff: ReturnType<typeof useTimeOff>;
}

function AvailabilityPanel({
  doctors,
  locations,
  availability,
  timeOff,
}: AvailabilityPanelProps) {
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "");

  const activeDoctor = doctors.find((d) => d.id === doctorId);
  const docAvailability = useMemo(
    () => availability.filter((a) => a.doctor_id === doctorId),
    [availability, doctorId],
  );
  const docTimeOff = useMemo(
    () => timeOff.filter((t) => t.doctor_id === doctorId),
    [timeOff, doctorId],
  );

  return (
    <div className="space-y-4">
      <PanelCard
        title="Disponibilidade semanal recorrente"
        description="Configure os horários de trabalho de cada médico por dia e sala."
      >
        <div className="mb-4 flex items-center gap-3">
          <Label className="text-sm">Médico</Label>
          <Select value={doctorId} onValueChange={setDoctorId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Selecione um médico" />
            </SelectTrigger>
            <SelectContent>
              {doctors.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.full_name}
                  {d.specialty ? ` · ${d.specialty}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!activeDoctor ? (
          <EmptyState message="Cadastre um médico na aba Equipe primeiro." />
        ) : (
          <>
            <WeeklyGrid availability={docAvailability} />
            <AvailabilityForm doctorId={doctorId} locations={locations} />
            {docAvailability.length > 0 && (
              <div className="mt-4">
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Blocos ativos
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {docAvailability.map((a) => {
                    const loc = locations.find((l) => l.id === a.location_id);
                    const wdLabel = ({ mon: "Seg", tue: "Ter", wed: "Qua", thu: "Qui", fri: "Sex", sat: "Sáb", sun: "Dom" } as const)[a.weekday];
                    return (
                      <div
                        key={a.id}
                        className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm"
                      >
                        <span>
                          <span className="font-medium">{wdLabel}</span>{" "}
                          · {a.start_time}–{a.end_time}{" "}
                          <span className="text-muted-foreground">@ {loc?.name ?? "—"}</span>
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => clinicAdmin.removeAvailability(a.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </PanelCard>

      {activeDoctor && (
        <PanelCard
          title="Folgas e férias"
          description="Bloqueie datas que sobrescrevem o horário semanal recorrente."
        >
          <TimeOffForm doctorId={doctorId} />
          <div className="mt-4 space-y-2">
            {docTimeOff.length === 0 && (
              <EmptyState message="Nenhuma folga programada." />
            )}
            {docTimeOff.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-md border border-border bg-warning/10 px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <CalendarOff className="h-4 w-4 text-warning" />
                  <span className="font-medium">
                    {t.starts_on} → {t.ends_on}
                  </span>
                  {t.reason && (
                    <span className="text-muted-foreground">· {t.reason}</span>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => clinicAdmin.removeTimeOff(t.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </PanelCard>
      )}
    </div>
  );
}

function WeeklyGrid({
  availability,
}: {
  availability: ReturnType<typeof useAvailability>;
}) {
  return (
    <div className="mb-4 grid grid-cols-7 gap-1 rounded-lg border border-border bg-muted/30 p-2">
      {WEEKDAYS.map((d) => {
        const blocks = availability.filter((a) => a.weekday === d.key);
        return (
          <div
            key={d.key}
            className="rounded-md bg-card p-2 text-center text-xs"
          >
            <div className="mb-1 font-medium">{d.label}</div>
            {blocks.length === 0 ? (
              <div className="text-muted-foreground/60">—</div>
            ) : (
              blocks.map((b) => (
                <div
                  key={b.id}
                  className="mt-1 rounded bg-primary-soft px-1 py-0.5 text-[10px] font-medium text-primary"
                >
                  {b.start_time}-{b.end_time}
                </div>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}

function AvailabilityForm({
  doctorId,
  locations,
}: {
  doctorId: string;
  locations: ReturnType<typeof useLocations>;
}) {
  const [weekday, setWeekday] = useState<Weekday>("mon");
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");

  const submit = () => {
    if (!locationId || start >= end) return;
    clinicAdmin.addAvailability({
      doctor_id: doctorId,
      location_id: locationId,
      weekday,
      start_time: start,
      end_time: end,
    });
  };

  return (
    <div className="grid gap-2 rounded-md border border-border bg-card p-3 sm:grid-cols-5">
      <Field label="Day">
        <Select value={weekday} onValueChange={(v) => setWeekday(v as Weekday)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WEEKDAYS.map((d) => (
              <SelectItem key={d.key} value={d.key}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Room">
        <Select value={locationId} onValueChange={setLocationId}>
          <SelectTrigger>
            <SelectValue placeholder="Room" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Start">
        <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
      </Field>
      <Field label="End">
        <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
      </Field>
      <div className="flex items-end">
        <Button onClick={submit} className="w-full gap-2">
          <Plus className="h-4 w-4" /> Add block
        </Button>
      </div>
    </div>
  );
}

function TimeOffForm({ doctorId }: { doctorId: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const [starts, setStarts] = useState(today);
  const [ends, setEnds] = useState(today);
  const [reason, setReason] = useState("");

  const submit = () => {
    if (!starts || !ends || starts > ends) return;
    clinicAdmin.addTimeOff({
      doctor_id: doctorId,
      starts_on: starts,
      ends_on: ends,
      reason: reason.trim() || undefined,
    });
    setReason("");
  };

  return (
    <div className="grid gap-2 rounded-md border border-border bg-card p-3 sm:grid-cols-4">
      <Field label="From">
        <Input type="date" value={starts} onChange={(e) => setStarts(e.target.value)} />
      </Field>
      <Field label="To">
        <Input type="date" value={ends} onChange={(e) => setEnds(e.target.value)} />
      </Field>
      <Field label="Reason (optional)">
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Vacation, conference…"
        />
      </Field>
      <div className="flex items-end">
        <Button onClick={submit} className="w-full gap-2">
          <CalendarOff className="h-4 w-4" /> Block dates
        </Button>
      </div>
    </div>
  );
}

/* ---------------------------- Helpers ---------------------------- */

function PanelCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
