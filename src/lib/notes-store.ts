// In-memory EHR-light notes store, keyed by appointment_id.
import { useSyncExternalStore } from "react";

export interface AppointmentNote {
  appointment_id: string;
  author_id: string;
  body: string;
  updated_at: string;
}

let data: AppointmentNote[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const notesStore = {
  all: () => data,
  forAppointment: (id: string) =>
    data.find((n) => n.appointment_id === id) ?? null,
  upsert(note: AppointmentNote) {
    const existing = data.find((n) => n.appointment_id === note.appointment_id);
    data = existing
      ? data.map((n) =>
          n.appointment_id === note.appointment_id
            ? { ...note, updated_at: new Date().toISOString() }
            : n,
        )
      : [...data, { ...note, updated_at: new Date().toISOString() }];
    emit();
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useNotes(): AppointmentNote[] {
  return useSyncExternalStore(
    (l) => {
      const unsub = notesStore.subscribe(l);
      return () => unsub();
    },
    () => notesStore.all(),
    () => [],
  );
}
