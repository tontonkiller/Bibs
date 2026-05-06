export type FeedKind = "formula" | "breast" | "pumped";

export type Baby = {
  id: string;
  name: string;
  birthdate: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
};

export type NewBaby = {
  name: string;
  birthdate: string;
  password: string;
};

export type BabyEdit = {
  name?: string;
  birthdate?: string;
};

export type Bottle = {
  id: string;
  baby_id: string;
  drunk_at: string;
  kind: FeedKind;
  amount_ml: number | null;
  duration_min: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

// Sheet-level shape (no baby_id — added by the higher-level handler).
export type BottleInput = {
  drunk_at: string;
  kind: FeedKind;
  amount_ml: number | null;
  duration_min: number | null;
  note?: string | null;
};

export type NewBottle = BottleInput & { baby_id: string };

export type BottlePatch = Partial<BottleInput>;
