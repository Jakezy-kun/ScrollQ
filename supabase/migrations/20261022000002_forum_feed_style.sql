-- Allow the fourth feed style, "forum", in saved rounds.
-- The init migration's inline check gets Postgres' default name, rounds_feed_style_check.
-- Safe to run more than once.

alter table public.rounds drop constraint if exists rounds_feed_style_check;
alter table public.rounds
  add constraint rounds_feed_style_check
  check (feed_style in ('vertical', 'gallery', 'timeline', 'forum'));
