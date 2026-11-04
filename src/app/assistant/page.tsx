"use client";

import { useChat } from "ai/react";
import { Send, Bot } from "lucide-react";
import clsx from "clsx";

const STARTERS = [
  "How am I doing on my budget this month?",
  "I'm at 1,900 kcal today. What can I eat tonight to hit my target?",
  "My shoulder hurt on bench press today. What should I change?",
  "Explain the Lithuanian investment account simply.",
];

export default function AssistantPage() {
  const { messages, input, handleInputChange, handleSubmit, append, status, error } = useChat({ api: "/api/chat" });
  const busy = status === "submitted" || status === "streaming";

  return (
    <div className="flex h-[calc(100dvh-8rem)] flex-col lg:h-[calc(100dvh-4rem)]">
      <header className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Other</p>
        <h1 className="text-2xl font-semibold">AI assistant</h1>
        <p className="mt-1 text-sm text-muted">Knows this month&apos;s money, today&apos;s food and your training plan.</p>
      </header>

      <div className="card flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <Bot size={28} className="text-accent" />
            <div className="flex max-w-xl flex-wrap justify-center gap-2">
              {STARTERS.map((s) => (
                <button key={s} className="chip text-sm text-muted hover:text-ink" onClick={() => append({ role: "user", content: s })}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={clsx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={clsx("max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm", m.role === "user" ? "bg-accent text-white" : "bg-raised")}>
              {m.content}
            </div>
          </div>
        ))}
        {error && <p className="text-sm text-bad">Something went wrong: {error.message}</p>}
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input className="input" placeholder="Ask anything…" value={input} onChange={handleInputChange} />
        <button className="btn-primary" disabled={busy || !input.trim()} aria-label="Send"><Send size={16} /></button>
      </form>
    </div>
  );
}
