-- Script para desabilitar RLS - COPIE E COLE ISSO DIRETO NO PAINEL SUPABASE

-- Desabilitar RLS nas tabelas principais
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability DISABLE ROW LEVEL SECURITY;

-- Verificar se foi desabilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN (
  'profiles', 'user_roles', 'services', 'locations', 
  'patients', 'appointments', 'doctor_availability'
);
