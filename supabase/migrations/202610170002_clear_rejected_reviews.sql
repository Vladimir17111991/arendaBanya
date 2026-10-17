begin;

-- Only an existing review moderator may permanently remove rejected reviews.
-- This migration grants the permission; it does not delete any reviews itself.
grant delete on public.reviews to authenticated;
drop policy if exists "moderators remove rejected reviews" on public.reviews;
create policy "moderators remove rejected reviews" on public.reviews
  for delete to authenticated using (
    status = 'rejected' and exists (
      select 1 from public.review_moderators where user_id = (select auth.uid())
    )
  );

commit;
