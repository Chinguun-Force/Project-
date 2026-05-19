import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm text-center border-[var(--bdr)] bg-white">
        <CardHeader>
          <CardTitle className="font-display text-4xl font-black text-ng-tx">404</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[var(--mu)] text-sm">Page not found</p>
          <Button asChild className="w-full ng-btn-primary border-none">
            <Link to="/">Back to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
