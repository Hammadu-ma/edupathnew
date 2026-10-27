-- ONE-STEP SETUP: paste this whole file into Supabase → SQL Editor → New query → Run.
-- (schema.sql + content_schema.sql combined)

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


-- =====================================================================
-- Content library (videos & books) — run AFTER schema.sql. Safe to re-run.
-- University (optional) · Attachment · Subject · Topic (optional) · Author · Access policy
-- =====================================================================

do $$ begin
  create type public.access_level as enum ('public', 'free', 'premium');
exception when duplicate_object then null; end $$;

-- ---------- Premium flag on profiles (set from SQL / admin tooling) ----------
alter table public.profiles add column if not exists plan text not null default 'free' check (plan in ('free','premium'));
alter table public.profiles add column if not exists premium_until timestamptz;

create or replace function public.protect_profile_columns() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role; new.is_active := old.is_active; new.email := old.email;
    new.plan := old.plan; new.premium_until := old.premium_until;
  end if;
  return new;
end $$;

create or replace function public.has_premium() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.profiles
    where id = auth.uid() and plan = 'premium' and (premium_until is null or premium_until > now()));
$$;

-- public = anyone · free = any signed-in user · premium = subscribers (and admins)
create or replace function public.can_access(a public.access_level) returns boolean
language sql stable security definer set search_path = public as $$
  select case a when 'public' then true when 'free' then auth.uid() is not null else public.has_premium() end;
$$;

-- ---------- Catalog tables ----------
create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  attachment_id uuid not null references public.attachments(id) on delete cascade,
  name text not null,
  default_access public.access_level not null default 'free',
  created_at timestamptz not null default now(),
  unique (attachment_id, name)
);
create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (subject_id, name),
  unique (id, subject_id)
);
create table if not exists public.authors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ---------- Content ----------
create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('video','book')),
  title text not null,
  description text,
  university_id uuid references public.universities(id) on delete set null,  -- optional filter
  attachment_id uuid not null references public.attachments(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  topic_id uuid,
  author_id uuid references public.authors(id) on delete set null,
  thumbnail_url text,
  access public.access_level not null default 'free',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  foreign key (topic_id, subject_id) references public.topics(id, subject_id)  -- topic must belong to the subject
);

-- The actual link / file lives in its own table so Row Level Security can protect it.
-- (Policies can't hide single columns; premium URLs must not sit in a readable table.)
create table if not exists public.content_assets (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null unique references public.content_items(id) on delete cascade,
  source_type text not null check (source_type in ('external','upload')),
  url text,
  file_path text,
  file_size bigint,
  check ((source_type = 'external' and url is not null) or (source_type = 'upload' and file_path is not null))
);

create index if not exists idx_content_subject on public.content_items(subject_id);
create index if not exists idx_content_attachment on public.content_items(attachment_id);
create index if not exists idx_content_author on public.content_items(author_id);

-- ---------- RLS ----------
alter table public.attachments enable row level security;
alter table public.subjects enable row level security;
alter table public.topics enable row level security;
alter table public.authors enable row level security;
alter table public.content_items enable row level security;
alter table public.content_assets enable row level security;

do $$
declare t text;
begin
  foreach t in array array['attachments','subjects','topics','authors'] loop
    execute format('drop policy if exists "read all" on public.%I', t);
    execute format('create policy "read all" on public.%I for select using (true)', t);
    execute format('drop policy if exists "admin write" on public.%I', t);
    execute format('create policy "admin write" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Everyone can see published items in the catalog (locked ones show a lock) ...
drop policy if exists "read published" on public.content_items;
create policy "read published" on public.content_items for select using (is_published or public.is_admin());
drop policy if exists "admin write" on public.content_items;
create policy "admin write" on public.content_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ... but only entitled users can read the link / file location.
drop policy if exists "assets read entitled" on public.content_assets;
create policy "assets read entitled" on public.content_assets for select using (
  public.is_admin() or exists (
    select 1 from public.content_items i where i.id = item_id and i.is_published and public.can_access(i.access)));
drop policy if exists "admin write" on public.content_assets;
create policy "admin write" on public.content_assets for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- Storage ----------
insert into storage.buckets (id, name, public) values ('thumbnails', 'thumbnails', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('content', 'content', false) on conflict (id) do nothing;

drop policy if exists "thumbnails read" on storage.objects;
create policy "thumbnails read" on storage.objects for select using (bucket_id = 'thumbnails');
drop policy if exists "thumbnails admin write" on storage.objects;
create policy "thumbnails admin write" on storage.objects for all to authenticated
  using (bucket_id = 'thumbnails' and public.is_admin()) with check (bucket_id = 'thumbnails' and public.is_admin());

drop policy if exists "content admin write" on storage.objects;
create policy "content admin write" on storage.objects for all to authenticated
  using (bucket_id = 'content' and public.is_admin()) with check (bucket_id = 'content' and public.is_admin());
-- Uploaded files are readable (via signed URL) only if the item they belong to is accessible to the user.
drop policy if exists "content read entitled" on storage.objects;
create policy "content read entitled" on storage.objects for select to authenticated using (
  bucket_id = 'content' and (public.is_admin() or exists (
    select 1 from public.content_assets a join public.content_items i on i.id = a.item_id
    where a.file_path = name and i.is_published and public.can_access(i.access))));

-- Make a user premium:
--   update public.profiles set plan = 'premium', premium_until = now() + interval '1 year' where email = 'x@y.com';
