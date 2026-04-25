import { requireStaff } from "@/lib/auth";
import { AppNav } from "@/components/app-nav";

const staffNav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/niches", label: "Niches" },
  { href: "/leads", label: "Leads" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/batch", label: "Batch" },
  { href: "/import", label: "Import" },
];

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  await requireStaff();
  return (
    <div className="flex flex-col min-h-screen">
      <AppNav title="bight" items={staffNav} />
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8">{children}</main>
    </div>
  );
}
