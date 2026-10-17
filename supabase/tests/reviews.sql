-- Run only in an empty disposable PostgreSQL database, never in production.
\set ON_ERROR_STOP on
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth, public to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
\ir ../migrations/202610170001_reviews.sql
insert into auth.users values ('00000000-0000-4000-8000-000000000001'), ('00000000-0000-4000-8000-000000000002');
insert into public.review_moderators values ('00000000-0000-4000-8000-000000000001');

set role anon;
select public.submit_review('10000000-0000-4000-8000-000000000001', 'Guest', 2, 'More towels please.');
select public.submit_review('10000000-0000-4000-8000-000000000001', 'Overwrite', 5, 'Duplicate must not overwrite.');
do $$ begin
  if exists (select 1 from public.reviews) then raise exception 'Guest sees pending review'; end if;
  begin
    insert into public.reviews(id,name,rating,body,status) values (gen_random_uuid(),'Bypass',5,'Direct insert attack','published');
    raise exception 'Guest can insert directly';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.reviews set status = 'published';
    raise exception 'Guest can update reviews';
  exception when insufficient_privilege then null;
  end;
  begin
    select public.submit_review(gen_random_uuid(), 'Guest', 6, 'Invalid rating test');
    raise exception 'Invalid rating accepted';
  exception when check_violation then null;
  end;
end $$;
reset role;

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000002';
do $$ declare changed integer; begin
  if exists(select 1 from public.reviews) then raise exception 'Ordinary account sees private queue'; end if;
  if exists(select 1 from public.review_moderators) then raise exception 'Ordinary account can read moderator identities'; end if;
  update public.reviews set status = 'published';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'Ordinary account can publish'; end if;
  begin
    insert into public.review_moderators values (auth.uid());
    raise exception 'Account can grant itself moderation';
  exception when insufficient_privilege then null;
  end;
end $$;

set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';
do $$ begin
  if (select count(*) from public.reviews) <> 1 then raise exception 'Moderator cannot see pending review or retry duplicated it'; end if;
  if (select rating from public.reviews limit 1) <> 2 then raise exception 'Retry overwrote review'; end if;
  begin
    update public.reviews set body = 'Edited opinion';
    raise exception 'Moderator can rewrite guest opinion';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.reviews set status = 'hidden';
    raise exception 'Illegal transition accepted';
  exception when check_violation then null;
  end;
end $$;
update public.reviews set status = 'published', reply = 'Thank you, noted.';
reset role;
set role anon;
do $$ begin
  if (select count(*) from public.reviews) <> 1 then raise exception 'Published review not visible'; end if;
  if (select reply from public.reviews limit 1) <> 'Thank you, noted.' then raise exception 'Reply missing'; end if;
end $$;
reset role;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';
update public.reviews set status = 'hidden';
reset role;
set role anon;
do $$ begin
  if exists(select 1 from public.reviews) then raise exception 'Hidden review visible'; end if;
end $$;
reset role;
select 'Review RLS and moderation checks passed' as result;
