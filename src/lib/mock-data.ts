import type {
  Appointment,
  Clinic,
  DoctorAvailability,
  Location,
  Patient,
  Profile,
  Service,
} from "./types";

export const clinic: Clinic = {
  id: "clinic_1",
  name: "NexusPulse Medical Center",
  slug: "nexuspulse",
  timezone: "UTC",
};

export const profiles: Profile[] = [
  { id: "u_super", clinic_id: null, full_name: "Dr. Helena Voss", email: "platform@nexuspulse.io", role: "super_admin" },
  { id: "u_admin", clinic_id: clinic.id, full_name: "Marcus Chen", email: "marcus@nexuspulse.io", role: "clinic_admin" },
  { id: "u_doc1",  clinic_id: clinic.id, full_name: "Dr. Amelia Park", email: "a.park@nexuspulse.io", role: "doctor", specialty: "Cardiology" },
  { id: "u_doc2",  clinic_id: clinic.id, full_name: "Dr. Rashid Khan", email: "r.khan@nexuspulse.io", role: "doctor", specialty: "Dermatology" },
  { id: "u_recep", clinic_id: clinic.id, full_name: "Sofia Alvarez",  email: "sofia@nexuspulse.io",  role: "receptionist" },
  { id: "u_pat",   clinic_id: clinic.id, full_name: "James Whitaker", email: "james@example.com",    role: "patient" },
];

export const locations: Location[] = [
  { id: "loc_1", clinic_id: clinic.id, name: "Consult Room 1" },
  { id: "loc_2", clinic_id: clinic.id, name: "Consult Room 2" },
  { id: "loc_3", clinic_id: clinic.id, name: "Procedure Suite A" },
];

export const services: Service[] = [
  { id: "svc_1", clinic_id: clinic.id, name: "General Consultation",  duration_min: 30, color: "oklch(0.7 0.13 235)" },
  { id: "svc_2", clinic_id: clinic.id, name: "Cardiology Follow-up",  duration_min: 45, color: "oklch(0.7 0.15 25)"  },
  { id: "svc_3", clinic_id: clinic.id, name: "Dermatology Screening", duration_min: 30, color: "oklch(0.75 0.13 165)" },
  { id: "svc_4", clinic_id: clinic.id, name: "Minor Procedure",       duration_min: 60, color: "oklch(0.7 0.14 75)"  },
];

export const patients: Patient[] = [
  { id: "p_1", clinic_id: clinic.id, full_name: "James Whitaker",   date_of_birth: "1985-03-12", email: "james@example.com",   phone: "+1 555 0101", allergies: "Penicillin" },
  { id: "p_2", clinic_id: clinic.id, full_name: "Olivia Martinez",  date_of_birth: "1992-07-29", email: "olivia@example.com",  phone: "+1 555 0102" },
  { id: "p_3", clinic_id: clinic.id, full_name: "Daniel Rourke",    date_of_birth: "1978-11-04", email: "daniel@example.com",  phone: "+1 555 0103", allergies: "Latex" },
  { id: "p_4", clinic_id: clinic.id, full_name: "Priya Subramanian",date_of_birth: "2001-01-22", email: "priya@example.com",   phone: "+1 555 0104" },
  { id: "p_5", clinic_id: clinic.id, full_name: "Theo Bergmann",    date_of_birth: "1965-09-17", email: "theo@example.com",    phone: "+1 555 0105" },
  { id: "p_6", clinic_id: clinic.id, full_name: "Aiko Tanaka",      date_of_birth: "1989-06-30", email: "aiko@example.com",    phone: "+1 555 0106" },
];

export const availability: DoctorAvailability[] = [
  { id: "av_1", clinic_id: clinic.id, doctor_id: "u_doc1", location_id: "loc_1", weekday: "mon", start_time: "09:00", end_time: "17:00" },
  { id: "av_2", clinic_id: clinic.id, doctor_id: "u_doc1", location_id: "loc_1", weekday: "tue", start_time: "09:00", end_time: "17:00" },
  { id: "av_3", clinic_id: clinic.id, doctor_id: "u_doc1", location_id: "loc_3", weekday: "wed", start_time: "10:00", end_time: "15:00" },
  { id: "av_4", clinic_id: clinic.id, doctor_id: "u_doc2", location_id: "loc_2", weekday: "mon", start_time: "08:00", end_time: "13:00" },
  { id: "av_5", clinic_id: clinic.id, doctor_id: "u_doc2", location_id: "loc_2", weekday: "thu", start_time: "12:00", end_time: "18:00" },
];

// Build a day of appointments anchored to "today" so the dashboard always feels live.
function todayAt(h: number, m = 0): string {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}
function plusMin(iso: string, min: number): string {
  return new Date(new Date(iso).getTime() + min * 60_000).toISOString();
}

export const appointments: Appointment[] = [
  { id: "a_1", clinic_id: clinic.id, patient_id: "p_1", doctor_id: "u_doc1", service_id: "svc_2", location_id: "loc_1", starts_at: todayAt(9),    ends_at: plusMin(todayAt(9), 45),    status: "checked_in" },
  { id: "a_2", clinic_id: clinic.id, patient_id: "p_2", doctor_id: "u_doc1", service_id: "svc_1", location_id: "loc_1", starts_at: todayAt(10, 0),ends_at: plusMin(todayAt(10, 0), 30), status: "confirmed" },
  { id: "a_3", clinic_id: clinic.id, patient_id: "p_3", doctor_id: "u_doc2", service_id: "svc_3", location_id: "loc_2", starts_at: todayAt(10, 30),ends_at: plusMin(todayAt(10, 30), 30), status: "booked" },
  { id: "a_4", clinic_id: clinic.id, patient_id: "p_4", doctor_id: "u_doc1", service_id: "svc_1", location_id: "loc_1", starts_at: todayAt(11, 30),ends_at: plusMin(todayAt(11, 30), 30), status: "booked" },
  { id: "a_5", clinic_id: clinic.id, patient_id: "p_5", doctor_id: "u_doc2", service_id: "svc_4", location_id: "loc_3", starts_at: todayAt(13, 0),ends_at: plusMin(todayAt(13, 0), 60), status: "confirmed" },
  { id: "a_6", clinic_id: clinic.id, patient_id: "p_6", doctor_id: "u_doc1", service_id: "svc_2", location_id: "loc_1", starts_at: todayAt(14, 30),ends_at: plusMin(todayAt(14, 30), 45), status: "booked" },
  { id: "a_7", clinic_id: clinic.id, patient_id: "p_2", doctor_id: "u_doc2", service_id: "svc_3", location_id: "loc_2", starts_at: todayAt(15, 30),ends_at: plusMin(todayAt(15, 30), 30), status: "booked" },
  { id: "a_8", clinic_id: clinic.id, patient_id: "p_3", doctor_id: "u_doc1", service_id: "svc_1", location_id: "loc_1", starts_at: todayAt(16, 30),ends_at: plusMin(todayAt(16, 30), 30), status: "no_show" },
];

export function doctorsOf(clinicId: string): Profile[] {
  return profiles.filter((p) => p.clinic_id === clinicId && p.role === "doctor");
}
