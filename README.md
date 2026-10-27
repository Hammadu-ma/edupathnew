# Bloom Learning (EduPath)

React + Vite + Tailwind v4 front end on a Supabase backend (Auth, Postgres with RLS, Storage).

## Demo mode (no Supabase needed)
With no `.env.local`, the app runs on a built-in mock backend with hardcoded data (saved in localStorage):
`student@demo.com / demo1234` and `admin@demo.com / admin1234`. Add your Supabase keys later and it switches automatically.

## Setup (real Supabase)
1. Create a project at https://supabase.com.
2. SQL Editor → run `supabase/schema.sql`, then optionally `supabase/seed.sql` for demo data.
2b. Then run `supabase/content_schema.sql` (videos/books library: attachments, subjects, topics, authors, access policies).
3. Authentication → URL Configuration: add `http://localhost:3000` (and your production URL) to **Redirect URLs** — needed for password recovery links (`/auth/reset`). Optionally turn off "Confirm email" for local testing.
4. `cp .env.example .env.local` and fill in the project URL + anon key (Project Settings → API).
5. `npm install && npm run dev`
6. Sign up in the app, then make yourself admin in the SQL editor:
   `update public.profiles set role='admin', onboarding_complete=true where email='you@example.com';`

## Academic hierarchy
University → Program/Department → Study year → (optional) Semester/Bundle → Course → Resources, Past exams, Questions.
Year and term are optional and free-text, so institutions with different systems (levels, trimesters, module bundles, no years) all fit.
A course without a year/term applies to the whole program/year.

## Notes
- Row Level Security: students read published content and manage only their own bookmarks/attempts/goals; only admins write content. Students cannot change their own role.
- Uploaded files live in the private `resources` bucket (served via signed URLs); avatars in the public `avatars` bucket.
- Deleting a record does not delete its uploaded files from storage.
