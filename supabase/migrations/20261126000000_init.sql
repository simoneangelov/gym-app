-- Gym tracker schema: exercises, workouts, and the sets logged in each workout.
-- Every row belongs to a user and Row Level Security restricts access to the owner.

create table public.exercises (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(trim(name)) between 1 and 80),
  created_at  timestamptz not null default now()
);
create unique index exercises_user_name_key on public.exercises (user_id, lower(name));

create table public.workouts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name          text not null default 'Workout' check (char_length(name) <= 80),
  performed_on  date not null default current_date,
  notes         text check (char_length(notes) <= 2000),
  created_at    timestamptz not null default now()
);
create index workouts_user_date_idx on public.workouts (user_id, performed_on desc, created_at desc);

create table public.workout_sets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  workout_id   uuid not null references public.workouts (id) on delete cascade,
  exercise_id  uuid not null references public.exercises (id) on delete cascade,
  reps         integer not null check (reps between 0 and 1000),
  weight       numeric(6, 2) not null default 0 check (weight >= 0),
  created_at   timestamptz not null default now()
);
create index workout_sets_workout_idx on public.workout_sets (workout_id, created_at);
create index workout_sets_exercise_idx on public.workout_sets (user_id, exercise_id);

alter table public.exercises    enable row level security;
alter table public.workouts     enable row level security;
alter table public.workout_sets enable row level security;

create policy "own exercises" on public.exercises
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "own workouts" on public.workouts
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- A set must point at a workout and an exercise that the same user owns.
create policy "own sets" on public.workout_sets
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.workouts w  where w.id = workout_id  and w.user_id = (select auth.uid()))
    and exists (select 1 from public.exercises e where e.id = exercise_id and e.user_id = (select auth.uid()))
  );
