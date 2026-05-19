"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";

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
  ) => Promise<{ success: boolean; error?: string; role?: "admin" | "user" }>;
  signup: (userData: UserData & { password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSignupErrorMessage(errorMessage: string): string {
  if (errorMessage.includes("over_email_send_rate_limit")) {
    return "Too many signup attempts. Please wait a few minutes before trying again.";
  }

  if (errorMessage.includes("email rate limit exceeded")) {
    return "Email sending is temporarily rate-limited. Please retry in a few minutes.";
  }

  return errorMessage;
}

function normalizeEmail(email: string): string {
  return email.trim().replace(/^"+|"+$/g, "").toLowerCase();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const getProfileRole = async (userId: string): Promise<"admin" | "user"> => {
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (error) return "user";
    return data?.role === "admin" ? "admin" : "user";
  };

  const syncUserProfile = async (authUser: User) => {
    const fullName =
      (authUser.user_metadata?.playerName as string | undefined) ||
      (authUser.user_metadata?.full_name as string | undefined) ||
      (authUser.email ? authUser.email.split("@")[0] : "Traveler");
    const existingRole = await getProfileRole(authUser.id);

    const { error } = await supabase.from("users").upsert(
      {
        id: authUser.id,
        full_name: fullName,
        email: authUser.email ?? "",
        role: existingRole,
      },
      { onConflict: "id" },
    );

    return error;
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

    const role = await getProfileRole(authUser.id);
    return { success: true, role };
  };

  const signup = async (userData: UserData & { password: string }) => {
    const normalizedEmail = normalizeEmail(userData.email);
    const { error, data } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: userData.password,
      options: {
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

    // If email confirmation is enabled, signUp may return no active session.
    // In that case profile creation will run after first successful login.
    if (data.session && data.user) {
      const userInsertError = await syncUserProfile(data.user);
      if (userInsertError) {
        return {
          success: false,
          error: `Signup succeeded but user profile insert failed: ${userInsertError.message}`,
        };
      }
    }

    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated: !!user, 
      user, 
      login, 
      signup, 
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

