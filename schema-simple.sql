-- Schema simplificado para desenvolvimento rápido
-- Sem RLS, sem constraints complexas, focado em funcionar

-- Limpar tudo
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.doctor_availability CASCADE;
DROP TABLE IF EXISTS public.patients CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.clinics CASCADE;

-- Tabelas simples
CREATE TABLE public.clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id),
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
  clinic_id uuid REFERENCES clinics(id),
  full_name text NOT NULL,
  email text,
  phone text,
  date_of_birth date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id),
  name text NOT NULL,
  description text,
  duration_min integer NOT NULL,
  color text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id),
  name text NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.doctor_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id),
  doctor_id uuid REFERENCES profiles(id),
  weekday text NOT NULL, -- 'mon', 'tue', etc
  start_time time NOT NULL,
  end_time time NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id),
  patient_id uuid REFERENCES patients(id),
  doctor_id uuid REFERENCES profiles(id),
  service_id uuid REFERENCES services(id),
  location_id uuid REFERENCES locations(id),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'booked', -- 'booked', 'cancelled', 'completed', 'no_show'
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Inserir clínica demo
INSERT INTO public.clinics (id, name, slug, timezone) VALUES 
('c0f89fbe-48b4-4d9f-a718-2031fc98c587', 'Clínica Demo', 'clinica-demo', 'America/Sao_Paulo');

-- Inserir perfis iniciais
INSERT INTO public.profiles (clinic_id, full_name, email, role, specialty) VALUES 
('c0f89fbe-48b4-4d9f-a718-2031fc98c587', 'Administrador', 'admin@clinica.local', 'clinic_admin', NULL),
('c0f89fbe-48b4-4d9f-a718-2031fc98c587', 'Dr. João Silva', 'joao@clinica.local', 'doctor', 'Clínica Geral'),
('c0f89fbe-48b4-4d9f-a718-2031fc98c587', 'Recepcionista', 'recepcao@clinica.local', 'receptionist', NULL);

-- Inserir serviços básicos
INSERT INTO public.services (clinic_id, name, description, duration_min, color) VALUES 
('c0f89fbe-48b4-4d9f-a718-2031fc98c587', 'Consulta', 'Consulta médica geral', 30, '#3b82f6'),
('c0f89fbe-48b4-4d9f-a718-2031fc98c587', 'Retorno', 'Consulta de retorno', 15, '#10b981');

-- Inserir localidades
INSERT INTO public.locations (clinic_id, name, description) VALUES 
('c0f89fbe-48b4-4d9f-a718-2031fc98c587', 'Consultório 1', 'Consultório médico equipado'),
('c0f89fbe-48b4-4d9f-a718-2031fc98c587', 'Consultório 2', 'Consultório médico equipado');
