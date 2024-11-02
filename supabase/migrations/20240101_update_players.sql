-- Enable realtime for all operations
alter publication supabase_realtime add table players;

-- Update policies
create policy "Anyone can view players"
  on players for select
  using (true);

create policy "Anyone can insert players"
  on players for insert
  with check (true);

create policy "Anyone can delete players"
  on players for delete
  using (true);

create policy "Anyone can update players"
  on players for update
  using (true);