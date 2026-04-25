import { db } from "@/db";
import { clients, leads, websites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default async function MyDemoPage() {
  const session = await auth();
  const userId = session!.user.id;

  // App-level access control: only ever fetch the row owned by this user.
  const [client] = await db
    .select({
      id: clients.id,
      contactName: clients.contactName,
      contactEmail: clients.contactEmail,
      leadId: clients.leadId,
      plan: clients.plan,
    })
    .from(clients)
    .where(eq(clients.userId, userId))
    .limit(1);

  if (!client) {
    return (
      <div className="flex flex-col gap-4 py-12">
        <h1 className="text-3xl font-semibold">Welcome</h1>
        <p className="text-muted-foreground">
          We are still setting up your portal. We will email you when your demo is ready.
        </p>
      </div>
    );
  }

  const [lead] = await db
    .select({
      name: leads.name,
      category: leads.category,
      phone: leads.phone,
      website: leads.website,
      hasWebsite: leads.hasWebsite,
      fullAddress: leads.fullAddress,
      suburb: leads.suburb,
      googleRating: leads.googleRating,
      reviewCount: leads.reviewCount,
      socialLinks: leads.socialLinks,
      googlePlaceUrl: leads.googlePlaceUrl,
    })
    .from(leads)
    .where(eq(leads.id, client.leadId))
    .limit(1);

  const [website] = await db
    .select({
      status: websites.status,
      demoUrl: websites.demoUrl,
      liveUrl: websites.liveUrl,
    })
    .from(websites)
    .where(eq(websites.leadId, client.leadId))
    .limit(1);

  const social = (lead?.socialLinks ?? {}) as Record<string, string>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">
          Hi {client.contactName ?? "there"},
        </h1>
        <p className="text-muted-foreground mt-1">
          This is your portal for {lead?.name ?? "your business"}. Here is the demo
          site we built and a snapshot of the info we have on file.
        </p>
      </div>

      {/* Demo site card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your demo site</CardTitle>
            {website ? (
              <Badge variant="secondary">{website.status}</Badge>
            ) : (
              <Badge variant="secondary">in progress</Badge>
            )}
          </div>
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
            <div className="rounded-md border bg-muted/40 p-6 text-center">
              <p className="font-medium">Your demo site is being built</p>
              <p className="text-sm text-muted-foreground mt-1">
                Harvey will email you the moment it&apos;s ready to view.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current website */}
      <Card>
        <CardHeader>
          <CardTitle>Your current website</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {lead?.hasWebsite && lead.website ? (
            <div className="space-y-2">
              <a
                href={lead.website}
                target="_blank"
                rel="noreferrer"
                className="underline break-all"
              >
                {lead.website}
              </a>
              <p className="text-muted-foreground">
                This is the site Google has on file for your business. The demo above
                is the new version we would build for you.
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Google has no website listed for your business. The demo above would be
              your first one.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Business info */}
      <Card>
        <CardHeader>
          <CardTitle>What we have on file</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="text-sm grid gap-y-3">
            <Row label="Business" value={lead?.name} />
            <Row label="Category" value={lead?.category} />
            <Row label="Address" value={lead?.fullAddress} />
            <Row label="Phone" value={lead?.phone} />
            <Row
              label="Google rating"
              value={
                lead?.googleRating
                  ? `${lead.googleRating} (${lead.reviewCount ?? 0} reviews)`
                  : null
              }
            />
            {lead?.googlePlaceUrl ? (
              <Row
                label="Google Maps"
                value={
                  <a
                    href={lead.googlePlaceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    Open
                  </a>
                }
              />
            ) : null}
            {Object.keys(social).length > 0 ? (
              <Row
                label="Socials"
                value={
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(social).map(([k, v]) => (
                      <a
                        key={k}
                        href={v}
                        target="_blank"
                        rel="noreferrer"
                        className="underline capitalize"
                      >
                        {k}
                      </a>
                    ))}
                  </div>
                }
              />
            ) : null}
          </dl>
          <Separator className="my-4" />
          <p className="text-xs text-muted-foreground">
            Something wrong or out of date? Reply to Harvey&apos;s last email and we
            will fix it on the demo site.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode | null | undefined;
}) {
  return (
    <div className="grid grid-cols-3 gap-4 items-baseline">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="col-span-2">
        {value || <span className="text-muted-foreground">—</span>}
      </dd>
    </div>
  );
}
