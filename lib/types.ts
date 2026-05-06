export type FeedKind = "formula" | "breast" | "pumped";

export type Bottle = {
  id: string;
  drunk_at: string;
  kind: FeedKind;
  amount_ml: number | null;
  duration_min: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type NewBottle = {
  drunk_at: string;
  kind: FeedKind;
  amount_ml: number | null;
  duration_min: number | null;
  note?: string | null;
};

export type BottlePatch = Partial<NewBottle>;
