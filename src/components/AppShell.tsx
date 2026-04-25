import { Link, useNavigate } from "@tanstack/react-router";
import { Activity, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser, auth } from "@/lib/auth-store";

const roleLabel: Record<string, string> = {
  super_admin: "Super Administrador",
  clinic_admin: "Administrador",
  doctor: "Médico(a)",
  receptionist: "Recepção",
  patient: "Paciente",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const user = useCurrentUser();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[image:var(--gradient-clinical)] text-primary-foreground">
              <Activity className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">Clínica</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Suíte Clínica
              </div>
            </div>
          </Link>
          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <div className="text-sm font-medium">{user.full_name}</div>
                <div className="text-[11px] text-muted-foreground">{roleLabel[user.role]}</div>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                {user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  auth.signOut();
                  navigate({ to: "/login" });
                }}
                aria-label="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
