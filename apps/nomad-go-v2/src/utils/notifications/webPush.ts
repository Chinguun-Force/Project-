import webpush, { PushSubscription, WebPushError } from "web-push";
import {
  createClient as createServiceClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/utils/supabase/config";

let vapidConfigured = false;

export type PushPayload = {
  title: string;
  body: string;
  /** Path to open on notification click. */
  url?: string;
  icon?: string;
  /** Collapses notifications that share a tag. */
  tag?: string;
};

type SubscriptionRow = {
  id: string;
  subscription: PushSubscription;
};

function getServiceClient(): SupabaseClient | null {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;

  const { url } = getSupabaseConfig();
  return createServiceClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function ensureVapidConfig(): boolean {
  if (vapidConfigured) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@nomad-go.app";

  if (!publicKey || !privateKey) return false;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

/**
 * Sends a payload to a set of subscription rows and prunes any that the push
 * service reports as gone (404/410). Never throws — push is best-effort.
 */
async function deliver(
  service: SupabaseClient,
  rows: SubscriptionRow[],
  payload: PushPayload
): Promise<number> {
  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/",
    icon: payload.icon ?? "/Shagai.png",
    tag: payload.tag,
  });

  const staleIds: string[] = [];
  let delivered = 0;

  await Promise.all(
    rows.map(async (row) => {
      try {
        await webpush.sendNotification(row.subscription, body);
        delivered += 1;
      } catch (err) {
        const statusCode = err instanceof WebPushError ? err.statusCode : 0;
        if (statusCode === 404 || statusCode === 410) {
          staleIds.push(row.id);
        }
        // Other errors are swallowed so one bad endpoint can't block the rest.
      }
    })
  );

  if (staleIds.length > 0) {
    await service
      .from("push_subscriptions")
      .delete()
      .in("id", staleIds)
      .then(
        () => undefined,
        () => undefined
      );
  }

  return delivered;
}

async function fetchSubscriptionsForUsers(
  service: SupabaseClient,
  userIds: string[]
): Promise<SubscriptionRow[]> {
  const unique = [...new Set(userIds)].filter(Boolean);
  if (unique.length === 0) return [];

  const { data, error } = await service
    .from("push_subscriptions")
    .select("id, subscription")
    .in("user_id", unique);

  if (error || !data) return [];
  return data as SubscriptionRow[];
}

/** Push to a specific set of users (across all their devices). */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<number> {
  if (!ensureVapidConfig()) return 0;
  const service = getServiceClient();
  if (!service) return 0;

  const rows = await fetchSubscriptionsForUsers(service, userIds);
  if (rows.length === 0) return 0;
  return deliver(service, rows, payload);
}

/** Push to every member of a room (tourists who joined via room code). */
export async function sendPushToRoom(
  roomId: string,
  payload: PushPayload
): Promise<number> {
  if (!ensureVapidConfig()) return 0;
  const service = getServiceClient();
  if (!service) return 0;

  const { data: members, error } = await service
    .from("room_members")
    .select("profile_id")
    .eq("room_id", roomId);

  if (error || !members || members.length === 0) return 0;

  const userIds = members.map((m) => m.profile_id as string);
  const rows = await fetchSubscriptionsForUsers(service, userIds);
  if (rows.length === 0) return 0;
  return deliver(service, rows, payload);
}

/** Broadcast to every subscribed device (admin-style announcements). */
async function sendPushToAll(payload: PushPayload): Promise<number> {
  if (!ensureVapidConfig()) return 0;
  const service = getServiceClient();
  if (!service) return 0;

  const { data, error } = await service
    .from("push_subscriptions")
    .select("id, subscription");

  if (error || !data || data.length === 0) return 0;
  return deliver(service, data as SubscriptionRow[], payload);
}

export async function notifyQuestCreated(title: string, location?: string | null) {
  await sendPushToAll({
    title: "New quest available",
    body: `${title} is now live${location ? ` in ${location}` : ""}.`,
    url: "/quests",
  });
}

export async function notifyRedeemableCreated(title: string) {
  await sendPushToAll({
    title: "New reward unlocked",
    body: `${title} is now redeemable in Nomad-Go.`,
    url: "/profile/redeem",
  });
}
