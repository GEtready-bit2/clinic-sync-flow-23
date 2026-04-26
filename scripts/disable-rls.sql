-- Script para desabilitar RLS temporariamente em desenvolvimento
-- Execute isso no painel SQL do Supabase

-- Desabilitar RLS para desenvolvimento
ALTER TABLE public.clinics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_time_off DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;

-- Para reabilitar depois, use:
-- ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
-- ... (repita para todas as tabelas)
