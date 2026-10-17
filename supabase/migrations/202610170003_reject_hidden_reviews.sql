begin;

-- Allow a moderator to reject an accidentally published review after hiding it.
-- Existing review data and all other status transitions stay unchanged.
create or replace function public.check_review_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status <> old.status and not (
    (old.status = 'pending' and new.status in ('published', 'rejected')) or
    (old.status = 'published' and new.status = 'hidden') or
    (old.status = 'hidden' and new.status in ('published', 'rejected')) or
    (old.status = 'rejected' and new.status = 'pending')
  ) then
    raise exception 'Invalid review status transition' using errcode = '23514';
  end if;
  new.updated_at := greatest(clock_timestamp(), old.updated_at + interval '1 microsecond');
  return new;
end;
$$;
revoke all on function public.check_review_update() from public;

commit;
