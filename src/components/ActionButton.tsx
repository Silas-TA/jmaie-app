"use client";

import { useTransition } from "react";
import clsx from "clsx";

/** A button that runs a server action, with an optional confirm prompt. */
export default function ActionButton({
  action, children, confirmText, className = "btn-ghost",
}: { action: () => Promise<void>; children: React.ReactNode; confirmText?: string; className?: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className={clsx(className, pending && "opacity-60")}
      onClick={() => {
        if (confirmText && !confirm(confirmText)) return;
        start(() => action());
      }}
    >
      {pending ? "Working…" : children}
    </button>
  );
}
