import { db } from "@/db";
import { leads, websites, outreach, clients } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function countAll(table: typeof leads | typeof outreach) {
  const [row] = await db.select({ n: count() }).from(table);
  return row?.n ?? 0;
}

export default async function DashboardPage() {
  const [totalLeads, sitesBuiltRow, emailsSent, payingClientsRow] = await Promise.all([
    countAll(leads),
    db
      .select({ n: count() })
      .from(websites)
      .where(eq(websites.status, "built"))
      .then((r) => r[0]?.n ?? 0),
    countAll(outreach),
    db
      .select({ n: count() })
      .from(clients)
      .where(eq(clients.plan, "paid"))
      .then((r) => r[0]?.n ?? 0),
  ]);

  const stats = [
    { label: "Total leads", value: totalLeads },
    { label: "Demo sites built", value: sitesBuiltRow },
    { label: "Cold emails sent", value: emailsSent },
    { label: "Paying clients", value: payingClientsRow },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of the Rapid Refresh pipeline.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Next steps</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Hit the Import page to sync scraper output into the database.</p>
          <p>2. Walk a batch of 10 leads, mark each one reviewed.</p>
          <p>3. Send the first cold email when a demo is ready.</p>
        </CardContent>
      </Card>
    </div>
  );
}
