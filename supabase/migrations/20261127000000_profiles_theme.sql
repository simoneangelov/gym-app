-- Per-account color theme. Saved next to weight_unit on the user's profile.
-- 'dark' is the original look, so existing accounts see no change.

alter table public.profiles
  add column theme text not null default 'dark'
  check (theme in ('dark', 'light', 'pink'));
