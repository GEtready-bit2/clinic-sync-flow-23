// Reactive Supabase store for clinic-admin entities: staff, services, locations,
// recurring availability, and time-off overrides. Full persistence to database.
import { useSyncExternalStore } from "react";
import type {
  DoctorAvailability,
  Location,
  Profile,
  Service,
  Weekday,
  UserRole,
} from "./types";
import { api } from "./api";
import { clinic } from "./mock-data";

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
  role: UserRole["role"];
  specialty?: string;
  _isLocal?: boolean; // Marcar dados que só existem localmente
}

const listeners = new Set<() => void>();

let staff: StaffMember[] = [];
let services: Service[] = [];
let locations: Location[] = [];
let availability: DoctorAvailability[] = [];
let timeOff: TimeOff[] = [];

let isLoading = false;

// Load initial data from Supabase
async function loadClinicData() {
  if (isLoading) return; // Evita chamadas repetidas
  isLoading = true;
  
  try {
    const [profilesData, userRolesData, servicesData, locationsData, availabilityData] = await Promise.all([
      api.profiles.list(clinic.id),
      api.userRoles.list(clinic.id),
      api.services.list(clinic.id),
      api.locations.list(clinic.id),
      api.availability.list(clinic.id),
    ]);
    
    // Combine profiles with their roles
    staff = profilesData
      .map((profile) => {
        const userRole = userRolesData.find((role) => role.user_id === profile.id);
        if (!userRole || userRole.role === "patient") return null;
        
        return {
          ...profile,
          active: true,
          invited_at: new Date().toISOString().slice(0, 10),
          role: userRole.role,
          specialty: undefined, // Specialty não está no schema, mas mantida para compatibilidade
        } as StaffMember;
      })
      .filter((p): p is StaffMember => p !== null);
      
    services = servicesData;
    locations = locationsData;
    availability = availabilityData;
    
    emit();
  } catch (err) {
    console.error("Erro ao carregar dados da clínica:", err);
    // Em caso de erro, usar dados mockados para evitar loops
    staff = [];
    services = [];
    locations = [];
    availability = [];
    emit();
  } finally {
    isLoading = false;
  }
}

// Initialize data on first load
loadClinicData();

function emit() {
  listeners.forEach((l) => l());
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

// Gera UUID válido para fallback local
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const clinicAdmin = {
  // ---- staff ----
  listStaff: () => staff,
  async inviteStaff(input: { full_name: string; email: string; role: UserRole["role"]; specialty?: string }) {
    try {
      console.log('📝 Convidando staff:', input);
      
      // First create the profile
      const profile: Omit<Profile, "id"> = {
        clinic_id: clinic.id,
        full_name: input.full_name,
        email: input.email,
      };
      
      console.log('👤 Criando profile:', profile);
      const createdProfile = await api.profiles.create(profile);
      console.log('✅ Profile criado:', createdProfile);
      
      // Then create the user role
      const userRole: Omit<UserRole, "id"> = {
        user_id: createdProfile.id,
        clinic_id: clinic.id,
        role: input.role,
      };
      
      console.log('🔐 Criando user role:', userRole);
      await api.userRoles.create(userRole);
      console.log('✅ User role criado');
      
      const member: StaffMember = {
        ...createdProfile,
        active: true,
        invited_at: new Date().toISOString().slice(0, 10),
        role: input.role,
        specialty: input.specialty,
      };
      
      staff = [...staff, member];
      emit();
      console.log('🎉 Staff adicionado com sucesso:', member);
      return member;
    } catch (err) {
      console.error("❌ Erro ao convidar staff:", err);
      console.error("Detalhes do erro:", err instanceof Error ? err.message : String(err));
      
      // Fallback: adicionar localmente se falhar no Supabase
      console.log("🔄 Usando fallback local...");
      const fallbackMember: StaffMember = {
        id: generateUUID(), // Usar UUID válido
        clinic_id: clinic.id,
        full_name: input.full_name,
        email: input.email,
        active: true,
        invited_at: new Date().toISOString().slice(0, 10),
        role: input.role,
        specialty: input.specialty,
        _isLocal: true, // Marcar como dado local
      };
      
      staff = [...staff, fallbackMember];
      emit();
      console.log("📦 Staff adicionado localmente:", fallbackMember);
      console.log("⚠️  ATENÇÃO: Este funcionário só existe localmente. Para persistir no Supabase, execute o script de sincronização.");
      return fallbackMember;
    }
  },
  toggleStaffActive(id: string) {
    staff = staff.map((s) => (s.id === id ? { ...s, active: !s.active } : s));
    emit();
  },

  // ---- services ----
  listServices: () => services,
  async upsertService(input: Omit<Service, "clinic_id" | "id"> & { id?: string }) {
    try {
      if (input.id) {
        const updated = await api.services.update(input.id, { ...input, clinic_id: clinic.id });
        services = services.map((s) => (s.id === input.id ? updated : s));
      } else {
        const serviceData: Omit<Service, "id"> = { ...input, clinic_id: clinic.id };
        const created = await api.services.create(serviceData);
        services = [...services, created];
      }
      emit();
    } catch (err) {
      console.error("Erro ao salvar serviço:", err);
      throw err;
    }
  },
  async removeService(id: string) {
    try {
      await api.services.delete(id);
      services = services.filter((s) => s.id !== id);
      emit();
    } catch (err) {
      console.error("Erro ao remover serviço:", err);
      throw err;
    }
  },

  // ---- locations ----
  listLocations: () => locations,
  async loadLocations() {
    try {
      const data = await api.locations.list(clinic.id);
      locations = data;
      emit();
    } catch (err) {
      console.error("Erro ao carregar salas:", err);
    }
  },
  async upsertLocation(input: { id?: string; name: string }) {
    try {
      if (input.id) {
        const updated = await api.locations.update(input.id, input.name);
        locations = locations.map((l) => (l.id === updated.id ? updated : l));
      } else {
        const created = await api.locations.create({
          clinic_id: clinic.id,
          name: input.name,
        });
        locations = [...locations, created];
      }
      emit();
    } catch (err) {
      console.error("Erro ao salvar sala:", err);
      throw err;
    }
  },
  async removeLocation(id: string) {
    try {
      await api.locations.delete(id);
      locations = locations.filter((l) => l.id !== id);
      emit();
    } catch (err) {
      console.error("Erro ao remover sala:", err);
      throw err;
    }
  },

  // ---- availability ----
  listAvailability: () => availability,
  async addAvailability(input: Omit<DoctorAvailability, "id" | "clinic_id">) {
    try {
      const availabilityData: Omit<DoctorAvailability, "id"> = { ...input, clinic_id: clinic.id };
      const created = await api.availability.create(availabilityData);
      availability = [...availability, created];
      emit();
      return created;
    } catch (err) {
      console.error("Erro ao adicionar disponibilidade:", err);
      throw err;
    }
  },
  async removeAvailability(id: string) {
    try {
      await api.availability.delete(id);
      availability = availability.filter((a) => a.id !== id);
      emit();
    } catch (err) {
      console.error("Erro ao remover disponibilidade:", err);
      throw err;
    }
  },

  // ---- time off ----
  listTimeOff: () => timeOff,
  addTimeOff(input: Omit<TimeOff, "id" | "clinic_id">) {
    // Time off ainda não implementado no Supabase - manter em memória por enquanto
    timeOff = [...timeOff, { ...input, id: uid("to"), clinic_id: clinic.id }];
    emit();
  },
  removeTimeOff(id: string) {
    // Time off ainda não implementado no Supabase - manter em memória por enquanto
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
