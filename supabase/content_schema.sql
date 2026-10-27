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
