import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import postgres from "postgres";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const seedPath = path.join(
  __dirname,
  "..",
  "supabase",
  "seeds",
  "missions-mongolia-sights.json",
);

const REMOVED_MISSION_IDS = [
  "a1c0d5e2-9900-4fa3-6e7f-89abcdef0123",
  "0bf6b1c8-5566-4fb3-2c3d-89abcdef0123",
  "3ca9e4f1-8899-4fb6-5f6a-bcdef0123456",
  "7c02c8d5-2233-4fba-9d0e-f0123456789a",
  "0f35f1a8-5566-4fbd-2a3b-23456789abcd",
];

const missions = JSON.parse(fs.readFileSync(seedPath, "utf8"));
const seedIds = missions.map((m) => m.id);

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

try {
  let inserted = 0;
  for (const m of missions) {
    await sql`
      INSERT INTO public.missions (
        id,
        title,
        description,
        image_url,
        xp_reward,
        latitude,
        longitude,
        radius_meters,
        created_at
      ) VALUES (
        ${m.id}::uuid,
        ${m.title},
        ${m.description},
        ${m.image_url},
        ${m.xp_reward},
        ${m.latitude},
        ${m.longitude},
        ${m.radius_meters},
        ${m.created_at}::timestamptz
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        image_url = EXCLUDED.image_url,
        xp_reward = EXCLUDED.xp_reward,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        radius_meters = EXCLUDED.radius_meters
    `;
    inserted += 1;
  }

  const removed = await sql`
    DELETE FROM public.missions
    WHERE id = ANY(${REMOVED_MISSION_IDS}::uuid[])
  `;

  console.log(`Seeded ${inserted} missions into public.missions`);
  console.log(`Removed ${removed.count} missions without images`);
} finally {
  await sql.end();
}
