"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useBottles } from "@/components/BottlesProvider";
import { last7Days } from "@/lib/day";
import { getDeviceTz } from "@/lib/format";

const SHORT_DAY = new Intl.DateTimeFormat("fr-CA", { weekday: "short" });

function shortLabel(dayKey: string): string {
  const [y, m, d] = dayKey.split("-").map((s) => parseInt(s, 10));
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  const wd = SHORT_DAY.format(date).replace(".", "");
  return wd.charAt(0).toUpperCase() + wd.slice(1);
}

export default function StatsPage() {
  const { bottles, loading } = useBottles();
  const tz = getDeviceTz();

  const data = useMemo(() => {
    const series = last7Days(bottles, new Date(), tz);
    return series.map((d) => ({
      day: d.day,
      label: shortLabel(d.day),
      ml: d.totalMl,
    }));
  }, [bottles, tz]);

  const weekTotal = data.reduce((s, d) => s + d.ml, 0);
  const avg = Math.round(weekTotal / 7);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-sm font-medium uppercase tracking-wide text-(--color-ink-soft)">
          Stats — 7 derniers jours
        </h1>
      </header>

      <section className="rounded-3xl bg-(--color-surface) p-4 shadow-sm">
        <div className="flex items-baseline justify-between px-2 pb-3">
          <div>
            <div className="text-2xl font-bold tabular-nums">
              {avg} <span className="text-base font-normal text-(--color-ink-soft)">ml/jour</span>
            </div>
            <div className="text-xs text-(--color-ink-soft)">
              Moyenne sur 7 jours
            </div>
          </div>
          <div className="text-right text-xs text-(--color-ink-soft)">
            Total : {weekTotal} ml
          </div>
        </div>
        <div className="h-64">
          {loading ? (
            <p className="text-sm text-(--color-ink-soft)">Chargement…</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
                <CartesianGrid stroke="#ece1eb" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "#6b5e72" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6b5e72" }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  cursor={{ fill: "#fde2e640" }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #ece1eb",
                    background: "#fff",
                  }}
                  formatter={(v) => [`${v as number} ml`, "Total"]}
                />
                <Bar
                  dataKey="ml"
                  fill="#f4a8b3"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  );
}
