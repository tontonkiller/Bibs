export type Bottle = {
  id: string;
  drunk_at: string;
  amount_ml: number;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type NewBottle = {
  drunk_at: string;
  amount_ml: number;
  note?: string | null;
};

export type BottlePatch = Partial<NewBottle>;
