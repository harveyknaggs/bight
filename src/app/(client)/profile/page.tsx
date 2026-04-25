import { db } from "@/db";
import { clients, leads, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function ProfilePage() {
  const session = await auth();
  const userId = session!.user.id;

  const [user] = await db
    .select({ email: users.email, name: users.name, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const [client] = await db
    .select({
      contactName: clients.contactName,
      contactEmail: clients.contactEmail,
      plan: clients.plan,
      signedUpAt: clients.signedUpAt,
      leadId: clients.leadId,
    })
    .from(clients)
    .where(eq(clients.userId, userId))
    .limit(1);

  const [lead] = client
    ? await db
        .select({
          name: leads.name,
          category: leads.category,
          fullAddress: leads.fullAddress,
          phone: leads.phone,
        })
        .from(leads)
        .where(eq(leads.id, client.leadId))
        .limit(1)
    : [undefined];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Your account and the business it&apos;s linked to.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="text-sm grid gap-y-3">
            <Row label="Login email" value={user?.email} />
            <Row label="Display name" value={user?.name ?? client?.contactName} />
            <Row
              label="Account created"
              value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : null}
            />
          </dl>
        </CardContent>
      </Card>

      {client ? (
        <Card>
          <CardHeader>
            <CardTitle>Business</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="text-sm grid gap-y-3">
              <Row label="Business" value={lead?.name} />
              <Row label="Category" value={lead?.category} />
              <Row label="Address" value={lead?.fullAddress} />
              <Row label="Phone" value={lead?.phone} />
              <Row label="Plan" value={client.plan} />
              <Row
                label="Signed up"
                value={
                  client.signedUpAt
                    ? new Date(client.signedUpAt).toLocaleDateString()
                    : null
                }
              />
            </dl>
            <Separator className="my-4" />
            <p className="text-xs text-muted-foreground">
              Need to update something? Reply to Harvey&apos;s last email.
            </p>
          </CardContent>
        </Card>
      ) : null}
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
