import { useSyncExternalStore } from "react";
import { patients as seedPatients, clinic } from "./mock-data";
import type { Patient } from "./types";

let data: Patient[] = [...seedPatients];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const patientsStore = {
  all: () => data,
  add(input: Omit<Patient, "id" | "clinic_id">) {
    const patient: Patient = {
      ...input,
      id: `p_${Date.now().toString(36)}`,
      clinic_id: clinic.id,
    };
    data = [...data, patient];
    emit();
    return patient;
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function usePatients(): Patient[] {
  return useSyncExternalStore(
    (l) => {
      const unsub = patientsStore.subscribe(l);
      return () => unsub();
    },
    () => patientsStore.all(),
    () => seedPatients,
  );
}
