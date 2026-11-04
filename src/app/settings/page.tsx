import { Download, LogOut } from "lucide-react";
import { PageHeader, Card } from "@/components/ui";
import CategoryManager from "@/components/CategoryManager";
import ThemeToggle from "@/components/ThemeToggle";
import { getCategories } from "@/lib/finance";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const categories = await getCategories(true);
  return (
    <>
      <PageHeader eyebrow="Other" title="Settings" />
      <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
        <Card title="Categories">
          <CategoryManager categories={categories} />
        </Card>
        <div className="min-w-0 space-y-5">
          <Card title="Appearance">
            <ThemeToggle />
          </Card>
          <Card title="Your data">
            <a href="/api/export" className="btn-ghost w-full"><Download size={16} /> Download all transactions (CSV)</a>
          </Card>
          <form action="/api/logout" method="post">
            <button className="btn-ghost w-full"><LogOut size={16} /> Sign out</button>
          </form>
        </div>
      </div>
    </>
  );
}
