// Appointments store with Supabase persistence and reactive updates for the dashboard.
import { useSyncExternalStore } from "react";
import type { Appointment, AppointmentStatus } from "./types";
import { api } from "./api";
import { clinic } from "./mock-data";

let data: Appointment[] = [];
let isLoading = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

// Load initial data from Supabase
async function loadAppointments() {
  if (isLoading) return; // Evita chamadas repetidas
  isLoading = true;
  
  try {
    const appointments = await api.appointments.list(clinic.id);
    data = appointments;
    emit();
  } catch (err) {
    console.error("Erro ao carregar appointments:", err);
    // Em caso de erro, usar dados vazios para evitar loops
    data = [];
    emit();
  } finally {
    isLoading = false;
  }
}

// Initialize data on first load
loadAppointments();

const ACTIVE = (a: Appointment) =>
  a.status !== "cancelled" && a.status !== "no_show";

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

export type RescheduleConflict =
  | { kind: "doctor"; with: Appointment }
  | { kind: "room"; with: Appointment };

export const appointmentsStore = {
  all: () => data,
  async setStatus(id: string, status: AppointmentStatus) {
    try {
      await api.appointments.update(id, { status });
      data = data.map((a) => (a.id === id ? { ...a, status } : a));
      emit();
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      throw err;
    }
  },
  async add(appt: Appointment) {
    try {
      const created = await api.appointments.create(appt);
      data = [...data, created];
      emit();
      return created;
    } catch (err) {
      console.error("Erro ao adicionar appointment:", err);
      throw err;
    }
  },
  /**
   * Book a brand-new appointment with the same conflict rules as reschedule.
   * Returns null on success or a conflict descriptor on failure.
   */
  async book(input: {
    clinic_id: string;
    patient_id: string;
    doctor_id: string;
    service_id: string;
    location_id: string;
    starts_at: string;
    duration_min: number;
    notes?: string;
  }): Promise<RescheduleConflict | null> {
    const newStart = new Date(input.starts_at).getTime();
    const newEnd = newStart + input.duration_min * 60_000;

    const conflict = data.find((a) => {
      if (!ACTIVE(a)) return false;
      const s = new Date(a.starts_at).getTime();
      const e = new Date(a.ends_at).getTime();
      if (!overlaps(newStart, newEnd, s, e)) return false;
      if (a.doctor_id === input.doctor_id) return true;
      if (a.location_id === input.location_id) return true;
      return false;
    });

    if (conflict) {
      return {
        kind: conflict.doctor_id === input.doctor_id ? "doctor" : "room",
        with: conflict,
      };
    }

    const appt: Omit<Appointment, "id"> = {
      clinic_id: input.clinic_id,
      patient_id: input.patient_id,
      doctor_id: input.doctor_id,
      service_id: input.service_id,
      location_id: input.location_id,
      starts_at: new Date(newStart).toISOString(),
      ends_at: new Date(newEnd).toISOString(),
      status: "booked",
      notes: input.notes,
    };
    
    try {
      const created = await api.appointments.create(appt);
      data = [...data, created];
      emit();
      return null;
    } catch (err) {
      console.error("Erro ao criar appointment:", err);
      
      // Verificar se é erro de foreign key (médico local)
      if (err instanceof Error && err.message.includes("is not present in table \"profiles\"")) {
        console.error("❌ Erro: Tentando criar appointment com médico que só existe localmente.");
        console.error("💡 Solução: Execute o script de sincronização no Supabase ou adicione médicos diretamente no Supabase.");
        throw new Error("Este médico só existe localmente. Para criar appointments, adicione o médico no Supabase primeiro.");
      }
      
      throw err;
    }
  },
  /**
   * Try to move an appointment to a new doctor + start time.
   * Mirrors the schema's GIST exclusion: no double-booking of doctor or room.
   * Returns null on success or a conflict descriptor on failure.
   */
  async reschedule(
    id: string,
    next: { doctor_id: string; starts_at: string },
  ): Promise<RescheduleConflict | null> {
    const target = data.find((a) => a.id === id);
    if (!target) return null;
    const duration =
      new Date(target.ends_at).getTime() - new Date(target.starts_at).getTime();
    const newStart = new Date(next.starts_at).getTime();
    const newEnd = newStart + duration;

    const conflict = data.find((a) => {
      if (a.id === id || !ACTIVE(a)) return false;
      const s = new Date(a.starts_at).getTime();
      const e = new Date(a.ends_at).getTime();
      if (!overlaps(newStart, newEnd, s, e)) return false;
      if (a.doctor_id === next.doctor_id) return true;
      if (a.location_id === target.location_id) return true;
      return false;
    });

    if (conflict) {
      return {
        kind:
          conflict.doctor_id === next.doctor_id ? "doctor" : "room",
        with: conflict,
      };
    }

    try {
      const updated = await api.appointments.update(id, {
        doctor_id: next.doctor_id,
        starts_at: new Date(newStart).toISOString(),
        ends_at: new Date(newEnd).toISOString(),
      });
      data = data.map((a) => (a.id === id ? updated : a));
      emit();
      return null;
    } catch (err) {
      console.error("Erro ao remarcar appointment:", err);
      throw err;
    }
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
    () => [],
  );
}
