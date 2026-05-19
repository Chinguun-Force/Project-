import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm border-[var(--bdr)] bg-white">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            <span className="font-display text-2xl font-black text-ng tracking-tight">Nomad</span>
            <span className="font-display text-2xl font-black text-ng-tx tracking-tight">Go</span>
          </div>
          <CardTitle className="text-sm font-bold text-[var(--mu)]">Sign in to continue</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full ng-btn-primary border-none"
            size="lg"
            onClick={() => {
              window.location.href = getOAuthUrl();
            }}
          >
            Sign in with Kimi
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
