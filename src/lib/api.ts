import { supabase } from "./supabase";
import type { Location, Patient, Appointment, Service, Profile, DoctorAvailability, UserRole } from "./types";

export const api = {
  locations: {
    async list(clinicId: string) {
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .eq("clinic_id", clinicId)
        .order("name");
      if (error) throw error;
      return data as Location[];
    },
    async create(location: Omit<Location, "id">) {
      const { data, error } = await supabase
        .from("locations")
        .insert(location)
        .select()
        .single();
      if (error) throw error;
      return data as Location;
    },
    async update(id: string, name: string) {
      const { data, error } = await supabase
        .from("locations")
        .update({ name })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Location;
    },
    async delete(id: string) {
      const { error } = await supabase.from("locations").delete().eq("id", id);
      if (error) throw error;
    },
  },
  patients: {
    async list(clinicId: string) {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("clinic_id", clinicId)
        .order("full_name");
      if (error) throw error;
      return data as Patient[];
    },
    async create(patient: Omit<Patient, "id">) {
      const { data, error } = await supabase
        .from("patients")
        .insert(patient)
        .select()
        .single();
      if (error) throw error;
      return data as Patient;
    },
  },
  appointments: {
    async list(clinicId: string) {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("clinic_id", clinicId)
        .order("starts_at");
      if (error) throw error;
      return data as Appointment[];
    },
    async create(appointment: Omit<Appointment, "id">) {
      const { data, error } = await supabase
        .from("appointments")
        .insert(appointment)
        .select()
        .single();
      if (error) throw error;
      return data as Appointment;
    },
    async update(id: string, updates: Partial<Appointment>) {
      const { data, error } = await supabase
        .from("appointments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Appointment;
    },
    async delete(id: string) {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
  },
  services: {
    async list(clinicId: string) {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("clinic_id", clinicId)
        .order("name");
      if (error) throw error;
      return data as Service[];
    },
    async create(service: Omit<Service, "id">) {
      const { data, error } = await supabase
        .from("services")
        .insert(service)
        .select()
        .single();
      if (error) throw error;
      return data as Service;
    },
    async update(id: string, updates: Partial<Service>) {
      const { data, error } = await supabase
        .from("services")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Service;
    },
    async delete(id: string) {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
    },
  },
  profiles: {
    async list(clinicId: string) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("clinic_id", clinicId)
        .order("full_name");
      if (error) throw error;
      return data as Profile[];
    },
    async create(profile: Omit<Profile, "id">) {
      const { data, error } = await supabase
        .from("profiles")
        .insert(profile)
        .select()
        .single();
      if (error) throw error;
      return data as Profile;
    },
    async update(id: string, updates: Partial<Profile>) {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Profile;
    },
    async delete(id: string) {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
    },
  },
  userRoles: {
    async list(clinicId: string) {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("clinic_id", clinicId);
      if (error) throw error;
      return data as UserRole[];
    },
    async create(userRole: Omit<UserRole, "id">) {
      const { data, error } = await supabase
        .from("user_roles")
        .insert(userRole)
        .select()
        .single();
      if (error) throw error;
      return data as UserRole;
    },
    async delete(id: string) {
      const { error } = await supabase.from("user_roles").delete().eq("id", id);
      if (error) throw error;
    },
  },
  availability: {
    async list(clinicId: string) {
      const { data, error } = await supabase
        .from("doctor_availability")
        .select("*")
        .eq("clinic_id", clinicId)
        .order("doctor_id").order("weekday").order("start_time");
      if (error) throw error;
      return data as DoctorAvailability[];
    },
    async create(availability: Omit<DoctorAvailability, "id">) {
      const { data, error } = await supabase
        .from("doctor_availability")
        .insert(availability)
        .select()
        .single();
      if (error) throw error;
      return data as DoctorAvailability;
    },
    async delete(id: string) {
      const { error } = await supabase.from("doctor_availability").delete().eq("id", id);
      if (error) throw error;
    },
  },
};
