// Mock auth — single source of truth for the demo "logged in" user.
// Swap with Supabase auth + RLS later; the schema is already designed for it.
import { useSyncExternalStore } from "react";
import type { Profile, Role } from "./types";
import { profiles } from "./mock-data";

const KEY = "nexuspulse.session";

type Session = { userId: string } | null;

const listeners = new Set<() => void>();
let session: Session = readInitial();

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
  listeners.forEach((l) => l());
}

export const auth = {
  signInAs(role: Role) {
    const profile = profiles.find((p) => p.role === role);
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
  current(): Profile | null {
    if (!session) return null;
    return profiles.find((p) => p.id === session?.userId) ?? null;
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useCurrentUser(): Profile | null {
  return useSyncExternalStore(
    (l) => {
      const unsub = auth.subscribe(l);
      return () => unsub();
    },
    () => auth.current(),
    () => null,
  );
}
