import { db } from "@/db";
import { clients, leads, websites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function MyDemoPage() {
  const session = await auth();
  // requireClient (in layout) guarantees session.user.id is set.
  const userId = session!.user.id;

  // App-level access check: a client can only ever read THEIR own client row.
  const [client] = await db
    .select({
      id: clients.id,
      contactName: clients.contactName,
      leadId: clients.leadId,
    })
    .from(clients)
    .where(eq(clients.userId, userId))
    .limit(1);

  if (!client) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold">Welcome</h1>
        <p className="text-muted-foreground">
          We are still setting up your portal. We will email you when your demo is ready.
        </p>
      </div>
    );
  }

  const [lead] = await db
    .select({ name: leads.name, suburb: leads.suburb })
    .from(leads)
    .where(eq(leads.id, client.leadId))
    .limit(1);

  const [website] = await db
    .select({ status: websites.status, demoUrl: websites.demoUrl })
    .from(websites)
    .where(eq(websites.leadId, client.leadId))
    .limit(1);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">
          Hi {client.contactName ?? "there"},
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
          {website?.demoUrl ? (
            <>
              <div className="aspect-video w-full rounded-md border overflow-hidden bg-muted">
                <iframe
                  src={website.demoUrl}
                  className="w-full h-full"
                  title="Demo site preview"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <a
                  href={website.demoUrl}
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
