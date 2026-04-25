import Link from "next/link";
import { logout } from "@/app/actions/logout";
import { Button } from "@/components/ui/button";

type NavItem = { href: string; label: string };

export function AppNav({ items, title }: { items: NavItem[]; title: string }) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold">
            {title}
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            {items.map((it) => (
              <Link key={it.href} href={it.href} className="hover:text-foreground">
                {it.label}
              </Link>
            ))}
          </nav>
        </div>
        <form action={logout}>
          <Button type="submit" variant="ghost" size="sm">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
