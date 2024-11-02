-- First, delete duplicates keeping only the latest entry per room_id
delete from teams a using (
  select room_id, max(created_at) as max_date
  from teams
  group by room_id
  having count(*) > 1
) b
where a.room_id = b.room_id
and a.created_at < b.max_date;

-- Now create the table structure with constraints
create table if not exists public.teams (
  id uuid default gen_random_uuid() primary key,
  room_id text not null,
  team_data jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint teams_room_id_key unique (room_id)
);

-- Add index for faster room_id lookups
create index if not exists teams_room_id_idx on public.teams(room_id);

-- Add unique constraint to ensure one team state per room
alter table public.teams add constraint teams_room_id_unique unique (room_id);

-- Enable RLS
alter table public.teams enable row level security;

-- Add RLS policy for read access
create policy "Enable read access for all users" on public.teams
  for select
  to authenticated, anon
  using (true);

-- Add RLS policy for insert/update
create policy "Enable insert access for all users" on public.teams
  for insert
  to authenticated, anon
  with check (true);

-- Add RLS policy for update
create policy "Enable update access for all users" on public.teams
  for update
  to authenticated, anon
  using (true);

-- Enable realtime for teams table
alter publication supabase_realtime add table public.teams;

-- Make sure primary key is included in replica identity
alter table public.teams replica identity full;