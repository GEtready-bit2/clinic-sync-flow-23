-- Script para resolver problema de auth.users constraint
-- Execute isso no painel SQL do Supabase

-- Opção 1: Desabilitar temporariamente a foreign key constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Opção 2: Criar usuários na auth.users (mais complexo, requer service role)
-- INSERT INTO auth.users (id, email, email_confirmed_at, phone, phone_confirmed_at, created_at, updated_at)
-- VALUES 
--   ('44ac9a3c-6843-4870-bf12-f903492776ec', 'joao@clinica.local', NOW(), NULL, NULL, NOW(), NOW());

-- Agora pode inserir os profiles sem a constraint
INSERT INTO public.profiles (id, clinic_id, full_name, email, active, created_at)
VALUES 
  ('44ac9a3c-6843-4870-bf12-f903492776ec', 'c0f89fbe-48b4-4d9f-a718-2031fc98c587', 'Dr. João Silva', 'joao@clinica.local', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insira o user role correspondente
INSERT INTO public.user_roles (user_id, clinic_id, role)
VALUES 
  ('44ac9a3c-6843-4870-bf12-f903492776ec', 'c0f89fbe-48b4-4d9f-a718-2031fc98c587', 'doctor')
ON CONFLICT (user_id, clinic_id, role) DO NOTHING;

-- Se quiser reabilitar a constraint depois (opcional)
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey 
-- FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Verifique se os médicos agora existem
SELECT p.id, p.full_name, p.email, ur.role 
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
WHERE p.clinic_id = 'c0f89fbe-48b4-4d9f-a718-2031fc98c587' AND ur.role = 'doctor';
