import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { leads, niches, reviews, websites, clients, notes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Params = Promise<{ id: string }>;

function field(label: string, value: React.ReactNode) {
  return (
    <div className="grid grid-cols-3 gap-4 py-2 text-sm">
      <div className="text-muted-foreground">{label}</div>
      <div className="col-span-2">{value || <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}

export default async function LeadDetailPage({ params }: { params: Params }) {
  const { id } = await params;

  const [lead] = await db
    .select({
      lead: leads,
      city: niches.city,
      nicheSlug: niches.slug,
    })
    .from(leads)
    .leftJoin(niches, eq(leads.nicheId, niches.id))
    .where(eq(leads.id, id))
    .limit(1);

  if (!lead) notFound();

  const [review] = await db
    .select()
    .from(reviews)
    .where(eq(reviews.leadId, id))
    .limit(1);

  const [website] = await db
    .select()
    .from(websites)
    .where(eq(websites.leadId, id))
    .limit(1);

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.leadId, id))
    .limit(1);

  const leadNotes = await db
    .select()
    .from(notes)
    .where(eq(notes.leadId, id))
    .orderBy(desc(notes.createdAt));

  const l = lead.lead;
  const social = (l.socialLinks ?? {}) as Record<string, string>;
  const colors = (l.brandColors ?? []) as string[];
  const issues = (l.siteIssues ?? []) as string[];
  const photos = (l.googlePhotos ?? []) as string[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-sm text-muted-foreground">
            <Link href="/leads" className="hover:underline">
              Leads
            </Link>{" "}
            /{" "}
            <span>
              {lead.city}/{lead.nicheSlug}
            </span>
          </div>
          <h1 className="text-3xl font-semibold mt-1">{l.name}</h1>
          {l.category ? (
            <p className="text-muted-foreground">{l.category}</p>
          ) : null}
        </div>
        <Badge variant="secondary">{l.pipelineStage.replace("_", " ")}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact + location</CardTitle>
            </CardHeader>
            <CardContent>
              {field("Phone", l.phone)}
              {field("Email", l.email)}
              {field(
                "Website",
                l.website ? (
                  <a
                    href={l.website}
                    className="underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {l.website}
                  </a>
                ) : null
              )}
              {field("Address", l.fullAddress)}
              {field("Suburb", l.suburb)}
              {field("Postcode", l.postalCode)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Google profile</CardTitle>
            </CardHeader>
            <CardContent>
              {field(
                "Rating",
                l.googleRating ? `${l.googleRating} (${l.reviewCount ?? 0} reviews)` : null
              )}
              {field(
                "Maps",
                l.googlePlaceUrl ? (
                  <a
                    href={l.googlePlaceUrl}
                    className="underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in Google Maps
                  </a>
                ) : null
              )}
              {field(
                "Working hours",
                l.workingHours ? (
                  <pre className="whitespace-pre-wrap text-xs font-sans">
                    {l.workingHours as string}
                  </pre>
                ) : null
              )}
              {photos.length > 0 ? (
                <div className="pt-2">
                  <div className="text-sm text-muted-foreground mb-2">
                    Google photos
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {photos.slice(0, 5).map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="block aspect-square overflow-hidden rounded border"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {l.hasWebsite ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Current site (scraped)</CardTitle>
              </CardHeader>
              <CardContent>
                {field(
                  "URL",
                  l.website ? (
                    <a
                      href={l.website}
                      className="underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {l.website}
                    </a>
                  ) : null
                )}
                {colors.length > 0 ? (
                  <div className="flex items-center gap-3 py-2">
                    <div className="text-sm text-muted-foreground w-1/3">Brand colours</div>
                    <div className="flex gap-2">
                      {colors.map((c, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded border"
                          style={{ background: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
                {field(
                  "Logo",
                  l.logoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={l.logoUrl} alt="logo" className="h-10" />
                  ) : null
                )}
                {Object.keys(social).length > 0 ? (
                  <div className="grid grid-cols-3 gap-4 py-2 text-sm">
                    <div className="text-muted-foreground">Socials</div>
                    <div className="col-span-2 flex flex-wrap gap-2">
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
                  </div>
                ) : null}
                {issues.length > 0 ? (
                  <div className="grid grid-cols-3 gap-4 py-2 text-sm">
                    <div className="text-muted-foreground">Issues spotted</div>
                    <div className="col-span-2">
                      <ul className="list-disc pl-4">
                        {issues.map((iss, i) => (
                          <li key={i}>{iss}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
                {l.siteTextSnippet ? (
                  <div className="pt-2">
                    <div className="text-sm text-muted-foreground mb-1">
                      Page text snippet
                    </div>
                    <div className="text-xs bg-muted p-3 rounded max-h-40 overflow-y-auto whitespace-pre-wrap">
                      {l.siteTextSnippet}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {review ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Review notes</CardTitle>
              </CardHeader>
              <CardContent>
                {field("Design angle", review.designAngle)}
                {field("Missing data", review.missingData)}
                {field("Booking fallback", review.bookingFallback)}
                {field(
                  "Cold email draft",
                  review.coldEmailDraft ? (
                    <pre className="whitespace-pre-wrap text-xs font-sans">
                      {review.coldEmailDraft}
                    </pre>
                  ) : null
                )}
                {field("Notes", review.notes)}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Demo site</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {website ? (
                <>
                  <div>
                    <span className="text-muted-foreground">Status: </span>
                    <Badge variant="secondary">{website.status}</Badge>
                  </div>
                  {website.demoUrl ? (
                    <div>
                      <a
                        href={website.demoUrl}
                        className="underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {website.demoUrl}
                      </a>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No demo URL yet.</p>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">No demo built yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Client</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {client ? (
                <>
                  <div>
                    <span className="text-muted-foreground">Name: </span>
                    {client.contactName ?? "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email: </span>
                    {client.contactEmail}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Plan: </span>
                    <Badge variant="secondary">{client.plan}</Badge>
                  </div>
                  {client.signedUpAt ? (
                    <div>
                      <span className="text-muted-foreground">Signed up: </span>
                      {new Date(client.signedUpAt).toLocaleDateString()}
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-muted-foreground">
                  No client account linked yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {leadNotes.length === 0 ? (
                <p className="text-muted-foreground">No notes yet.</p>
              ) : (
                <ul className="space-y-3">
                  {leadNotes.map((n) => (
                    <li key={n.id}>
                      <div className="text-xs text-muted-foreground">
                        {n.authorRole === "client" ? "Client" : "Staff"} ·{" "}
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                      <div>{n.body}</div>
                      <Separator className="mt-3" />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
