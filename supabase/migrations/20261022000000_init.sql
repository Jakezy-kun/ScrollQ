-- ScrollQ initial schema: profiles + rounds, Row Level Security, auto profile on sign-up,
-- and a self-service "delete my account" function.
--
-- Privacy: we store only a nickname, a built-in avatar id, round results and reflections.
-- No real names, photos, birthdays or locations. (Google sign-in metadata such as a real
-- name is deliberately NOT copied into profiles.)

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Player'
    check (char_length(display_name) between 1 and 24),
  avatar text
    check (avatar is null or avatar ~ '^[a-z0-9-]{1,32}$'),
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per player. Nickname and built-in avatar only.';

alter table public.profiles enable row level security;

create policy "Players can read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Players can create their own profile"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);

create policy "Players can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Players can delete their own profile"
  on public.profiles for delete to authenticated
  using ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- rounds
-- ---------------------------------------------------------------------------
create table public.rounds (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  mode text not null check (mode in ('curated', 'live')),
  feed_style text not null check (feed_style in ('vertical', 'gallery', 'timeline')),
  sq int not null check (sq between 0 and 100),
  label text not null check (char_length(label) <= 40),
  coins_left int not null check (coins_left >= 0),
  good_calls int not null check (good_calls >= 0),
  total_posts int not null check (total_posts >= 0),
  ledger jsonb not null default '[]'::jsonb check (jsonb_typeof(ledger) = 'array'),
  decisions jsonb not null default '[]'::jsonb check (jsonb_typeof(decisions) = 'array'),
  reflection jsonb check (reflection is null or jsonb_typeof(reflection) = 'object')
);

comment on table public.rounds is 'Finished rounds. Reflections are private to the player.';

create index rounds_user_created_idx on public.rounds (user_id, created_at desc);

alter table public.rounds enable row level security;

create policy "Players can read their own rounds"
  on public.rounds for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Players can add their own rounds"
  on public.rounds for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Players can update their own rounds"
  on public.rounds for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Players can delete their own rounds"
  on public.rounds for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Signed-out visitors get nothing, even before RLS is considered.
revoke all on public.profiles from anon;
revoke all on public.rounds from anon;

-- ---------------------------------------------------------------------------
-- Create a profile automatically when someone signs up.
-- Uses only the nickname the player typed (display_name), never a provider's real name.
-- ---------------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  nickname text := left(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 24);
begin
  insert into public.profiles (id, display_name)
  values (new.id, case when nickname = '' then 'Player' else nickname end);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Delete account: the browser can't delete an auth user with the public key, so this
-- security definer function deletes only the calling user. Profile and rounds cascade.
-- ---------------------------------------------------------------------------
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
