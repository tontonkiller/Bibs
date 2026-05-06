import { describe, it, expect } from "vitest";
import {
  dayBucket,
  dayTotals,
  groupByDay,
  last7Days,
} from "../lib/day";
import type { Bottle, FeedKind } from "../lib/types";

const TZ_MTL = "America/Montreal";

type BottleOpts = {
  amount?: number | null;
  duration?: number | null;
  kind?: FeedKind;
  id?: string;
};

function bottle(drunkAtIso: string, opts: BottleOpts = {}): Bottle {
  const kind = opts.kind ?? "formula";
  const amount =
    opts.amount === undefined ? (kind === "breast" ? null : 90) : opts.amount;
  const duration =
    opts.duration === undefined ? (kind === "breast" ? 15 : null) : opts.duration;
  return {
    id: opts.id ?? drunkAtIso,
    baby_id: "test-baby",
    drunk_at: drunkAtIso,
    kind,
    amount_ml: amount,
    duration_min: duration,
    note: null,
    created_at: drunkAtIso,
    updated_at: drunkAtIso,
  };
}

describe("dayBucket (6h-6h boundary)", () => {
  it("biberon à 02h30 locale → compte pour la veille", () => {
    expect(dayBucket("2024-05-05T06:30:00Z", TZ_MTL)).toBe("2024-05-04");
  });

  it("biberon à 06h00 pile locale → nouveau jour", () => {
    expect(dayBucket("2024-05-05T10:00:00Z", TZ_MTL)).toBe("2024-05-05");
  });

  it("biberon à 05h59 locale → veille", () => {
    expect(dayBucket("2024-05-05T09:59:00Z", TZ_MTL)).toBe("2024-05-04");
  });

  it("biberon à 23h59 locale → jour en cours", () => {
    expect(dayBucket("2024-05-06T03:59:00Z", TZ_MTL)).toBe("2024-05-05");
  });

  it("biberon à midi → jour en cours", () => {
    expect(dayBucket("2024-05-05T16:00:00Z", TZ_MTL)).toBe("2024-05-05");
  });

  it("DST printemps : 04h00 EDT le dimanche du changement → veille", () => {
    expect(dayBucket("2024-03-10T08:00:00Z", TZ_MTL)).toBe("2024-03-09");
  });

  it("DST automne : 01h30 EDT (avant bascule) le dimanche → veille", () => {
    expect(dayBucket("2024-11-03T05:30:00Z", TZ_MTL)).toBe("2024-11-02");
  });

  it("accepte un objet Date", () => {
    const d = new Date("2024-05-05T16:00:00Z");
    expect(dayBucket(d, TZ_MTL)).toBe("2024-05-05");
  });
});

describe("dayTotals (ml + min séparés)", () => {
  it("formula et pumped contribuent aux ml ; breast contribue aux min", () => {
    const bottles: Bottle[] = [
      bottle("2024-05-05T16:00:00Z", { kind: "formula", amount: 90 }),
      bottle("2024-05-05T20:00:00Z", { kind: "pumped", amount: 80 }),
      bottle("2024-05-06T01:00:00Z", { kind: "breast", duration: 20 }),
      bottle("2024-05-06T03:00:00Z", { kind: "breast", duration: 15 }),
    ];
    expect(dayTotals(bottles, "2024-05-05", TZ_MTL)).toEqual({
      ml: 90 + 80,
      min: 20 + 15,
    });
  });

  it("ne compte pas les biberons hors de la journée 6h-6h", () => {
    const bottles: Bottle[] = [
      bottle("2024-05-05T03:00:00Z", { kind: "formula", amount: 60 }), // veille
      bottle("2024-05-05T16:00:00Z", { kind: "formula", amount: 90 }),
      bottle("2024-05-06T16:00:00Z", { kind: "formula", amount: 70 }), // lendemain
    ];
    expect(dayTotals(bottles, "2024-05-05", TZ_MTL).ml).toBe(90);
  });

  it("amount_ml null sur breast n'écroule pas la somme", () => {
    const bottles: Bottle[] = [
      bottle("2024-05-05T16:00:00Z", { kind: "breast", duration: 25 }),
    ];
    expect(dayTotals(bottles, "2024-05-05", TZ_MTL)).toEqual({ ml: 0, min: 25 });
  });

  it("liste vide → totaux 0/0", () => {
    expect(dayTotals([], "2024-05-05", TZ_MTL)).toEqual({ ml: 0, min: 0 });
  });
});

describe("groupByDay", () => {
  it("regroupe par bucket 6h-6h, ml et min totaux par jour, ordre desc", () => {
    const bottles: Bottle[] = [
      bottle("2024-05-05T16:00:00Z", { kind: "formula", amount: 90, id: "a" }),
      bottle("2024-05-06T08:00:00Z", { kind: "breast", duration: 20, id: "b" }), // 04h EDT le 6 → bucket 2024-05-05
      bottle("2024-05-06T16:00:00Z", { kind: "pumped", amount: 70, id: "c" }),
    ];
    const groups = groupByDay(bottles, TZ_MTL);
    expect(groups.map((g) => g.day)).toEqual(["2024-05-06", "2024-05-05"]);
    expect(groups[0]).toMatchObject({ totalMl: 70, totalMin: 0 });
    expect(groups[1]).toMatchObject({ totalMl: 90, totalMin: 20 });
    expect(groups[1].bottles.map((b) => b.id)).toEqual(["b", "a"]);
  });

  it("liste vide → tableau vide", () => {
    expect(groupByDay([], TZ_MTL)).toEqual([]);
  });
});

describe("last7Days", () => {
  it("retourne 7 entrées avec ml et min par jour", () => {
    const today = new Date("2024-05-05T16:00:00Z");
    const bottles: Bottle[] = [
      bottle("2024-05-05T16:00:00Z", { kind: "formula", amount: 90 }),
      bottle("2024-05-06T05:00:00Z", { kind: "breast", duration: 18 }), // 01h EDT le 6 → bucket 2024-05-05
      bottle("2024-05-04T18:00:00Z", { kind: "pumped", amount: 80 }),
      bottle("2024-04-29T18:00:00Z", { kind: "formula", amount: 50 }),
      bottle("2024-04-28T18:00:00Z", { kind: "formula", amount: 30 }), // hors fenêtre
    ];
    const series = last7Days(bottles, today, TZ_MTL);
    expect(series).toHaveLength(7);
    expect(series.map((d) => d.day)).toEqual([
      "2024-04-29",
      "2024-04-30",
      "2024-05-01",
      "2024-05-02",
      "2024-05-03",
      "2024-05-04",
      "2024-05-05",
    ]);
    expect(series[0]).toEqual({ day: "2024-04-29", ml: 50, min: 0 });
    expect(series[5]).toEqual({ day: "2024-05-04", ml: 80, min: 0 });
    expect(series[6]).toEqual({ day: "2024-05-05", ml: 90, min: 18 });
  });

  it("aucun biberon → 7 jours à 0/0", () => {
    const today = new Date("2024-05-05T16:00:00Z");
    const series = last7Days([], today, TZ_MTL);
    expect(series).toHaveLength(7);
    expect(series.every((d) => d.ml === 0 && d.min === 0)).toBe(true);
  });
});
