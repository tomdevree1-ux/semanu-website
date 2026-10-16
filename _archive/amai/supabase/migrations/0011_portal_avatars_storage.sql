-- ============================================================
-- amai.ch · 0011 · portal: private avatars bucket + policies (ADDITIVE)
-- Mirrors the AS-APPLIED live migration `portal_avatars_storage`.
-- Object path convention: '{auth.uid()}/...'. Drops nothing (bucket is new).
-- ============================================================
insert into storage.buckets (id, name, public) values ('avatars','avatars', false)
on conflict (id) do nothing;

drop policy if exists "avatars read own" on storage.objects;
create policy "avatars read own" on storage.objects for select to authenticated
  using (bucket_id='avatars' and ((storage.foldername(name))[1] = (select auth.uid())::text
         or public.is_org_admin() or public.is_platform_super_admin()));
drop policy if exists "avatars write own" on storage.objects;
create policy "avatars write own" on storage.objects for insert to authenticated
  with check (bucket_id='avatars' and ((storage.foldername(name))[1] = (select auth.uid())::text
         or public.is_org_admin() or public.is_platform_super_admin()));
drop policy if exists "avatars update own" on storage.objects;
create policy "avatars update own" on storage.objects for update to authenticated
  using (bucket_id='avatars' and ((storage.foldername(name))[1] = (select auth.uid())::text
         or public.is_org_admin() or public.is_platform_super_admin()));
drop policy if exists "avatars delete own" on storage.objects;
create policy "avatars delete own" on storage.objects for delete to authenticated
  using (bucket_id='avatars' and ((storage.foldername(name))[1] = (select auth.uid())::text
         or public.is_org_admin() or public.is_platform_super_admin()));

-- ROLLBACK: drop policy if exists "avatars read own"/"avatars write own"/"avatars update own"/"avatars delete own" on storage.objects;
--           delete from storage.buckets where id='avatars'; (only if empty)
