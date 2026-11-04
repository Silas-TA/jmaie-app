"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

type Mode = "system" | "dark" | "light";

function apply(mode: Mode) {
  const el = document.documentElement;
  if (mode === "system") el.removeAttribute("data-theme");
  else el.setAttribute("data-theme", mode);
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("dark");
  useEffect(() => {
    try {
      const m = (localStorage.getItem("theme") as Mode) || "dark";
      setMode(m);
    } catch {}
  }, []);
  const choose = (m: Mode) => {
    setMode(m);
    apply(m);
    try { localStorage.setItem("theme", m); } catch {}
  };
  return (
    <div className="flex rounded-lg border border-line bg-raised p-0.5 text-sm">
      {(["dark", "light", "system"] as const).map((m) => (
        <button key={m} onClick={() => choose(m)} className={clsx("rounded-md px-3 py-1 capitalize", mode === m ? "bg-panel text-ink" : "text-muted")}>{m}</button>
      ))}
    </div>
  );
}
