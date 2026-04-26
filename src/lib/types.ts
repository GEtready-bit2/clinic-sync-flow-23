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
  phone?: string;
  avatar_url?: string;
  active?: boolean;
  created_at?: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  clinic_id: string;
  role: Role;
}

export interface Location {
  id: string;
  clinic_id: string;
  name: string;
  description?: string;
  active?: boolean;
  created_at?: string;
}

export interface Service {
  id: string;
  clinic_id: string;
  name: string;
  description?: string;
  duration_min: number;
  color?: string;
  active?: boolean;
  created_at?: string;
}

export interface Patient {
  id: string;
  clinic_id: string;
  user_id?: string;
  full_name: string;
  date_of_birth?: string;
  sex?: string;
  email?: string;
  phone?: string;
  address?: string;
  allergies?: string;
  medical_history?: string;
  created_at?: string;
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
