import { createClient } from "@/utils/supabase/client";
import { compressImage, ImageCompressionError } from "@/lib/media/compressImage";

export const QUEST_MEDIA_BUCKET = "quest-media";

/** 1 year immutable caching → Cloudflare CDN egress savings. */
const CACHE_CONTROL = "public, max-age=31536000";

export type QuestMediaFolder = "missions" | "quests";

export type UploadQuestImageResult = {
  publicUrl: string;
  path: string;
  bytes: number;
};

function safeUuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Compress (Canvas) → upload to Supabase Storage → return public URL.
 * Always persists images to Supabase; never inlines base64 into the DB.
 */
export async function uploadQuestImage(
  file: File,
  folder: QuestMediaFolder
): Promise<UploadQuestImageResult> {
  const compressed = await compressImage(file);

  const supabase = createClient();
  const path = `${folder}/${safeUuid()}.${compressed.extension}`;

  const { error } = await supabase.storage
    .from(QUEST_MEDIA_BUCKET)
    .upload(path, compressed.blob, {
      cacheControl: "31536000",
      contentType: compressed.mime,
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(QUEST_MEDIA_BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error("Upload succeeded but no public URL was returned.");
  }

  return { publicUrl: data.publicUrl, path, bytes: compressed.bytes };
}

export { ImageCompressionError };
export const QUEST_MEDIA_CACHE_CONTROL = CACHE_CONTROL;
