import Link from "next/link";
import { LogoutButton } from "@/components/client/logout-button";
import { getCurrentUser, isAdmin } from "@/lib/session";

export async function SiteHeader() {
  const user = await getCurrentUser();

  const nav = user
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/preferences", label: "Preferences" },
        { href: "/listings/new", label: "List a room" },
        ...(isAdmin(user)
          ? [
              { href: "/admin/review", label: "Review" },
              { href: "/analytics", label: "Analytics" }
            ]
          : [])
      ]
    : [];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface-raised/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2">
          <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-md bg-nest text-body-sm font-bold text-on-nest">
            NN
          </span>
          <span className="text-heading-sm text-ink">NextNest</span>
        </Link>
        {user ? (
          <div className="flex items-center gap-3">
            <span className="hidden text-body-sm text-ink-muted sm:inline">{user.market?.name}</span>
            <LogoutButton />
          </div>
        ) : (
          <Link href="/login" className="nn-btn nn-btn-sm nn-btn-primary">
            Sign in
          </Link>
        )}
      </div>
      {nav.length > 0 ? (
        <nav aria-label="Main" className="mx-auto max-w-6xl overflow-x-auto px-4 sm:px-6">
          <ul className="flex gap-1 pb-2">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="block whitespace-nowrap rounded-md px-3 py-2 text-body-sm font-medium text-ink-muted hover:bg-surface-sunken hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
