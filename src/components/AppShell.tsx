"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Wallet, Scissors, Salad, Dumbbell, PieChart, MoreHorizontal,
  Bot, Settings, LogOut, LineChart, BookOpen,
} from "lucide-react";
import clsx from "clsx";

const SECTIONS = [
  {
    title: "",
    items: [{ href: "/", label: "Overview", icon: LayoutDashboard }],
  },
  {
    title: "Money",
    items: [
      { href: "/money", label: "Transactions", icon: Wallet },
      { href: "/money/budget", label: "Budget & savings", icon: PieChart },
      { href: "/cuts", label: "iCut bookings", icon: Scissors },
    ],
  },
  {
    title: "Health",
    items: [
      { href: "/health", label: "Today's food", icon: Salad },
      { href: "/health/meals", label: "Meal plan", icon: BookOpen },
      { href: "/health/gym", label: "Gym", icon: Dumbbell },
      { href: "/health/progress", label: "Progress", icon: LineChart },
    ],
  },
  {
    title: "Other",
    items: [
      { href: "/assistant", label: "AI assistant", icon: Bot },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

const MOBILE = [
  { href: "/", label: "Home", icon: LayoutDashboard, match: (p: string) => p === "/" },
  { href: "/money", label: "Money", icon: Wallet, match: (p: string) => p.startsWith("/money") || p.startsWith("/cuts") },
  { href: "/health", label: "Food", icon: Salad, match: (p: string) => p === "/health" || p.startsWith("/health/meals") },
  { href: "/health/gym", label: "Gym", icon: Dumbbell, match: (p: string) => p.startsWith("/health/gym") || p.startsWith("/health/progress") },
  { href: "/more", label: "More", icon: MoreHorizontal, match: (p: string) => ["/more", "/assistant", "/settings"].some((x) => p.startsWith(x)) },
];

function isActive(path: string, href: string) {
  if (href === "/") return path === "/";
  if (href === "/money" || href === "/health") return path === href;
  return path.startsWith(href);
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path.startsWith("/login")) return <>{children}</>;

  return (
    <div className="min-h-dvh lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-panel px-3 py-5 lg:flex">
        <div className="mb-6 flex items-center gap-2 px-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">J</div>
          <span className="font-semibold">Jmaie</span>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto">
          {SECTIONS.map((s) => (
            <div key={s.title || "top"}>
              {s.title && <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">{s.title}</p>}
              <ul className="space-y-0.5">
                {s.items.map(({ href, label, icon: Icon }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className={clsx(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                        isActive(path, href) ? "bg-accent/15 font-medium text-accent" : "text-muted hover:bg-raised hover:text-ink"
                      )}
                    >
                      <Icon size={17} />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <form action="/api/logout" method="post">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted hover:bg-raised hover:text-ink">
            <LogOut size={17} /> Sign out
          </button>
        </form>
      </aside>

      <main className="min-w-0 flex-1 pb-24 lg:pb-10">
        <div className="mx-auto w-full max-w-6xl px-4 pt-5 sm:px-6 lg:px-8 lg:pt-8">{children}</div>
      </main>

      {/* Mobile bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-panel/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <ul className="grid grid-cols-5">
          {MOBILE.map(({ href, label, icon: Icon, match }) => (
            <li key={href}>
              <Link href={href} className={clsx("flex flex-col items-center gap-1 py-2.5 text-[11px]", match(path) ? "text-accent" : "text-muted")}>
                <Icon size={20} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
