import Link from "next/link";
import { db } from "@/db";
import { leads, niches } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const stageStyles: Record<string, string> = {
  scraped: "bg-zinc-100 text-zinc-800",
  site_built: "bg-blue-100 text-blue-800",
  reviewed: "bg-violet-100 text-violet-800",
  emailed: "bg-amber-100 text-amber-800",
  replied: "bg-emerald-100 text-emerald-800",
  signed_up: "bg-green-100 text-green-800",
};

export default async function LeadsPage() {
  const rows = await db
    .select({
      id: leads.id,
      name: leads.name,
      category: leads.category,
      suburb: leads.suburb,
      fullAddress: leads.fullAddress,
      phone: leads.phone,
      hasWebsite: leads.hasWebsite,
      googleRating: leads.googleRating,
      reviewCount: leads.reviewCount,
      pipelineStage: leads.pipelineStage,
      city: niches.city,
      nicheSlug: niches.slug,
    })
    .from(leads)
    .leftJoin(niches, eq(leads.nicheId, niches.id))
    .orderBy(desc(leads.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Leads</h1>
          <p className="text-muted-foreground mt-1">
            {rows.length} {rows.length === 1 ? "lead" : "leads"} from the scraper.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All leads</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Niche</TableHead>
                <TableHead>Suburb</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Site?</TableHead>
                <TableHead>Stage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const stage = r.pipelineStage;
                return (
                  <TableRow key={r.id} className="hover:bg-muted/40">
                    <TableCell>
                      <Link
                        href={`/leads/${r.id}`}
                        className="font-medium hover:underline"
                      >
                        {r.name}
                      </Link>
                      {r.category ? (
                        <div className="text-xs text-muted-foreground">
                          {r.category}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.city ? `${r.city}/${r.nicheSlug}` : "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.suburb ?? r.fullAddress?.split(",").slice(-2, -1)[0]?.trim() ?? "-"}
                    </TableCell>
                    <TableCell className="text-sm">{r.phone ?? "-"}</TableCell>
                    <TableCell className="text-sm">
                      {r.googleRating ? (
                        <span>
                          {r.googleRating}{" "}
                          <span className="text-muted-foreground">
                            ({r.reviewCount ?? 0})
                          </span>
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.hasWebsite ? "Yes" : "No"}
                    </TableCell>
                    <TableCell>
                      <Badge className={stageStyles[stage] ?? ""} variant="secondary">
                        {stage.replace("_", " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No leads yet. Run <code>npm run sync</code> to import from the scraper folder.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
