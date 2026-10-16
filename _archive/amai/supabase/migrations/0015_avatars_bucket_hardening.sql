-- 0015_avatars_bucket_hardening.sql
-- P2 hardening (defense in depth). Constrain the private 'avatars' storage
-- bucket at the bucket level: max 2 MB and only PNG / JPEG / WebP. The upload
-- action remains the PRIMARY validation layer (MIME + size + magic bytes); this
-- is a backstop so a direct Storage API call is also bounded.
--
-- Additive + reversible: updates the existing bucket's limits only. The bucket
-- stays private (public = false). No objects are moved, no business tables
-- touched.
--
-- ROLLBACK:
--   update storage.buckets
--     set file_size_limit = null, allowed_mime_types = null
--     where id = 'avatars';

update storage.buckets
set file_size_limit = 2097152,                                    -- 2 MB
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
where id = 'avatars';
