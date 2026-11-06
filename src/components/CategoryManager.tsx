"use client";

import { useState, useTransition } from "react";
import clsx from "clsx";
import { Archive, ArchiveRestore, Plus } from "lucide-react";
import { addCategory, setCategoryArchived } from "@/app/actions";

type Cat = { id: string; name: string; type: string; color: string; isArchived: boolean };

const TYPES = [
  ["variable", "Miscellaneous"], ["fixed", "Fixed bill"], ["subscription", "Subscription"], ["debt", "Debt"],
  ["family_giving", "Family"], ["income_salary", "Income: salary"], ["income_haircut", "Income: haircuts"], ["income_other", "Income: other"], ["savings", "Savings"],
] as const;
const typeLabel = (t: string) => TYPES.find(([k]) => k === t)?.[1] ?? t;

export default function CategoryManager({ categories }: { categories: Cat[] }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("variable");
  const [showArchived, setShowArchived] = useState(false);
  const [pending, start] = useTransition();
  const list = categories.filter((c) => showArchived || !c.isArchived);

  return (
    <div>
      <form
        className="mb-4 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          start(async () => { await addCategory(name, type); setName(""); });
        }}
      >
        <input className="input min-w-[10rem] flex-1" placeholder="New category" value={name} onChange={(e) => setName(e.target.value)} />
        <select className="input !w-auto" value={type} onChange={(e) => setType(e.target.value)}>
          {TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <button className="btn-primary" disabled={pending}><Plus size={16} /> Add</button>
      </form>
      <ul className={clsx("divide-y divide-line rounded-xl border border-line", pending && "opacity-60")}>
        {list.map((c) => (
          <li key={c.id} className={clsx("flex items-center gap-3 px-3 py-2.5", c.isArchived && "opacity-50")}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
            <span className="flex-1 text-sm">{c.name}</span>
            <span className="text-xs text-muted">{typeLabel(c.type)}</span>
            <button
              aria-label={c.isArchived ? "Restore" : "Archive"}
              className="rounded p-1.5 text-muted hover:text-ink"
              onClick={() => start(() => setCategoryArchived(c.id, !c.isArchived))}
              title={c.isArchived ? "Restore" : "Archive (hides it; past transactions are kept)"}
            >
              {c.isArchived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
            </button>
          </li>
        ))}
      </ul>
      <label className="mt-3 flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> Show archived
      </label>
    </div>
  );
}
