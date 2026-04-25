import { createFileRoute, redirect } from "@tanstack/react-router";
import { auth } from "@/lib/auth-store";
import { AppShell } from "@/components/AppShell";
import { ReceptionistDashboard } from "@/components/ReceptionistDashboard";
import { DoctorWorkspace } from "@/components/DoctorWorkspace";
import { ClinicAdminDashboard } from "@/components/ClinicAdminDashboard";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const user = auth.current();
    if (!user) throw redirect({ to: "/login" });
  },
  component: Home,
});

function Home() {
  const user = auth.current()!;
  return (
    <AppShell>
      <RoleView role={user.role} />
    </AppShell>
  );
}

function RoleView({ role }: { role: Role }) {
  if (role === "receptionist") return <ReceptionistDashboard />;
  if (role === "doctor") return <DoctorWorkspace />;
  if (role === "clinic_admin") return <ClinicAdminDashboard />;
  return <PlaceholderForRole role={role} />;
}

const meta: Record<Role, { title: string; body: string }> = {
  receptionist: { title: "Recepção", body: "Painel da recepção." },
  doctor: {
    title: "Espaço do médico",
    body: "Sua agenda diária, lista de pacientes e prontuário simplificado.",
  },
  clinic_admin: {
    title: "Administração da clínica",
    body: "Gerencie equipe, serviços, salas e disponibilidade recorrente.",
  },
  patient: {
    title: "Agendar consulta",
    body: "Portal do paciente — escolha um serviço, médico e horário disponível.",
  },
  super_admin: {
    title: "Controle da plataforma",
    body: "Cadastre novas clínicas e supervisione a configuração dos tenants.",
  },
};

function PlaceholderForRole({ role }: { role: Role }) {
  const m = meta[role];
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-primary">
        Em breve
      </div>
      <h1 className="text-3xl font-semibold tracking-tight">{m.title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{m.body}</p>
      <p className="mt-6 text-xs text-muted-foreground">
        Saia pelo canto superior direito para trocar de papel e explorar o
        painel da recepção.
      </p>
    </div>
  );
}
