-- Create players table
create table players (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  skill integer default 1 check (skill >= 1 and skill <= 5),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  room_id text not null,
  is_active boolean default true
);

-- Create messages table
create table messages (
  id uuid primary key default uuid_generate_v4(),
  content text not null,
  player_name text not null,
  room_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS but make it open for this demo
alter table players enable row level security;
alter table messages enable row level security;

-- Create open policies (since we're not using auth)
create policy "Allow full access to players"
on players for all
using (true)
with check (true);

create policy "Allow full access to messages"
on messages for all
using (true)
with check (true); 