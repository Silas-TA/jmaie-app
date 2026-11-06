"use client";

import { useEffect, useState, useTransition } from "react";
import clsx from "clsx";
import { Scissors } from "lucide-react";
import { setIncludeHaircut } from "@/app/actions";

/** Switch: count haircut income (and iCut costs) in the main totals or not. */
export default function HaircutToggle({ on, compact = false }: { on: boolean; compact?: boolean }) {
  const [pending, start] = useTransition();
  const [value, setValue] = useState(on);
  useEffect(() => setValue(on), [on]);
  const flip = () =>
    start(async () => {
      const next = !value;
      setValue(next);
      await setIncludeHaircut(next);
    });

  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label="Include haircut income in totals"
      onClick={flip}
      disabled={pending}
      title={value ? "Haircut income is counted in your totals. Tap to leave it out." : "Haircut income is left out of your totals. Tap to include it."}
      className={clsx(
        "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm transition",
        value ? "border-line bg-panel text-ink" : "border-line bg-raised text-muted"
      )}
    >
      {!compact && <Scissors size={14} className={value ? "text-[#8B5CF6]" : ""} />}
      <span>{compact ? "Count in totals" : "Haircut income"}</span>
      <span className={clsx("relative h-5 w-9 rounded-full transition", value ? "bg-good" : "bg-line")}>
        <span className={clsx("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", value ? "left-[18px]" : "left-0.5")} />
      </span>
    </button>
  );
}
