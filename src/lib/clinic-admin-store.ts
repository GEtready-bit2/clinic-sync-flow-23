// Reactive in-memory store for clinic-admin entities: staff, services, locations,
// recurring availability, and time-off overrides. Mirrors schema.sql tables so
// swapping for Supabase later is just a query layer change.
import { useSyncExternalStore } from "react";
import type {
  DoctorAvailability,
  Location,
  Profile,
  Service,
  Weekday,
} from "./types";
import {
  availability as seedAvailability,
  locations as seedLocations,
  profiles as seedProfiles,
  services as seedServices,
  clinic,
} from "./mock-data";

export interface TimeOff {
  id: string;
  clinic_id: string;
  doctor_id: string;
  starts_on: string; // YYYY-MM-DD
  ends_on: string;
  reason?: string;
}

export interface StaffMember extends Profile {
  active: boolean;
  invited_at: string;
}

const listeners = new Set<() => void>();

let staff: StaffMember[] = seedProfiles
  .filter((p) => p.clinic_id === clinic.id && p.role !== "patient")
  .map((p) => ({ ...p, active: true, invited_at: new Date().toISOString().slice(0, 10) }));

let services: Service[] = [...seedServices];
let locations: Location[] = [...seedLocations];
let availability: DoctorAvailability[] = [...seedAvailability];
let timeOff: TimeOff[] = [];

function emit() {
  listeners.forEach((l) => l());
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export const clinicAdmin = {
  // ---- staff ----
  listStaff: () => staff,
  inviteStaff(input: { full_name: string; email: string; role: Profile["role"]; specialty?: string }) {
    const member: StaffMember = {
      id: uid("u"),
      clinic_id: clinic.id,
      full_name: input.full_name,
      email: input.email,
      role: input.role,
      specialty: input.specialty,
      active: true,
      invited_at: new Date().toISOString().slice(0, 10),
    };
    staff = [...staff, member];
    emit();
  },
  toggleStaffActive(id: string) {
    staff = staff.map((s) => (s.id === id ? { ...s, active: !s.active } : s));
    emit();
  },

  // ---- services ----
  listServices: () => services,
  upsertService(input: Omit<Service, "clinic_id" | "id"> & { id?: string }) {
    if (input.id) {
      services = services.map((s) =>
        s.id === input.id ? { ...s, ...input, clinic_id: clinic.id, id: input.id } : s,
      );
    } else {
      services = [...services, { ...input, clinic_id: clinic.id, id: uid("svc") }];
    }
    emit();
  },
  removeService(id: string) {
    services = services.filter((s) => s.id !== id);
    emit();
  },

  // ---- locations ----
  listLocations: () => locations,
  upsertLocation(input: { id?: string; name: string }) {
    if (input.id) {
      locations = locations.map((l) =>
        l.id === input.id ? { ...l, name: input.name } : l,
      );
    } else {
      locations = [...locations, { id: uid("loc"), clinic_id: clinic.id, name: input.name }];
    }
    emit();
  },
  removeLocation(id: string) {
    locations = locations.filter((l) => l.id !== id);
    emit();
  },

  // ---- availability ----
  listAvailability: () => availability,
  addAvailability(input: Omit<DoctorAvailability, "id" | "clinic_id">) {
    availability = [
      ...availability,
      { ...input, id: uid("av"), clinic_id: clinic.id },
    ];
    emit();
  },
  removeAvailability(id: string) {
    availability = availability.filter((a) => a.id !== id);
    emit();
  },

  // ---- time off ----
  listTimeOff: () => timeOff,
  addTimeOff(input: Omit<TimeOff, "id" | "clinic_id">) {
    timeOff = [...timeOff, { ...input, id: uid("to"), clinic_id: clinic.id }];
    emit();
  },
  removeTimeOff(id: string) {
    timeOff = timeOff.filter((t) => t.id !== id);
    emit();
  },

  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

function useStore<T>(read: () => T): T {
  return useSyncExternalStore(
    (l) => {
      const u = clinicAdmin.subscribe(l);
      return () => u();
    },
    read,
    read,
  );
}

export const useStaff = () => useStore(clinicAdmin.listStaff);
export const useServices = () => useStore(clinicAdmin.listServices);
export const useLocations = () => useStore(clinicAdmin.listLocations);
export const useAvailability = () => useStore(clinicAdmin.listAvailability);
export const useTimeOff = () => useStore(clinicAdmin.listTimeOff);

export const WEEKDAYS: { key: Weekday; label: string }[] = [
  { key: "mon", label: "Seg" },
  { key: "tue", label: "Ter" },
  { key: "wed", label: "Qua" },
  { key: "thu", label: "Qui" },
  { key: "fri", label: "Sex" },
  { key: "sat", label: "Sáb" },
  { key: "sun", label: "Dom" },
];
