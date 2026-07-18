-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- 1. Profiles: one row per anonymous auth user, holds their chosen display name
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

-- 2. Rooms / channels
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- 3. Messages
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_room_id_created_at_idx on messages (room_id, created_at);

-- Seed a couple of starter rooms
insert into rooms (name) values ('general') on conflict (name) do nothing;
insert into rooms (name) values ('random') on conflict (name) do nothing;

-- ---------- Row Level Security ----------
alter table profiles enable row level security;
alter table rooms enable row level security;
alter table messages enable row level security;

-- Profiles: anyone signed in can read all profiles (needed to show display names),
-- but can only insert/update their own row.
create policy "profiles are readable by any signed-in user"
  on profiles for select
  to authenticated
  using (true);

create policy "users can insert their own profile"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

-- Rooms: readable by any signed-in user. No public inserts (add rooms via SQL editor for now).
create policy "rooms are readable by any signed-in user"
  on rooms for select
  to authenticated
  using (true);

-- Messages: readable by any signed-in user, insertable only as yourself.
create policy "messages are readable by any signed-in user"
  on messages for select
  to authenticated
  using (true);

create policy "users can insert their own messages"
  on messages for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ---------- Realtime ----------
-- Enable realtime broadcasts for the messages table
alter publication supabase_realtime add table messages;
