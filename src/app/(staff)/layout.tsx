import { requireStaff } from "@/lib/auth";
import { AppNav } from "@/components/app-nav";
import "./staff-design.css";

const staffNav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leads", label: "Leads" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/batch", label: "Batch" },
  { href: "/import", label: "Import" },
  { href: "/pricing", label: "Pricing" },
];

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  await requireStaff();
  return (
    <div className="flex flex-col min-h-screen">
      <AppNav title="bight" items={staffNav} />
      <main className="ld-root flex-1 w-full">{children}</main>
    </div>
  );
}
