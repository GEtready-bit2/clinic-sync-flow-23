// Mock auth — single source of truth for the demo "logged in" user.
// Swap with Supabase auth + RLS later; the schema is already designed for it.
import { useSyncExternalStore } from "react";
import type { Profile, Role, UserRole } from "./types";
import { profiles } from "./mock-data";

const KEY = "nexuspulse.session";

// Mock user roles data - em produção isso viria da tabela user_roles
const mockUserRoles: { userId: string; role: Role }[] = [
  { userId: "u_admin", role: "clinic_admin" },
  { userId: "u_doc", role: "doctor" },
  { userId: "u_recep", role: "receptionist" },
];

type Session = { userId: string } | null;

const listeners = new Set<() => void>();
let session: Session = readInitial();
let currentUserCache: (Profile & { role: Role }) | null = null;

function readInitial(): Session {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function emit() {
  // Limpa o cache quando o estado muda
  currentUserCache = null;
  listeners.forEach((l) => l());
}

export const auth = {
  signInAs(role: Role) {
    const userRole = mockUserRoles.find((ur) => ur.role === role);
    const profile = profiles.find((p) => p.id === userRole?.userId);
    if (!profile) return;
    session = { userId: profile.id };
    window.localStorage.setItem(KEY, JSON.stringify(session));
    emit();
  },
  signOut() {
    session = null;
    window.localStorage.removeItem(KEY);
    emit();
  },
  current(): (Profile & { role: Role }) | null {
    if (!session) return null;
    
    // Retorna cache se existir
    if (currentUserCache) return currentUserCache;
    
    const profile = profiles.find((p) => p.id === session?.userId);
    if (!profile) return null;
    
    const userRole = mockUserRoles.find((ur) => ur.userId === profile.id);
    if (!userRole) return null;
    
    // Cria e cacheia o resultado
    currentUserCache = { ...profile, role: userRole.role };
    return currentUserCache;
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useCurrentUser(): (Profile & { role: Role }) | null {
  return useSyncExternalStore(
    (l) => {
      const unsub = auth.subscribe(l);
      return () => unsub();
    },
    () => auth.current(),
    () => null,
  );
}
