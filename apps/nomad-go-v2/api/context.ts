import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { createClient } from "@/utils/supabase/server";
import { findUserById } from "./queries/users";

export type TrpcContext = {
  req?: Request;
  resHeaders?: Headers;
  user?: User;
};

export async function createContext(
  opts?: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts?.req, resHeaders: opts?.resHeaders };
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const dbUser = await findUserById(authUser.id);
      if (dbUser) {
        ctx.user = dbUser;
      }
    }
  } catch (e) {
    console.error("Auth error in TRPC context:", e);
  }
  return ctx;
}
