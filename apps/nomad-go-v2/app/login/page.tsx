"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    
    setLoading(true);
    const { error, success } = await login(email, password);
    setLoading(false);

    if (error) {
      toast.error(error);
    } else if (success) {
      toast.success("Successfully logged in");
      router.push("/");
    }
  };

  return (
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
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#A8C69F] hover:bg-[#8eb084] text-[#322F36] font-semibold transition-colors"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-gray-400">
            Don't have an account?{" "}
            <Link href="/signup" className="text-[#A8C69F] hover:underline hover:text-[#8eb084]">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
