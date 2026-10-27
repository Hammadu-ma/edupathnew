-- =====================================================================
-- Bloom Learning — Supabase schema
-- Run this whole file once in: Supabase Dashboard → SQL Editor → New query
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS).
-- =====================================================================
create extension if not exists pgcrypto;

-- ---------- 1. Academic hierarchy ----------
-- University → Program/Department → Study Year → (optional) Term/Bundle → Courses
-- Every level below "program" is optional and uses free-text names, so any
-- academic system fits (Year 2, Level 200, Freshman, Semester, Trimester, Module bundle...).
create table if not exists public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  country text,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  name text not null,
  code text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.study_years (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- "Term" = semester, trimester, quarter, or any custom course bundle. Optional.
create table if not exists public.terms (
  id uuid primary key default gen_random_uuid(),
  study_year_id uuid not null references public.study_years(id) on delete cascade,
  name text not null,
  kind text not null default 'semester',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  study_year_id uuid references public.study_years(id) on delete set null,
  term_id uuid references public.terms(id) on delete set null,
  code text not null,
  title text not null,
  description text,
  credits numeric,
  cover_color text not null default '#8b5cf6',
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- 2. Content ----------
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  type text not null default 'notes'
    check (type in ('notes','book','pdf','video','slides','guide','link','other')),
  file_path text,            -- path inside the private "resources" storage bucket
  external_url text,         -- for videos / links
  file_size bigint,
  is_published boolean not null default true,
  uploaded_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.past_exams (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  exam_year int not null,
  exam_type text not null default 'final'
    check (exam_type in ('midterm','final','quiz','supplementary','practice')),
  semester_label text,
  file_path text,
  answers_file_path text,
  has_answers boolean not null default false,
  has_explanations boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  exam_id uuid references public.past_exams(id) on delete set null,
  question_text text not null,
  options jsonb not null,                 -- [{ "id": "a", "text": "..." }, ...]
  correct_option_id text not null,
  explanation text,
  difficulty text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  points int not null default 1,
  order_index int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- 3. Users & personal data ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  role text not null default 'student' check (role in ('student','admin')),
  is_active boolean not null default true,
  university_id uuid references public.universities(id) on delete set null,
  program_id uuid references public.programs(id) on delete set null,
  study_year_id uuid references public.study_years(id) on delete set null,
  term_id uuid references public.terms(id) on delete set null,
  onboarding_complete boolean not null default false,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('course','resource','exam','question')),
  item_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  exam_id uuid references public.past_exams(id) on delete set null,
  mode text not null default 'practice' check (mode in ('practice','exam')),
  question_ids uuid[] not null default '{}',
  answers jsonb not null default '{}'::jsonb,
  score int not null default 0,
  total_points int not null default 0,
  time_spent_seconds int,
  started_at timestamptz not null default now(),
  completed_at timestamptz not null default now()
);

create table if not exists public.study_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  resource_id uuid references public.resources(id) on delete cascade,
  action text not null check (action in ('opened','downloaded','completed','quiz_attempted')),
  created_at timestamptz not null default now()
);

create table if not exists public.resource_completions (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, resource_id)
);

create table if not exists public.learning_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  kind text not null default 'custom' check (kind in ('resources','quizzes','custom')),
  target int not null default 1,
  due_date date,
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_programs_uni on public.programs(university_id);
create index if not exists idx_years_program on public.study_years(program_id);
create index if not exists idx_terms_year on public.terms(study_year_id);
create index if not exists idx_courses_program on public.courses(program_id);
create index if not exists idx_resources_course on public.resources(course_id);
create index if not exists idx_exams_course on public.past_exams(course_id);
create index if not exists idx_questions_course on public.questions(course_id);
create index if not exists idx_activity_user on public.study_activity(user_id, created_at desc);
create index if not exists idx_attempts_user on public.quiz_attempts(user_id, completed_at desc);

-- ---------- 4. Helpers, triggers ----------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and is_active);
$$;

-- Create a profile row whenever someone signs up
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Students can never change their own role / active flag / email.
-- (SQL editor sessions have auth.uid() = null, so you can still promote admins there.)
create or replace function public.protect_profile_columns() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
    new.is_active := old.is_active;
    new.email := old.email;
  end if;
  return new;
end $$;

drop trigger if exists protect_profile_columns on public.profiles;
create trigger protect_profile_columns before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- Per-course counts for the UI (respects RLS of the caller)
create or replace view public.course_stats with (security_invoker = true) as
select c.id as course_id,
  (select count(*) from public.resources r where r.course_id = c.id and r.is_published) as resource_count,
  (select count(*) from public.past_exams e where e.course_id = c.id and e.is_published) as exam_count,
  (select count(*) from public.questions q where q.course_id = c.id and q.is_published) as question_count
from public.courses c;

-- ---------- 5. Row Level Security ----------
alter table public.universities enable row level security;
alter table public.programs enable row level security;
alter table public.study_years enable row level security;
alter table public.terms enable row level security;
alter table public.courses enable row level security;
alter table public.resources enable row level security;
alter table public.past_exams enable row level security;
alter table public.questions enable row level security;
alter table public.profiles enable row level security;
alter table public.bookmarks enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.study_activity enable row level security;
alter table public.resource_completions enable row level security;
alter table public.learning_goals enable row level security;

do $$
declare t text;
begin
  -- structure tables: everyone signed-in reads active rows, admins manage everything
  foreach t in array array['universities','programs','study_years','terms'] loop
    execute format('drop policy if exists "read active" on public.%I', t);
    execute format('create policy "read active" on public.%I for select to authenticated using (is_active or public.is_admin())', t);
    execute format('drop policy if exists "admin write" on public.%I', t);
    execute format('create policy "admin write" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
  -- content tables: published rows readable, admins manage everything
  foreach t in array array['courses','resources','past_exams','questions'] loop
    execute format('drop policy if exists "read published" on public.%I', t);
    execute format('create policy "read published" on public.%I for select to authenticated using (is_published or public.is_admin())', t);
    execute format('drop policy if exists "admin write" on public.%I', t);
    execute format('create policy "admin write" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
  -- personal tables: owner only (+ admins can read for dashboards)
  foreach t in array array['bookmarks','quiz_attempts','study_activity','resource_completions','learning_goals'] loop
    execute format('drop policy if exists "owner all" on public.%I', t);
    execute format('create policy "owner all" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
  foreach t in array array['quiz_attempts','study_activity'] loop
    execute format('drop policy if exists "admin read" on public.%I', t);
    execute format('create policy "admin read" on public.%I for select to authenticated using (public.is_admin())', t);
  end loop;
end $$;

drop policy if exists "profile read" on public.profiles;
create policy "profile read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
drop policy if exists "profile update" on public.profiles;
create policy "profile update" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- ---------- 6. Storage ----------
insert into storage.buckets (id, name, public) values ('resources', 'resources', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

drop policy if exists "resources read" on storage.objects;
create policy "resources read" on storage.objects for select to authenticated
  using (bucket_id = 'resources');
drop policy if exists "resources admin write" on storage.objects;
create policy "resources admin write" on storage.objects for all to authenticated
  using (bucket_id = 'resources' and public.is_admin())
  with check (bucket_id = 'resources' and public.is_admin());

drop policy if exists "avatars read" on storage.objects;
create policy "avatars read" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "avatars own write" on storage.objects;
create policy "avatars own write" on storage.objects for all to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- 7. Make yourself an admin ----------
-- 1) Sign up in the app with your email.  2) Run:
--    update public.profiles set role = 'admin', onboarding_complete = true where email = 'you@example.com';
