"use client";

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, ReferenceLine, Legend,
} from "recharts";

const axis = { stroke: "rgb(var(--muted))", fontSize: 11, tickLine: false, axisLine: false };
const tooltipStyle = {
  contentStyle: { background: "rgb(var(--panel))", border: "1px solid rgb(var(--line))", borderRadius: 10, fontSize: 12 },
  labelStyle: { color: "rgb(var(--muted))" },
};
const short = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export function WeightChart({ data }: { data: { date: string; kg?: number; avg?: number; plan?: number }[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="rgb(var(--line))" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tickFormatter={short} {...axis} minTickGap={24} />
          <YAxis domain={["dataMin - 1", "dataMax + 1"]} {...axis} />
          <Tooltip {...tooltipStyle} labelFormatter={(l) => short(String(l))} formatter={(v: number, n: string) => [`${v} kg`, n]} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="plan" name="Plan (0.375 kg/wk)" stroke="rgb(var(--muted))" strokeDasharray="5 5" dot={false} connectNulls />
          <Line type="monotone" dataKey="kg" name="Weigh-in" stroke="rgb(var(--accent))" strokeOpacity={0.35} dot={{ r: 2.5 }} connectNulls />
          <Line type="monotone" dataKey="avg" name="7-day average" stroke="rgb(var(--accent))" strokeWidth={2.5} dot={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CaloriesChart({ data, target }: { data: { date: string; kcal: number; protein: number }[]; target: number }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="rgb(var(--line))" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tickFormatter={short} {...axis} minTickGap={12} />
          <YAxis {...axis} />
          <Tooltip {...tooltipStyle} cursor={{ fill: "rgb(var(--raised))" }} labelFormatter={(l) => short(String(l))} />
          <ReferenceLine y={target} stroke="rgb(var(--warn))" strokeDasharray="4 4" />
          <Bar dataKey="kcal" name="kcal" fill="rgb(var(--warn))" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MoneyTrend({ data }: { data: { label: string; income: number; spent: number; saved: number }[] }) {
  return (
    <div className="h-60 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="rgb(var(--line))" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" {...axis} />
          <YAxis {...axis} />
          <Tooltip {...tooltipStyle} cursor={{ fill: "rgb(var(--raised))" }} formatter={(v: number) => `€${v.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="income" name="Income" fill="rgb(var(--good))" radius={[4, 4, 0, 0]} maxBarSize={22} />
          <Bar dataKey="spent" name="Spent" fill="rgb(var(--bad))" radius={[4, 4, 0, 0]} maxBarSize={22} />
          <Bar dataKey="saved" name="Saved" fill="rgb(var(--accent))" radius={[4, 4, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
