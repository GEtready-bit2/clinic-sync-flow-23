import { createFileRoute, redirect } from "@tanstack/react-router";
import { auth } from "@/lib/auth-store";
import { AppShell } from "@/components/AppShell";
import { ReceptionistDashboard } from "@/components/ReceptionistDashboard";
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
  return <PlaceholderForRole role={role} />;
}

const meta: Record<Role, { title: string; body: string }> = {
  receptionist: { title: "Receptionist", body: "Front-desk dashboard." },
  doctor: {
    title: "Doctor's workspace",
    body: "Your day-by-day schedule, patient list, and EHR-light notes will live here.",
  },
  clinic_admin: {
    title: "Clinic administration",
    body: "Manage staff, services, rooms, and recurring availability for your clinic.",
  },
  patient: {
    title: "Book your visit",
    body: "The patient booking portal — pick a service, doctor, and an available slot.",
  },
  super_admin: {
    title: "Platform control",
    body: "Onboard new clinics and oversee tenant configuration.",
  },
};

function PlaceholderForRole({ role }: { role: Role }) {
  const m = meta[role];
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-primary">
        Coming next
      </div>
      <h1 className="text-3xl font-semibold tracking-tight">{m.title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{m.body}</p>
      <p className="mt-6 text-xs text-muted-foreground">
        Sign out from the top right to switch roles and explore the receptionist
        dashboard.
      </p>
    </div>
  );
}
