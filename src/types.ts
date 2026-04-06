export interface SeasonalInfo {
  h: string;     // holiday name
  m: number[];   // active months
  now: boolean;  // is it currently in season?
}

export interface Item {
  id: number;
  nm: string;    // product name
  cat: string;   // category name
  rp: number;    // retail price
  qt: number;    // quantity
  wr: number;    // waste rate (0-1)
  sr: number;    // sell rate (0-1)
  pf: number;    // preferred category (1 = yes, 0 = no)
  se: SeasonalInfo | null;
  sp: boolean;   // suspect pricing flag
}

export interface CategoryData {
  n: string;     // name
  c: number;     // count
  r: number;     // total retail
  p: number;     // preferred (1/0)
  w: number;     // waste rate
  s: number;     // sell rate
  pct: number;   // % of total items
}

export interface ValueBuckets {
  u10: number;   // under $10
  t25: number;   // $10-25
  t50: number;   // $25-50
  f100: number;  // $50-100
  o100: number;  // $100+
}

export interface ScoreReason {
  g: -1 | 0 | 1; // grade: positive, neutral, negative
  t: string;      // text
}

export interface AnalysisResult {
  ti: number;     // total items
  tr: number;     // total retail
  ar: number;     // average retail
  us: number;     // unique SKUs
  vb: ValueBuckets;
  o50: number;    // % of items over $50
  cats: CategoryData[];
  pp: number;     // preferred %
  ww: number;     // weighted waste %
  shp: number;    // seasonal hold %
  sr: number;     // sellable retail
  wsr: number;    // weighted sell rate
  er: number;     // expected revenue
  mb: number;     // max bid (20%)
  msd: number;    // max single SKU depth
  ds: [string, number][]; // deep SKUs (name, count)
  sc: number;     // suspect count
  cs: number;     // confidence score
  score: number;  // overall score 0-100
  grade: string;  // green | yellow | red
  rr: ScoreReason[];
  fr: number;     // freight cost
  top: Item[];    // top items by value
}

export interface Load {
  id: string;
  t: string;      // title
  sub: string;     // subtitle / source DC
  items: Item[];
  fr: number;      // freight
  end: string;     // auction end ISO
  hue: number;     // ambient hue (legacy, kept for data compat)
}
