-- Per-user settings. For now just the preferred weight unit.
-- Weights in workout_sets stay stored in pounds (as before); the app converts
-- to and from kilograms when the user prefers kg, so no existing data changes.

create table public.profiles (
  user_id      uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  weight_unit  text not null default 'lb' check (weight_unit in ('lb', 'kg')),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "own profile" on public.profiles
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
