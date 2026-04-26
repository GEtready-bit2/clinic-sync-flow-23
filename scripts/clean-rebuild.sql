-- Script completo para limpar e reconstruir sem constraints
-- Execute isso no painel SQL do Supabase

-- 1. Remover todas as foreign keys
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_clinic_id_fkey;
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey;
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_doctor_id_fkey;
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_service_id_fkey;
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_location_id_fkey;

ALTER TABLE public.doctor_availability DROP CONSTRAINT IF EXISTS doctor_availability_clinic_id_fkey;
ALTER TABLE public.doctor_availability DROP CONSTRAINT IF EXISTS doctor_availability_doctor_id_fkey;

ALTER TABLE public.patients DROP CONSTRAINT IF EXISTS patients_clinic_id_fkey;
ALTER TABLE public.services DROP CONSTRAINT IF EXISTS services_clinic_id_fkey;
ALTER TABLE public.locations DROP CONSTRAINT IF EXISTS locations_clinic_id_fkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_clinic_id_fkey;

-- 2. Remover todas as tabelas
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.doctor_availability CASCADE;
DROP TABLE IF EXISTS public.patients CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.clinics CASCADE;

-- 3. Criar tabelas SEM foreign keys
CREATE TABLE public.clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id text NOT NULL, -- Sem foreign key, apenas texto
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  role text NOT NULL, -- 'doctor', 'receptionist', 'clinic_admin', 'patient'
  specialty text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id text NOT NULL, -- Sem foreign key
  full_name text NOT NULL,
  email text,
  phone text,
  date_of_birth date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id text NOT NULL, -- Sem foreign key
  name text NOT NULL,
  description text,
  duration_min integer NOT NULL,
  color text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id text NOT NULL, -- Sem foreign key
  name text NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.doctor_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id text NOT NULL, -- Sem foreign key
  doctor_id text NOT NULL, -- Sem foreign key
  weekday text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id text NOT NULL, -- Sem foreign key
  patient_id text NOT NULL, -- Sem foreign key
  doctor_id text NOT NULL, -- Sem foreign key
  service_id text NOT NULL, -- Sem foreign key
  location_id text NOT NULL, -- Sem foreign key
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'booked',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 4. Inserir dados iniciais
INSERT INTO public.clinics (id, name, slug, timezone) VALUES 
('c0f89fbe-48b4-4d9f-a718-2031fc98c587', 'Clínica Demo', 'clinica-demo', 'America/Sao_Paulo');

INSERT INTO public.profiles (clinic_id, full_name, email, role, specialty) VALUES 
('c0f89fbe-48b4-4d9f-a718-2031fc98c587', 'Administrador', 'admin@clinica.local', 'clinic_admin', NULL),
('c0f89fbe-48b4-4d9f-a718-2031fc98c587', 'Dr. João Silva', 'joao@clinica.local', 'doctor', 'Clínica Geral'),
('c0f89fbe-48b4-4d9f-a718-2031fc98c587', 'Recepcionista', 'recepcao@clinica.local', 'receptionist', NULL);

INSERT INTO public.patients (clinic_id, full_name, email, phone) VALUES 
('c0f89fbe-48b4-4d9f-a718-2031fc98c587', 'Paciente Teste', 'paciente@clinica.local', '11999999999');

INSERT INTO public.services (clinic_id, name, description, duration_min, color) VALUES 
('c0f89fbe-48b4-4d9f-a718-2031fc98c587', 'Consulta', 'Consulta médica geral', 30, '#3b82f6'),
('c0f89fbe-48b4-4d9f-a718-2031fc98c587', 'Retorno', 'Consulta de retorno', 15, '#10b981');

INSERT INTO public.locations (clinic_id, name, description) VALUES 
('c0f89fbe-48b4-4d9f-a718-2031fc98c587', 'Consultório 1', 'Consultório médico equipado'),
('c0f89fbe-48b4-4d9f-a718-2031fc98c587', 'Consultório 2', 'Consultório médico equipado');

-- Verificar se tudo foi criado corretamente
SELECT 'clinics' as table_name, COUNT(*) as count FROM public.clinics
UNION ALL
SELECT 'profiles' as table_name, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'patients' as table_name, COUNT(*) as count FROM public.patients
UNION ALL
SELECT 'services' as table_name, COUNT(*) as count FROM public.services
UNION ALL
SELECT 'locations' as table_name, COUNT(*) as count FROM public.locations;
