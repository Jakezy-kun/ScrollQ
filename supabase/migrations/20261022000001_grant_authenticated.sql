-- Explicit table privileges for signed-in players.
--
-- Supabase only grants these automatically when "Automatically expose new tables" is on.
-- Granting them here makes the app work either way. RLS still limits every player to
-- their own rows; signed-out visitors (anon) stay revoked by the init migration.
-- Safe to run more than once.

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.rounds to authenticated;
