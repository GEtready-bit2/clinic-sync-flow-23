import { useSyncExternalStore } from "react";
import { patients as seedPatients, clinic } from "./mock-data";
import type { Patient } from "./types";
import { api } from "./api";

let data: Patient[] = [...seedPatients];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const patientsStore = {
  all: () => data,
  async load() {
    try {
      const dbPatients = await api.patients.list(clinic.id);
      data = dbPatients;
      emit();
    } catch (err) {
      console.error("Erro ao carregar pacientes:", err);
    }
  },
  async add(input: Omit<Patient, "id" | "clinic_id">) {
    try {
      const patient = await api.patients.create({
        ...input,
        clinic_id: clinic.id,
      });
      data = [...data, patient];
      emit();
      return patient;
    } catch (err) {
      console.error("Erro ao cadastrar paciente:", err);
      throw err;
    }
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
