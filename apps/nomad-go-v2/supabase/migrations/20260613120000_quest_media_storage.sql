-- Quest & mission media storage bucket.
-- Public read (CDN-cached display images); writes restricted to staff roles.
-- Columns `missions.image_url` and `quests.image_url` already exist — no DDL needed there.

-- 1. Bucket: 1MB ceiling, JPEG/PNG whitelist (defensive, mirrors client compression target).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quest-media',
  'quest-media',
  true,
  1048576,
  ARRAY['image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Staff predicate: only admin / moderator / guide may mutate quest media.
CREATE OR REPLACE FUNCTION public.is_staff_user()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'moderator', 'guide')
  );
$$;

COMMENT ON FUNCTION public.is_staff_user() IS
  'True when the current auth user is admin/moderator/guide (quest media write guard).';

-- 3. Storage RLS policies (scoped to the quest-media bucket).
DROP POLICY IF EXISTS "quest_media_public_read" ON storage.objects;
CREATE POLICY "quest_media_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'quest-media');

DROP POLICY IF EXISTS "quest_media_staff_insert" ON storage.objects;
CREATE POLICY "quest_media_staff_insert" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'quest-media' AND public.is_staff_user());

DROP POLICY IF EXISTS "quest_media_staff_update" ON storage.objects;
CREATE POLICY "quest_media_staff_update" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'quest-media' AND public.is_staff_user())
  WITH CHECK (bucket_id = 'quest-media' AND public.is_staff_user());

DROP POLICY IF EXISTS "quest_media_staff_delete" ON storage.objects;
CREATE POLICY "quest_media_staff_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'quest-media' AND public.is_staff_user());
