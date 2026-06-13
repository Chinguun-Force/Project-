"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  PROFILES_TABLE,
  toLegacyUserRole,
  toProfileRole,
} from "@/lib/auth/profile";

export interface UserData {
  email: string;
  playerName: string;
  character: string;
  trait: string;
  origin: string;
  age?: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; role?: string; userId?: string }>;
  signup: (
    userData: UserData & { password: string },
  ) => Promise<{
    success: boolean;
    error?: string;
    userId?: string;
    needsConfirmation?: boolean;
  }>;
  resendConfirmation: (
    email: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSignupErrorMessage(errorMessage: string): string {
  const lower = errorMessage.toLowerCase();

  if (errorMessage.includes("over_email_send_rate_limit")) {
    return "Too many signup attempts. Please wait a few minutes before trying again.";
  }

  if (errorMessage.includes("email rate limit exceeded")) {
    return "Email sending is temporarily rate-limited. Please retry in a few minutes.";
  }

  if (lower.includes("email not confirmed")) {
    return "Please confirm your email first — check your inbox for the confirmation link.";
  }

  return errorMessage;
}

function normalizeEmail(email: string): string {
  return email.trim().replace(/^"+|"+$/g, "").toLowerCase();
}

/** Where Supabase should send users after they click the confirmation link. */
function getEmailRedirectTo(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}/auth/confirm?next=/`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const getProfileRole = async (userId: string): Promise<string> => {
    const { data, error } = await supabase
      .from(PROFILES_TABLE)
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (error) return "tourist";
    const role = data?.role ?? "tourist";
    return role === "tourist" ? "user" : role;
  };

  const syncUserProfile = async (authUser: User) => {
    const fullName =
      (authUser.user_metadata?.playerName as string | undefined) ||
      (authUser.user_metadata?.full_name as string | undefined) ||
      (authUser.email ? authUser.email.split("@")[0] : "Traveler");

    const { data: existingProfile } = await supabase
      .from(PROFILES_TABLE)
      .select("role, tenant_id")
      .eq("id", authUser.id)
      .maybeSingle();

    const profileRole = toProfileRole(existingProfile?.role ?? "tourist");
    const legacyRole = toLegacyUserRole(profileRole);

    const profileError = existingProfile
      ? (
          await supabase
            .from(PROFILES_TABLE)
            .update({ full_name: fullName })
            .eq("id", authUser.id)
        ).error
      : (
          await supabase.from(PROFILES_TABLE).insert({
            id: authUser.id,
            role: profileRole,
            full_name: fullName,
            tenant_id: null,
          })
        ).error;

    const { error: usersError } = await supabase.from("users").upsert(
      {
        id: authUser.id,
        full_name: fullName,
        email: authUser.email ?? "",
        role: legacyRole,
      },
      { onConflict: "id" },
    );

    return profileError ?? usersError;
  };

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await syncUserProfile(session.user);
      }
      setIsLoading(false);
    };

    getSession();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        void syncUserProfile(session.user);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const normalizedEmail = normalizeEmail(email);
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) return { success: false, error: mapSignupErrorMessage(error.message) };

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return { success: true, role: "user" as const };
    }

    await syncUserProfile(authUser);
    const role = await getProfileRole(authUser.id);
    return { success: true, role, userId: authUser.id };
  };

  const signup = async (userData: UserData & { password: string }) => {
    const normalizedEmail = normalizeEmail(userData.email);
    const { error, data } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: userData.password,
      options: {
        emailRedirectTo: getEmailRedirectTo(),
        data: {
          playerName: userData.playerName,
          character: userData.character,
          trait: userData.trait,
          origin: userData.origin,
          age: userData.age,
        }
      }
    });

    if (error) return { success: false, error: mapSignupErrorMessage(error.message) };

    // With email confirmation enabled, signUp returns a user but no session
    // until the link is clicked. Profile creation then runs on first login
    // (or via the /auth/confirm callback → onAuthStateChange → syncUserProfile).
    if (data.session && data.user) {
      const userInsertError = await syncUserProfile(data.user);
      if (userInsertError) {
        return {
          success: false,
          error: `Signup succeeded but user profile insert failed: ${userInsertError.message}`,
        };
      }
      return { success: true, userId: data.user.id, needsConfirmation: false };
    }

    return {
      success: true,
      userId: data.user?.id,
      needsConfirmation: true,
    };
  };

  const resendConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: normalizeEmail(email),
      options: { emailRedirectTo: getEmailRedirectTo() },
    });

    if (error) {
      return { success: false, error: mapSignupErrorMessage(error.message) };
    }
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated: !!user, 
      user, 
      login, 
      signup, 
      resendConfirmation,
      logout, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

