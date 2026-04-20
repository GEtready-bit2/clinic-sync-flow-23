// Domain types — mirror schema.sql. Swap mock data for Supabase later.
export type Role =
  | "super_admin"
  | "clinic_admin"
  | "doctor"
  | "receptionist"
  | "patient";

export type AppointmentStatus =
  | "booked"
  | "confirmed"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  timezone: string;
}

export interface Profile {
  id: string;
  clinic_id: string | null;
  full_name: string;
  email: string;
  role: Role;
  avatar_url?: string;
  specialty?: string;
}

export interface Location {
  id: string;
  clinic_id: string;
  name: string;
}

export interface Service {
  id: string;
  clinic_id: string;
  name: string;
  duration_min: number;
  color: string;
}

export interface Patient {
  id: string;
  clinic_id: string;
  full_name: string;
  date_of_birth: string;
  email: string;
  phone: string;
  allergies?: string;
}

export interface Appointment {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string;
  service_id: string;
  location_id: string;
  starts_at: string; // ISO
  ends_at: string;
  status: AppointmentStatus;
  notes?: string;
}

export interface DoctorAvailability {
  id: string;
  clinic_id: string;
  doctor_id: string;
  location_id: string;
  weekday: Weekday;
  start_time: string; // "09:00"
  end_time: string;
}
