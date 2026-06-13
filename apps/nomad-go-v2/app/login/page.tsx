"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import { getPostLoginPath } from "@/lib/auth/roles";
import { NomadBootScreen } from "@/components/NomadBootScreen";
import {
  markPostLoginBoot,
  waitMinBoot,
} from "@/lib/auth/postLoginBoot";
import {
  getTouristActiveRoomAction,
  getUserProgressAction,
} from "@/app/actions/gameActions";

type BootPhase = "idle" | "signing-in" | "preparing";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bootPhase, setBootPhase] = useState<BootPhase>("idle");
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth_error") === "email_confirmation") {
      toast.error(
        "That confirmation link is invalid or has expired. Please sign in or request a new link."
      );
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setBootPhase("signing-in");
    const started = Date.now();

    const { error, success, role, userId } = await login(email, password);

    if (error) {
      setBootPhase("idle");
      toast.error(error);
      return;
    }

    if (!success) {
      setBootPhase("idle");
      return;
    }

    setBootPhase("preparing");
    markPostLoginBoot();

    const destination = getPostLoginPath(role);
    const prefetch =
      destination === "/" && userId
        ? Promise.all([
            getUserProgressAction(userId),
            getTouristActiveRoomAction(userId),
          ])
        : Promise.resolve();

    await Promise.all([prefetch, waitMinBoot(Math.max(0, 700 - (Date.now() - started)))]);

    router.push(destination);
    router.refresh();
  };

  const bootMessage =
    bootPhase === "signing-in"
      ? "Signing you in"
      : bootPhase === "preparing"
        ? "Loading your expedition"
        : undefined;

  const bootSubmessage =
    bootPhase === "signing-in"
      ? "Verifying your trail pass…"
      : bootPhase === "preparing"
        ? "Gathering XP, Shagai, and your live agenda…"
        : undefined;

  return (
    <>
      {bootPhase !== "idle" ? (
        <NomadBootScreen message={bootMessage} submessage={bootSubmessage} />
      ) : null}

      <div className="min-h-screen flex items-center justify-center bg-[#322F36] p-4">
        <Card className="w-full max-w-sm bg-[#322F36] border-gray-700 text-white shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight">Welcome Back</CardTitle>
            <CardDescription className="text-gray-400">
              Sign in to continue your adventure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nomad@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#2a272e] border-gray-600 text-white placeholder:text-gray-500 focus-visible:ring-[#A8C69F]"
                  required
                  disabled={bootPhase !== "idle"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#2a272e] border-gray-600 text-white placeholder:text-gray-500 focus-visible:ring-[#A8C69F]"
                  required
                  disabled={bootPhase !== "idle"}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#A8C69F] hover:bg-[#8eb084] text-[#322F36] font-semibold transition-colors"
                disabled={bootPhase !== "idle"}
              >
                {bootPhase !== "idle" ? (
                  <Spinner className="w-4 h-4 text-[#322F36]" />
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-gray-400">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-[#A8C69F] hover:underline hover:text-[#8eb084]">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
