-- ============================================================================
-- NexusPulse — Clinical Scheduling SaaS
-- Multi-tenant Postgres schema with strict Row Level Security (RLS).
--
-- Tenancy model:
--   Every domain table carries a clinic_id FK. RLS policies enforce that an
--   authenticated user can ONLY access rows where clinic_id matches the
--   clinic_id stored on their profile. Patients additionally can only access
--   their own appointments / records.
--
-- Roles (separate user_roles table — never store roles on profiles):
--   super_admin | clinic_admin | doctor | receptionist | patient
--
-- Run order: extensions → enums → tables → helper fns → RLS policies → triggers
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------
create type public.app_role as enum (
  'super_admin', 'clinic_admin', 'doctor', 'receptionist', 'patient'
);

create type public.appointment_status as enum (
  'booked', 'confirmed', 'checked_in', 'in_progress',
  'completed', 'cancelled', 'no_show'
);

create type public.weekday as enum (
  'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'
);

-- ---------------------------------------------------------------------------
-- CORE TENANT
-- ---------------------------------------------------------------------------
create table public.clinics (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,
  timezone     text not null default 'UTC',
  phone        text,
  address      text,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Profiles extend auth.users with clinic binding + display info.
-- Patients of a clinic also live here (clinic_id = their clinic).
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  clinic_id    uuid references public.clinics(id) on delete cascade,
  full_name    text not null,
  email        text not null,
  phone        text,
  avatar_url   text,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Roles in a SEPARATE table — prevents privilege escalation.
create table public.user_roles (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  clinic_id    uuid references public.clinics(id) on delete cascade,
  role         public.app_role not null,
  unique (user_id, clinic_id, role)
);

-- ---------------------------------------------------------------------------
-- CLINICAL CONFIG
-- ---------------------------------------------------------------------------
create table public.locations (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null references public.clinics(id) on delete cascade,
  name         text not null,            -- e.g. "Room 3", "Procedure Suite A"
  description  text,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

create table public.services (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references public.clinics(id) on delete cascade,
  name          text not null,
  description   text,
  duration_min  integer not null check (duration_min between 5 and 480),
  color         text,                    -- hex for calendar tag
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Doctor recurring weekly availability per location.
create table public.doctor_availability (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references public.clinics(id) on delete cascade,
  doctor_id     uuid not null references public.profiles(id) on delete cascade,
  location_id   uuid not null references public.locations(id) on delete cascade,
  weekday       public.weekday not null,
  start_time    time not null,
  end_time      time not null,
  check (end_time > start_time)
);

-- Vacations / blocked overrides (windows where doctor is unavailable
-- regardless of recurring schedule).
create table public.doctor_time_off (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null references public.clinics(id) on delete cascade,
  doctor_id    uuid not null references public.profiles(id) on delete cascade,
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  reason       text,
  check (ends_at > starts_at)
);

-- ---------------------------------------------------------------------------
-- PATIENTS  (clinical patient record — strictly bound to clinic_id)
-- ---------------------------------------------------------------------------
create table public.patients (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references public.clinics(id) on delete cascade,
  -- Optional: link to an auth user if the patient self-books online.
  user_id         uuid references auth.users(id) on delete set null,
  full_name       text not null,
  date_of_birth   date,
  sex             text,
  email           text,
  phone           text,
  address         text,
  allergies       text,
  medical_history text,
  created_at      timestamptz not null default now()
);

create index on public.patients (clinic_id);
create index on public.patients (user_id);

-- ---------------------------------------------------------------------------
-- APPOINTMENTS
-- ---------------------------------------------------------------------------
create table public.appointments (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references public.clinics(id) on delete cascade,
  patient_id    uuid not null references public.patients(id) on delete restrict,
  doctor_id     uuid not null references public.profiles(id) on delete restrict,
  service_id    uuid not null references public.services(id) on delete restrict,
  location_id   uuid not null references public.locations(id) on delete restrict,
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  status        public.appointment_status not null default 'booked',
  notes         text,                  -- short booking note (not EHR)
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index on public.appointments (clinic_id, starts_at);
create index on public.appointments (doctor_id, starts_at);
create index on public.appointments (location_id, starts_at);
create index on public.appointments (patient_id);

-- Hard guarantee: a doctor cannot be in two places at once.
-- A physical room cannot host two appointments at once.
-- (Excludes cancelled / no_show.)
create extension if not exists btree_gist;

alter table public.appointments
  add constraint no_double_book_doctor
  exclude using gist (
    doctor_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status not in ('cancelled', 'no_show'));

alter table public.appointments
  add constraint no_double_book_room
  exclude using gist (
    location_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status not in ('cancelled', 'no_show'));

-- EHR-light: clinical notes per visit. Doctor-only readable.
create table public.appointment_notes (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references public.clinics(id) on delete cascade,
  appointment_id  uuid not null references public.appointments(id) on delete cascade,
  author_id       uuid not null references public.profiles(id) on delete restrict,
  body            text not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index on public.appointment_notes (appointment_id);

-- ---------------------------------------------------------------------------
-- SECURITY DEFINER HELPERS  (avoid RLS recursion)
-- ---------------------------------------------------------------------------
create or replace function public.current_clinic_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select clinic_id from public.profiles where id = auth.uid()
$$;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create or replace function public.is_clinic_staff(_user_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id
      and role in ('clinic_admin', 'doctor', 'receptionist')
  )
$$;

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Enable on every domain table. Default deny.
-- ---------------------------------------------------------------------------
alter table public.clinics              enable row level security;
alter table public.profiles             enable row level security;
alter table public.user_roles           enable row level security;
alter table public.locations            enable row level security;
alter table public.services             enable row level security;
alter table public.doctor_availability  enable row level security;
alter table public.doctor_time_off      enable row level security;
alter table public.patients             enable row level security;
alter table public.appointments         enable row level security;
alter table public.appointment_notes    enable row level security;

-- ----- clinics -------------------------------------------------------------
create policy "super admin sees all clinics"
  on public.clinics for select to authenticated
  using (public.has_role(auth.uid(), 'super_admin'));

create policy "members see own clinic"
  on public.clinics for select to authenticated
  using (id = public.current_clinic_id());

create policy "super admin manages clinics"
  on public.clinics for all to authenticated
  using (public.has_role(auth.uid(), 'super_admin'))
  with check (public.has_role(auth.uid(), 'super_admin'));

-- ----- profiles ------------------------------------------------------------
create policy "see profiles in same clinic"
  on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or clinic_id = public.current_clinic_id()
    or public.has_role(auth.uid(), 'super_admin')
  );

create policy "user updates own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "clinic admin manages clinic profiles"
  on public.profiles for all to authenticated
  using (
    public.has_role(auth.uid(), 'clinic_admin')
    and clinic_id = public.current_clinic_id()
  )
  with check (
    public.has_role(auth.uid(), 'clinic_admin')
    and clinic_id = public.current_clinic_id()
  );

-- ----- user_roles ----------------------------------------------------------
create policy "user reads own roles"
  on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'super_admin'));

create policy "clinic admin manages roles in own clinic"
  on public.user_roles for all to authenticated
  using (
    public.has_role(auth.uid(), 'clinic_admin')
    and clinic_id = public.current_clinic_id()
    and role <> 'super_admin'
  )
  with check (
    public.has_role(auth.uid(), 'clinic_admin')
    and clinic_id = public.current_clinic_id()
    and role <> 'super_admin'
  );

-- ----- generic clinic-scoped policies (locations, services, availability) --
create policy "clinic read locations"
  on public.locations for select to authenticated
  using (clinic_id = public.current_clinic_id());
create policy "clinic admin write locations"
  on public.locations for all to authenticated
  using (public.has_role(auth.uid(), 'clinic_admin')
         and clinic_id = public.current_clinic_id())
  with check (clinic_id = public.current_clinic_id());

create policy "clinic read services"
  on public.services for select to authenticated
  using (clinic_id = public.current_clinic_id());
create policy "clinic admin write services"
  on public.services for all to authenticated
  using (public.has_role(auth.uid(), 'clinic_admin')
         and clinic_id = public.current_clinic_id())
  with check (clinic_id = public.current_clinic_id());

create policy "clinic read doctor availability"
  on public.doctor_availability for select to authenticated
  using (clinic_id = public.current_clinic_id());
create policy "doctor or admin writes availability"
  on public.doctor_availability for all to authenticated
  using (
    clinic_id = public.current_clinic_id()
    and (doctor_id = auth.uid() or public.has_role(auth.uid(), 'clinic_admin'))
  )
  with check (
    clinic_id = public.current_clinic_id()
    and (doctor_id = auth.uid() or public.has_role(auth.uid(), 'clinic_admin'))
  );

create policy "clinic read time off"
  on public.doctor_time_off for select to authenticated
  using (clinic_id = public.current_clinic_id());
create policy "doctor or admin writes time off"
  on public.doctor_time_off for all to authenticated
  using (
    clinic_id = public.current_clinic_id()
    and (doctor_id = auth.uid() or public.has_role(auth.uid(), 'clinic_admin'))
  )
  with check (
    clinic_id = public.current_clinic_id()
    and (doctor_id = auth.uid() or public.has_role(auth.uid(), 'clinic_admin'))
  );

-- ----- patients ------------------------------------------------------------
-- Staff sees all clinic patients; a patient sees only their own record.
create policy "staff read clinic patients"
  on public.patients for select to authenticated
  using (
    clinic_id = public.current_clinic_id()
    and public.is_clinic_staff(auth.uid())
  );
create policy "patient reads own record"
  on public.patients for select to authenticated
  using (user_id = auth.uid());
create policy "staff manages clinic patients"
  on public.patients for all to authenticated
  using (
    clinic_id = public.current_clinic_id()
    and public.is_clinic_staff(auth.uid())
  )
  with check (clinic_id = public.current_clinic_id());

-- ----- appointments --------------------------------------------------------
create policy "staff read clinic appointments"
  on public.appointments for select to authenticated
  using (
    clinic_id = public.current_clinic_id()
    and public.is_clinic_staff(auth.uid())
  );
create policy "patient reads own appointments"
  on public.appointments for select to authenticated
  using (
    patient_id in (select id from public.patients where user_id = auth.uid())
  );
create policy "staff manages appointments"
  on public.appointments for all to authenticated
  using (
    clinic_id = public.current_clinic_id()
    and public.is_clinic_staff(auth.uid())
  )
  with check (clinic_id = public.current_clinic_id());
create policy "patient books own appointment"
  on public.appointments for insert to authenticated
  with check (
    patient_id in (select id from public.patients where user_id = auth.uid())
  );

-- ----- appointment_notes (EHR-light: doctors only) -------------------------
create policy "doctor reads clinic notes"
  on public.appointment_notes for select to authenticated
  using (
    clinic_id = public.current_clinic_id()
    and public.has_role(auth.uid(), 'doctor')
  );
create policy "doctor writes own notes"
  on public.appointment_notes for all to authenticated
  using (
    clinic_id = public.current_clinic_id()
    and public.has_role(auth.uid(), 'doctor')
    and author_id = auth.uid()
  )
  with check (
    clinic_id = public.current_clinic_id()
    and author_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- TRIGGERS
-- ---------------------------------------------------------------------------
create or replace function public.tg_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

create trigger appointments_touch before update on public.appointments
  for each row execute function public.tg_touch_updated_at();

create trigger appointment_notes_touch before update on public.appointment_notes
  for each row execute function public.tg_touch_updated_at();
