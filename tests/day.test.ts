import { describe, it, expect } from "vitest";
import {
  dayBucket,
  totalForDay,
  groupByDay,
  last7Days,
} from "../lib/day";
import type { Bottle } from "../lib/types";

const TZ_MTL = "America/Montreal";

function bottle(drunkAtIso: string, amount = 90, id = drunkAtIso): Bottle {
  return {
    id,
    drunk_at: drunkAtIso,
    amount_ml: amount,
    note: null,
    created_at: drunkAtIso,
    updated_at: drunkAtIso,
  };
}

describe("dayBucket (6h-6h boundary)", () => {
  it("biberon à 02h30 locale → compte pour la veille", () => {
    // 02h30 EST le 5 mai 2024 = 06h30 UTC (EDT, UTC-4)
    expect(dayBucket("2024-05-05T06:30:00Z", TZ_MTL)).toBe("2024-05-04");
  });

  it("biberon à 06h00 pile locale → nouveau jour", () => {
    // 06h00 EDT le 5 mai 2024 = 10h00 UTC
    expect(dayBucket("2024-05-05T10:00:00Z", TZ_MTL)).toBe("2024-05-05");
  });

  it("biberon à 05h59 locale → veille", () => {
    expect(dayBucket("2024-05-05T09:59:00Z", TZ_MTL)).toBe("2024-05-04");
  });

  it("biberon à 23h59 locale → jour en cours", () => {
    // 23h59 EDT le 5 mai 2024 = 03h59 UTC le 6 mai
    expect(dayBucket("2024-05-06T03:59:00Z", TZ_MTL)).toBe("2024-05-05");
  });

  it("biberon à midi → jour en cours", () => {
    expect(dayBucket("2024-05-05T16:00:00Z", TZ_MTL)).toBe("2024-05-05");
  });

  it("DST printemps : 04h00 EDT le dimanche du changement → veille", () => {
    // Dim 10 mars 2024, à 02h00 EST le clock saute à 03h00 EDT.
    // 04h00 EDT le 10 mars = 08h00 UTC.
    expect(dayBucket("2024-03-10T08:00:00Z", TZ_MTL)).toBe("2024-03-09");
  });

  it("DST automne : 01h30 EDT (avant bascule) le dimanche → veille", () => {
    // Dim 3 nov 2024, à 02h00 EDT clock recule à 01h00 EST.
    // 01h30 EDT le 3 nov = 05h30 UTC. Heure locale < 06h → veille.
    expect(dayBucket("2024-11-03T05:30:00Z", TZ_MTL)).toBe("2024-11-02");
  });

  it("accepte un objet Date", () => {
    const d = new Date("2024-05-05T16:00:00Z");
    expect(dayBucket(d, TZ_MTL)).toBe("2024-05-05");
  });
});

describe("totalForDay", () => {
  it("somme uniquement les biberons de la journée 6h-6h", () => {
    const bottles: Bottle[] = [
      bottle("2024-05-05T03:00:00Z", 60), // 23h00 EDT le 4 → bucket 2024-05-04
      bottle("2024-05-05T16:00:00Z", 90), // 12h00 EDT le 5 → bucket 2024-05-05
      bottle("2024-05-06T03:00:00Z", 80), // 23h00 EDT le 5 → bucket 2024-05-05
      bottle("2024-05-06T08:00:00Z", 50), // 04h00 EDT le 6 → bucket 2024-05-05
      bottle("2024-05-06T16:00:00Z", 70), // 12h00 EDT le 6 → bucket 2024-05-06
    ];
    expect(totalForDay(bottles, "2024-05-05", TZ_MTL)).toBe(90 + 80 + 50);
  });

  it("retourne 0 si aucun biberon ce jour-là", () => {
    expect(totalForDay([], "2024-05-05", TZ_MTL)).toBe(0);
  });
});

describe("groupByDay", () => {
  it("regroupe par bucket 6h-6h, du plus récent au plus ancien", () => {
    const bottles: Bottle[] = [
      bottle("2024-05-05T16:00:00Z", 90, "a"), // bucket 2024-05-05
      bottle("2024-05-06T08:00:00Z", 50, "b"), // bucket 2024-05-05
      bottle("2024-05-06T16:00:00Z", 70, "c"), // bucket 2024-05-06
    ];
    const groups = groupByDay(bottles, TZ_MTL);
    expect(groups.map((g) => g.day)).toEqual(["2024-05-06", "2024-05-05"]);
    expect(groups[0].bottles.map((b) => b.id)).toEqual(["c"]);
    expect(groups[1].bottles.map((b) => b.id)).toEqual(["b", "a"]);
    expect(groups[1].totalMl).toBe(140);
  });

  it("liste vide → tableau vide", () => {
    expect(groupByDay([], TZ_MTL)).toEqual([]);
  });
});

describe("last7Days", () => {
  it("retourne 7 entrées du plus ancien au plus récent, totaux par jour", () => {
    // "Aujourd'hui" = 2024-05-05 12h00 EDT
    const today = new Date("2024-05-05T16:00:00Z");
    const bottles: Bottle[] = [
      bottle("2024-05-05T16:00:00Z", 90), // bucket 2024-05-05
      bottle("2024-05-06T05:00:00Z", 60), // 01h00 EDT le 6 → bucket 2024-05-05
      bottle("2024-05-04T18:00:00Z", 80), // bucket 2024-05-04
      bottle("2024-04-29T18:00:00Z", 50), // bucket 2024-04-29 (dans la fenêtre)
      bottle("2024-04-28T18:00:00Z", 30), // bucket 2024-04-28 (HORS fenêtre)
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
    expect(series[0].totalMl).toBe(50);
    expect(series[5].totalMl).toBe(80);
    expect(series[6].totalMl).toBe(150);
  });

  it("aucun biberon → 7 jours à 0", () => {
    const today = new Date("2024-05-05T16:00:00Z");
    const series = last7Days([], today, TZ_MTL);
    expect(series).toHaveLength(7);
    expect(series.every((d) => d.totalMl === 0)).toBe(true);
  });
});
