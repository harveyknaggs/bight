import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function countRows(table: string, filter?: { column: string; value: string }) {
  const supabase = await createClient();
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) query = query.eq(filter.column, filter.value);
  const { count } = await query;
  return count ?? 0;
}

export default async function DashboardPage() {
  const [totalLeads, sitesBuilt, emailsSent, clientsSignedUp] = await Promise.all([
    countRows("leads"),
    countRows("websites", { column: "status", value: "built" }),
    countRows("outreach").catch(() => 0),
    countRows("clients", { column: "plan", value: "paid" }).catch(() => 0),
  ]);

  const stats = [
    { label: "Total leads", value: totalLeads },
    { label: "Demo sites built", value: sitesBuilt },
    { label: "Cold emails sent", value: emailsSent },
    { label: "Paying clients", value: clientsSignedUp },
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
          <p>1. Create your Supabase project and run the migrations in <code>supabase/migrations</code>.</p>
          <p>2. Add yourself to <code>staff_users</code> (see <code>supabase/README.md</code>).</p>
          <p>3. Hit the Import page to sync scraper output into the database.</p>
        </CardContent>
      </Card>
    </div>
  );
}
