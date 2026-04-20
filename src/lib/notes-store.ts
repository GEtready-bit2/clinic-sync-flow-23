// In-memory EHR-light notes store, keyed by appointment_id.
// Mirrors the appointment_notes table — swap for Supabase later.
import { useSyncExternalStore } from "react";

export interface AppointmentNote {
  appointment_id: string;
  author_id: string;
  body: string;
  updated_at: string;
}

const seed: AppointmentNote[] = [
  {
    appointment_id: "a_1",
    author_id: "u_doc1",
    body:
      "Follow-up for chest tightness. BP 128/82. ECG normal sinus rhythm. Continue current beta-blocker; revisit in 6 weeks.",
    updated_at: new Date().toISOString(),
  },
];

let data: AppointmentNote[] = [...seed];
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
    () => seed,
  );
}
