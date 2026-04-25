import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendMagicLink } from "./actions";

type SearchParams = Promise<{ sent?: string; error?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { sent, error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">bight</CardTitle>
          <CardDescription>Sign in to your account. We will email you a one-time link.</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="rounded-md border border-green-200 bg-green-50 text-green-900 p-4 text-sm">
              Check your email. Click the link we just sent to finish signing in.
            </div>
          ) : (
            <form action={sendMagicLink} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </div>
              {error ? (
                <p className="text-sm text-red-600">{error}</p>
              ) : null}
              <Button type="submit" className="w-full">
                Send magic link
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
