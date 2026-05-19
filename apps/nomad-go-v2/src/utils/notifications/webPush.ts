import webpush, { PushSubscription } from "web-push";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/utils/supabase/config";

let vapidConfigured = false;

function getServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return null;
  }

  const { url } = getSupabaseConfig();
  return createServiceClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function ensureVapidConfig() {
  if (vapidConfigured) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

  if (!publicKey || !privateKey) {
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

export async function notifyQuestCreated(title: string, location?: string | null) {
  if (!ensureVapidConfig()) return;

  const service = getServiceClient();
  if (!service) return;

  const { data: subscriptions, error } = await service
    .from("push_subscriptions")
    .select("id, subscription");

  if (error || !subscriptions || subscriptions.length === 0) return;

  const payload = JSON.stringify({
    title: "New quest available",
    body: `${title} is now live${location ? ` in ${location}` : ""}.`,
    icon: "/file.svg",
  });

  await Promise.all(
    subscriptions.map(async (row) => {
      try {
        await webpush.sendNotification(row.subscription as PushSubscription, payload);
      } catch {
        // Soft-fail so one stale subscription does not block all sends.
      }
    })
  );
}

export async function notifyRedeemableCreated(title: string) {
  if (!ensureVapidConfig()) return;

  const service = getServiceClient();
  if (!service) return;

  const { data: subscriptions, error } = await service
    .from("push_subscriptions")
    .select("id, subscription");

  if (error || !subscriptions || subscriptions.length === 0) return;

  const payload = JSON.stringify({
    title: "New reward unlocked",
    body: `${title} is now redeemable in Nomad-Go.`,
    icon: "/file.svg",
  });

  await Promise.all(
    subscriptions.map(async (row) => {
      try {
        await webpush.sendNotification(row.subscription as PushSubscription, payload);
      } catch {
        // Ignore stale subscription entries.
      }
    })
  );
}

