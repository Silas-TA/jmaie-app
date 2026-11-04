import Link from "next/link";
import { Bot, ChevronRight, LineChart, PieChart, Scissors, Settings, Target, BookOpen, LogOut } from "lucide-react";
import { PageHeader } from "@/components/ui";

const LINKS = [
  { href: "/money/budget", label: "Budget", icon: PieChart },
  { href: "/money/goals", label: "Savings & investing", icon: Target },
  { href: "/cuts", label: "iCut bookings", icon: Scissors },
  { href: "/health/meals", label: "Meal plan & recipes", icon: BookOpen },
  { href: "/health/progress", label: "Progress", icon: LineChart },
  { href: "/assistant", label: "AI assistant", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function MorePage() {
  return (
    <>
      <PageHeader title="More" />
      <ul className="card divide-y divide-line">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-raised">
              <Icon size={18} className="text-muted" />
              <span className="flex-1">{label}</span>
              <ChevronRight size={16} className="text-muted" />
            </Link>
          </li>
        ))}
      </ul>
      <form action="/api/logout" method="post" className="mt-4">
        <button className="btn-ghost w-full"><LogOut size={16} /> Sign out</button>
      </form>
    </>
  );
}
