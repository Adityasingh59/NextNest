import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { getSessionFromCookies } from "@/lib/auth-server";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/listings", label: "Discover" },
  { href: "/listings/new", label: "Create Listing" },
  { href: "/profile", label: "Profile" },
  { href: "/workflow", label: "Workflow" }
];

export async function SiteHeader() {
  const session = await getSessionFromCookies();

  return (
    <header className="sticky top-0 z-40 border-b border-[hsl(var(--border))] bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[hsl(var(--primary))] text-sm font-bold text-white">
            NN
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[hsl(var(--primary))]">
              NextNest
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Verified student lease marketplace
            </p>
          </div>
        </Link>

        {session ? (
          <div className="hidden items-center gap-5 md:flex">
            <nav className="flex items-center gap-6 text-sm font-medium text-[hsl(var(--muted-foreground))]">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="transition hover:text-[hsl(var(--foreground))]">
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{session.displayName}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{session.email}</p>
              </div>
              <LogoutButton />
            </div>
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-sm font-semibold text-white"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
