import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function MyDemoPage() {
  const supabase = await createClient();
  // RLS means we can safely select - we will only get the client's own rows.
  const { data: client } = await supabase
    .from("clients")
    .select("id, contact_name, lead_id")
    .single();

  const { data: lead } = await supabase
    .from("leads")
    .select("name, website, suburb")
    .single();

  const { data: website } = await supabase
    .from("websites")
    .select("status, demo_url")
    .maybeSingle();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">
          Hi {client?.contact_name ?? "there"},
        </h1>
        <p className="text-muted-foreground mt-1">
          Here is the demo site we built for {lead?.name ?? "your business"}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your demo site</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {website?.demo_url ? (
            <>
              <div className="aspect-video w-full rounded-md border overflow-hidden bg-muted">
                <iframe
                  src={website.demo_url}
                  className="w-full h-full"
                  title="Demo site preview"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <a
                  href={website.demo_url}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(buttonVariants({ variant: "default" }))}
                >
                  Open full page
                </a>
                <Button variant="outline">I love it, let&apos;s go live</Button>
                <Button variant="ghost">Request changes</Button>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              Your demo site is still being prepared. We will email you when it is ready.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
