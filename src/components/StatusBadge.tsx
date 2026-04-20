import type { AppointmentStatus } from "@/lib/types";

const map: Record<AppointmentStatus, { label: string; cls: string }> = {
  booked:      { label: "Booked",      cls: "bg-muted text-muted-foreground border-border" },
  confirmed:   { label: "Confirmed",   cls: "bg-primary-soft text-primary border-primary/20" },
  checked_in:  { label: "Checked In",  cls: "bg-accent/40 text-accent-foreground border-accent" },
  in_progress: { label: "In Progress", cls: "bg-warning/20 text-foreground border-warning/40" },
  completed:   { label: "Completed",   cls: "bg-success/20 text-foreground border-success/40" },
  cancelled:   { label: "Cancelled",   cls: "bg-destructive/10 text-destructive border-destructive/30" },
  no_show:     { label: "No Show",     cls: "bg-destructive/15 text-destructive border-destructive/40" },
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const s = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.cls}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {s.label}
    </span>
  );
}
