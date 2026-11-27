-- Visitor view: people without an account can read (never write) the workouts of
-- accounts that opted in with profiles.visible_to_visitors. Visitors use the anon
-- role, so these policies are anon-only: signed-in users still see only their own data.

alter table public.profiles
  add column visible_to_visitors boolean not null default false;

-- Security definer so the anon policies below can check the flag without anon being
-- able to read profiles itself. It lives in a schema the Data API doesn't expose, so it
-- can't be called directly as an RPC.
create schema if not exists private;
grant usage on schema private to anon, authenticated;

create function private.is_visible_to_visitors(owner uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = owner and p.visible_to_visitors
  );
$$;

revoke all on function private.is_visible_to_visitors(uuid) from public;
grant execute on function private.is_visible_to_visitors(uuid) to anon, authenticated;

create policy "visitors read shared exercises" on public.exercises
  for select to anon
  using (private.is_visible_to_visitors(user_id));

create policy "visitors read shared workouts" on public.workouts
  for select to anon
  using (private.is_visible_to_visitors(user_id));

create policy "visitors read shared sets" on public.workout_sets
  for select to anon
  using (private.is_visible_to_visitors(user_id));
