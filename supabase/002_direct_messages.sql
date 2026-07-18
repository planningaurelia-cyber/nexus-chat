-- Phase 2 migration: adds one-on-one Direct Messages
-- Run this in Supabase SQL Editor AFTER schema.sql has already been run once.

-- 1. Conversations: one row per unique pair of people
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users (id) on delete cascade,
  user_b uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint different_users check (user_a <> user_b)
);

-- Prevent duplicate conversations between the same two people regardless of order
create unique index if not exists conversations_pair_unique
  on conversations (least(user_a, user_b), greatest(user_a, user_b));

alter table conversations enable row level security;

create policy "conversations readable by participants"
  on conversations for select
  to authenticated
  using (auth.uid() = user_a or auth.uid() = user_b);

create policy "users can create conversations they belong to"
  on conversations for insert
  to authenticated
  with check (auth.uid() = user_a or auth.uid() = user_b);

-- 2. Messages: allow belonging to a conversation instead of a room
alter table messages alter column room_id drop not null;

alter table messages
  add column if not exists conversation_id uuid references conversations (id) on delete cascade;

alter table messages
  add constraint messages_thread_check
  check (
    (room_id is not null and conversation_id is null) or
    (room_id is null and conversation_id is not null)
  );

create index if not exists messages_conversation_id_created_at_idx
  on messages (conversation_id, created_at);

-- 3. Replace old blanket policies with room-aware / DM-aware versions
drop policy if exists "messages are readable by any signed-in user" on messages;
drop policy if exists "users can insert their own messages" on messages;

create policy "room messages readable by any signed-in user"
  on messages for select
  to authenticated
  using (room_id is not null);

create policy "dm messages readable only by participants"
  on messages for select
  to authenticated
  using (
    conversation_id is not null and exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

create policy "users can insert their own room messages"
  on messages for insert
  to authenticated
  with check (auth.uid() = user_id and room_id is not null);

create policy "users can insert their own dm messages"
  on messages for insert
  to authenticated
  with check (
    auth.uid() = user_id and conversation_id is not null and exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

-- 4. Make sure realtime is on for messages (safe to run again if already added)
alter publication supabase_realtime add table conversations;
