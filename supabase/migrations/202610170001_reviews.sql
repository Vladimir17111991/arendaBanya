begin;

create table public.review_moderators (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.review_moderators enable row level security;
revoke all on public.review_moderators from public, anon, authenticated;
grant select on public.review_moderators to authenticated;
create policy "moderator can check own membership" on public.review_moderators
  for select to authenticated using (user_id = (select auth.uid()));

create table public.reviews (
  id uuid primary key,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  rating integer not null check (rating between 1 and 5),
  body text not null check (char_length(btrim(body)) between 10 and 1500),
  status text not null default 'pending' check (status in ('pending', 'published', 'hidden', 'rejected')),
  reply text not null default '' check (char_length(reply) <= 1500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reviews_status_created_at_idx on public.reviews(status, created_at desc, id);
alter table public.reviews enable row level security;
revoke all on public.reviews from public, anon, authenticated;
grant select on public.reviews to anon, authenticated;
grant update (status, reply) on public.reviews to authenticated;

create policy "visitors read published reviews" on public.reviews
  for select to anon, authenticated using (status = 'published');
create policy "moderators read review queue" on public.reviews
  for select to authenticated using (
    exists (select 1 from public.review_moderators where user_id = (select auth.uid()))
  );
create policy "moderators change status and reply" on public.reviews
  for update to authenticated using (
    exists (select 1 from public.review_moderators where user_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.review_moderators where user_id = (select auth.uid()))
  );

-- The public RPC accepts no status/reply/date fields. A retry uses the same random
-- submission ID and cannot overwrite a review or reveal whether it is in the queue.
create function public.submit_review(submission_id uuid, author_name text, stars integer, review_body text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.reviews (id, name, rating, body)
  values (submission_id, btrim(author_name), stars, btrim(review_body))
  on conflict (id) do nothing;
end;
$$;
revoke all on function public.submit_review(uuid, text, integer, text) from public;
grant execute on function public.submit_review(uuid, text, integer, text) to anon, authenticated;

create function public.check_review_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status <> old.status and not (
    (old.status = 'pending' and new.status in ('published', 'rejected')) or
    (old.status = 'published' and new.status = 'hidden') or
    (old.status = 'hidden' and new.status = 'published') or
    (old.status = 'rejected' and new.status = 'pending')
  ) then
    raise exception 'Invalid review status transition' using errcode = '23514';
  end if;
  new.updated_at := greatest(clock_timestamp(), old.updated_at + interval '1 microsecond');
  return new;
end;
$$;
revoke all on function public.check_review_update() from public;
create trigger reviews_updated before update on public.reviews
  for each row execute function public.check_review_update();

commit;
