// In-memory appointments store with reactive updates for the dashboard.
import { useSyncExternalStore } from "react";
import { appointments as seed } from "./mock-data";
import type { Appointment, AppointmentStatus } from "./types";

let data: Appointment[] = [...seed];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const appointmentsStore = {
  all: () => data,
  setStatus(id: string, status: AppointmentStatus) {
    data = data.map((a) => (a.id === id ? { ...a, status } : a));
    emit();
  },
  add(appt: Appointment) {
    data = [...data, appt];
    emit();
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useAppointments(): Appointment[] {
  return useSyncExternalStore(
    (l) => {
      const unsub = appointmentsStore.subscribe(l);
      return () => unsub();
    },
    () => appointmentsStore.all(),
    () => seed,
  );
}
