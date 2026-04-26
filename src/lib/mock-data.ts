import type {
  Appointment,
  Clinic,
  DoctorAvailability,
  Location,
  Patient,
  Profile,
  Service,
} from "./types";

// Clínica padrão da demo. Mantida apenas para que o login mock e o tenant context funcionem.
export const clinic: Clinic = {
  id: "c0f89fbe-48b4-4d9f-a718-2031fc98c587",
  name: "Clínica Demo",
  slug: "clinica-demo",
  timezone: "America/Sao_Paulo",
};

// Perfis mínimos para o login demo (um por papel disponível).
// Nenhum dado clínico real — todos os perfis são placeholders e podem ser editados/removidos.
export const profiles: Profile[] = [
  { id: "u_admin", clinic_id: clinic.id, full_name: "Administrador", email: "admin@clinica.local" },
  { id: "u_doc",   clinic_id: clinic.id, full_name: "Médico(a)",     email: "medico@clinica.local" },
  { id: "u_recep", clinic_id: clinic.id, full_name: "Recepção",      email: "recepcao@clinica.local" },
];

export const locations: Location[] = [];
export const services: Service[] = [];
export const patients: Patient[] = [];
export const availability: DoctorAvailability[] = [];
export const appointments: Appointment[] = [];

export function doctorsOf(clinicId: string): Profile[] {
  return profiles.filter((p) => p.clinic_id === clinicId);
}
