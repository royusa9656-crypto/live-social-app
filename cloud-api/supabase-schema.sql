create table if not exists profiles (
  id uuid primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

create table if not exists live_invites (
  id uuid primary key default gen_random_uuid(),
  room_name text not null,
  inviter_id uuid not null,
  invitee_id uuid not null,
  status text not null default 'pending',
  created_at timestamptz default now(),
  responded_at timestamptz
);

create index if not exists live_invites_invitee_status_idx
  on live_invites (invitee_id, status);

create index if not exists live_invites_room_idx
  on live_invites (room_name);
