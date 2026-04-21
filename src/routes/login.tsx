import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Activity, Stethoscope, ClipboardList, Building2 } from "lucide-react";
import { auth } from "@/lib/auth-store";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (auth.current()) {
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage,
});

const ROLES: Array<{
  role: Role;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { role: "receptionist", title: "Receptionist",  description: "Live front desk · drag-and-drop calendar", icon: ClipboardList },
  { role: "doctor",       title: "Doctor",        description: "My schedule · patient EHR-light",          icon: Stethoscope },
  { role: "clinic_admin", title: "Clinic Admin",  description: "Staff, services, locations",               icon: Building2 },
];

function LoginPage() {
  const navigate = useNavigate();
  return (
    <div className="relative min-h-screen overflow-hidden bg-[image:var(--gradient-soft)]">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 h-[380px] w-[380px] rounded-full bg-accent/30 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-10 px-6 py-12 lg:grid-cols-2">
        {/* Brand panel */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
            <Activity className="h-3.5 w-3.5" />
            NexusPulse · Clinical Suite
          </div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Operate your clinic with{" "}
            <span className="bg-[image:var(--gradient-clinical)] bg-clip-text text-transparent">
              calm precision.
            </span>
          </h1>
          <p className="max-w-md text-base text-muted-foreground">
            Multi-tenant scheduling for modern medical practices. Strict data
            isolation, multi-location calendars, and a real-time front desk —
            all in one quiet, dependable workspace.
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              "Per-clinic data isolation enforced at the database",
              "No double-booking — doctor and room collisions blocked",
              "Live front-desk status board with one-tap transitions",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Role picker */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-elevated)]">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Continue as</h2>
            <p className="text-xs text-muted-foreground">
              Demo mode — pick a role to enter the matching workspace.
            </p>
          </div>
          <div className="grid gap-2">
            {ROLES.map(({ role, title, description, icon: Icon }) => (
              <button
                key={role}
                onClick={() => {
                  auth.signInAs(role);
                  navigate({ to: "/" });
                }}
                className="group flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-3 text-left transition hover:border-primary/40 hover:bg-primary-soft/40"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{title}</div>
                  <div className="truncate text-xs text-muted-foreground">{description}</div>
                </div>
                <span className="text-xs text-muted-foreground transition group-hover:text-primary">
                  →
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
