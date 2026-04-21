// In-memory appointments store with reactive updates for the dashboard.
import { useSyncExternalStore } from "react";
import { appointments as seed } from "./mock-data";
import type { Appointment, AppointmentStatus } from "./types";

let data: Appointment[] = [...seed];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

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
  setStatus(id: string, status: AppointmentStatus) {
    data = data.map((a) => (a.id === id ? { ...a, status } : a));
    emit();
  },
  add(appt: Appointment) {
    data = [...data, appt];
    emit();
  },
  /**
   * Book a brand-new appointment with the same conflict rules as reschedule.
   * Returns null on success or a conflict descriptor on failure.
   */
  book(input: {
    clinic_id: string;
    patient_id: string;
    doctor_id: string;
    service_id: string;
    location_id: string;
    starts_at: string;
    duration_min: number;
    notes?: string;
  }): RescheduleConflict | null {
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

    const appt: Appointment = {
      id: `a_${Date.now().toString(36)}`,
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
    data = [...data, appt];
    emit();
    return null;
  },
  /**
   * Try to move an appointment to a new doctor + start time.
   * Mirrors the schema's GIST exclusion: no double-booking of doctor or room.
   * Returns null on success or a conflict descriptor on failure.
   */
  reschedule(
    id: string,
    next: { doctor_id: string; starts_at: string },
  ): RescheduleConflict | null {
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

    data = data.map((a) =>
      a.id === id
        ? {
            ...a,
            doctor_id: next.doctor_id,
            starts_at: new Date(newStart).toISOString(),
            ends_at: new Date(newEnd).toISOString(),
          }
        : a,
    );
    emit();
    return null;
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
