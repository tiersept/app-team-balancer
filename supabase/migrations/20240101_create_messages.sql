create table if not exists messages (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid not null,
  player_name text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table messages enable row level security;

create policy "Messages are viewable by users in the same room"
  on messages for select
  using (true);

create policy "Users can insert their own messages"
  on messages for insert
  with check (true);

-- Enable realtime
alter publication supabase_realtime add table messages;