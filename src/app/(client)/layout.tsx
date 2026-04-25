import { requireClient } from "@/lib/auth";
import { AppNav } from "@/components/app-nav";

const clientNav = [
  { href: "/my-demo", label: "My demo site" },
  { href: "/profile", label: "Profile" },
];

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  await requireClient();
  return (
    <div className="flex flex-col min-h-screen">
      <AppNav title="bight" items={clientNav} />
      <main className="flex-1 mx-auto max-w-4xl w-full px-4 py-8">{children}</main>
    </div>
  );
}
