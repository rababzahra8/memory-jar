# Digital Memory Jar - Supabase Setup

The app now uses **Supabase** as its persistent backend. Follow these three steps.

## 1. Create the table + RLS policies

Open your Supabase project -> **SQL Editor** -> New query, paste and run:

```sql
-- UUID generator
create extension if not exists "uuid-ossp" with schema extensions;

-- memories table
create table if not exists public.memories (
  id uuid primary key default uuid_generate_v4(),
  text text not null,
  type text not null default 'secret',
  author text,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- privileges
grant select, insert on public.memories to anon;
grant select, insert, delete on public.memories to authenticated;

-- Row Level Security
alter table public.memories enable row level security;

-- policies: anonymous public read + insert
drop policy if exists "Public read memories"   on public.memories;
drop policy if exists "Public insert memories" on public.memories;

create policy "Public read memories"
  on public.memories for select to anon using (archived = false);

create policy "Public insert memories"
  on public.memories for insert to anon with check (char_length(text) between 1 and 2000);
```

**Existing projects** — run this migration if the table already exists:

```sql
alter table public.memories
  add column if not exists archived boolean not null default false;

drop policy if exists "Public read memories" on public.memories;
create policy "Public read memories"
  on public.memories for select to anon using (archived = false);
```

## Admin access

Add to `.env.local` (and Vercel env):

```
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=your-secure-password
SUPABASE_SECRET_KEY=sb_secret_...
```

Open `/admin` to sign in, view all notes, archive them (hidden from the jar), or delete permanently.

## 2. Add credentials to `/app/.env`

Append these two lines to `/app/.env` (values from Supabase Dashboard -> Project Settings -> API):

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...your_anon_public_key...
```

## 3. Restart

```
sudo supervisorctl restart nextjs
```

The jar will now read/write memories from Supabase. If credentials are missing, the app automatically falls back to localStorage so nothing breaks in dev.
