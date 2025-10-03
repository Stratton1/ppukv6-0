alter table public.profiles   enable row level security;
alter table public.properties enable row level security;

drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select" on public.profiles
for select to authenticated
using (id = auth.uid());

drop policy if exists "profiles_self_upsert" on public.profiles;
create policy "profiles_self_upsert" on public.profiles
for insert to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "properties_self_select" on public.properties;
create policy "properties_self_select" on public.properties
for select to authenticated
using (owner_id = auth.uid());

drop policy if exists "properties_self_insert" on public.properties;
create policy "properties_self_insert" on public.properties
for insert to authenticated
with check (owner_id = auth.uid());
