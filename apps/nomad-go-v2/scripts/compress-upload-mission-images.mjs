import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import postgres from "postgres";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const BUCKET = "quest-media";
const FOLDER = "missions";
const MAX_DIMENSION = 1600;
const TARGET_MAX_BYTES = 300 * 1024;
const CACHE_CONTROL = "31536000";

const seedPath = path.join(
  __dirname,
  "..",
  "supabase",
  "seeds",
  "missions-mongolia-sights.json",
);
const rawDir = path.join(__dirname, "..", "supabase", "seeds", "mission-images", "raw");
const outDir = path.join(__dirname, "..", "supabase", "seeds", "mission-images", "compressed");

const missions = JSON.parse(fs.readFileSync(seedPath, "utf8"));
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const db = postgres(process.env.DATABASE_URL, { max: 1 });

fs.mkdirSync(outDir, { recursive: true });

function publicUrl(storagePath) {
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}

async function uploadBuffer(storagePath, buffer) {
  const res = await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}/${storagePath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "image/jpeg",
      "x-upsert": "true",
      "Cache-Control": `max-age=${CACHE_CONTROL}, public`,
    },
    body: buffer,
  });
  if (!res.ok) {
    throw new Error(`Upload ${storagePath}: ${await res.text()}`);
  }
}

function findRawFile(slug) {
  const slugLower = slug.toLowerCase();
  const files = fs.readdirSync(rawDir);
  for (const file of files) {
    if (file === ".gitkeep") continue;
    const ext = path.extname(file).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) continue;
    const base = path.basename(file, ext).toLowerCase();
    if (base === slugLower) return path.join(rawDir, file);
  }
  return null;
}

async function compressToJpeg(inputPath) {
  let quality = 82;
  let buffer = null;

  for (let i = 0; i < 8; i += 1) {
    buffer = await sharp(inputPath)
      .rotate()
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    if (buffer.length <= TARGET_MAX_BYTES || quality <= 45) break;
    quality -= 5;
  }

  return buffer;
}

async function uploadAndLink(mission, buffer) {
  const storagePath = `${FOLDER}/${mission.image_slug}.jpg`;

  await uploadBuffer(storagePath, buffer);
  const url = publicUrl(storagePath);

  await db`
    UPDATE public.missions
    SET image_url = ${url}
    WHERE id = ${mission.id}::uuid
  `;

  return { publicUrl: url, bytes: buffer.length };
}

const args = process.argv.slice(2);
const compressOnly = args.includes("--compress-only");
const dryRun = args.includes("--dry-run");

let processed = 0;
let skipped = 0;

for (const mission of missions) {
  if (!mission.image_slug) {
    skipped += 1;
    continue;
  }

  const raw = findRawFile(mission.image_slug);
  if (!raw) {
    console.log(`⏭  skip (no raw file): ${mission.image_slug}`);
    skipped += 1;
    continue;
  }

  const buffer = await compressToJpeg(raw);
  const outPath = path.join(outDir, `${mission.image_slug}.jpg`);
  fs.writeFileSync(outPath, buffer);

  console.log(
    `✓ compressed ${mission.image_slug}: ${Math.round(buffer.length / 1024)}KB → ${outPath}`,
  );

  if (compressOnly || dryRun) {
    processed += 1;
    continue;
  }

  const { publicUrl, bytes } = await uploadAndLink(mission, buffer);
  console.log(`  ↑ uploaded + linked (${Math.round(bytes / 1024)}KB): ${publicUrl}`);
  processed += 1;
}

console.log(`\nDone. processed=${processed}, skipped=${skipped}`);
if (skipped > 0) {
  console.log(`\nDrop source photos in:\n  ${rawDir}\nName each file by image_slug (e.g. huvsgul.jpg)`);
  console.log(`\nCommands:`);
  console.log(`  node scripts/compress-upload-mission-images.mjs --compress-only  # compress only`);
  console.log(`  node scripts/compress-upload-mission-images.mjs                # compress + upload + DB`);
}

await db.end();
