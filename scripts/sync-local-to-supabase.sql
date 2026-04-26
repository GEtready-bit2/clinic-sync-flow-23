-- Script para sincronizar dados locais com o Supabase
-- Execute isso no painel SQL do Supabase após adicionar funcionários localmente

-- Primeiro, verifique quais médicos existem localmente mas não no Supabase
-- Você precisará inserir manualmente os profiles que foram criados localmente

-- Exemplo de como inserir um médico que foi criado localmente:
-- Substitua os valores pelos dados reais dos seus médicos locais

INSERT INTO public.profiles (id, clinic_id, full_name, email, active, created_at)
VALUES 
  ('44ac9a3c-6843-4870-bf12-f903492776ec', 'c0f89fbe-48b4-4d9f-a718-2031fc98c587', 'Dr. João Silva', 'joao@clinica.local', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insira o user role correspondente
INSERT INTO public.user_roles (user_id, clinic_id, role)
VALUES 
  ('44ac9a3c-6843-4870-bf12-f903492776ec', 'c0f89fbe-48b4-4d9f-a718-2031fc98c587', 'doctor')
ON CONFLICT (user_id, clinic_id, role) DO NOTHING;

-- Verifique se os médicos agora existem
SELECT p.id, p.full_name, p.email, ur.role 
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
WHERE p.clinic_id = 'c0f89fbe-48b4-4d9f-a718-2031fc98c587' AND ur.role = 'doctor';
