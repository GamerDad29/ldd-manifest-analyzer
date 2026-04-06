import { CATEGORIES, PRODUCT_NAMES, SEASONAL_KEYWORDS } from './categories';
import type { Item, SeasonalInfo } from '../types';

interface QualityConfig {
  it: number;   // target item count
  mn: number;   // min retail price
  mx: number;   // max retail price
  hv: number;   // high-value probability
  pp: number;   // preferred category probability
  sv: number;   // single-unit probability
}

const QUALITY_CONFIGS: Record<string, QualityConfig> = {
  great: { it: 1800, mn: 15, mx: 250, hv: 0.55, pp: 0.75, sv: 0.92 },
  good:  { it: 2200, mn: 8,  mx: 180, hv: 0.45, pp: 0.60, sv: 0.80 },
  mid:   { it: 2800, mn: 5,  mx: 120, hv: 0.35, pp: 0.50, sv: 0.65 },
  poor:  { it: 4500, mn: 3,  mx: 80,  hv: 0.20, pp: 0.30, sv: 0.40 },
  toy:   { it: 3200, mn: 8,  mx: 150, hv: 0.30, pp: 0.55, sv: 0.55 },
};

/** Seeded PRNG for reproducible mock data */
function createRng(seed: number) {
  let s = seed;
  return () => {
    s++;
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };
}

export function generateItems(seed: number, quality: string): Item[] {
  const nx = createRng(seed);
  const cfg = QUALITY_CONFIGS[quality];
  if (!cfg) return [];

  const itemCount = Math.floor(cfg.it * (0.85 + nx() * 0.3));
  const items: Item[] = [];
  const currentMonth = new Date().getMonth();

  for (let i = 0; i < itemCount; i++) {
    const catIdx = nx() < cfg.pp
      ? Math.floor(nx() * 7)        // preferred categories (0-6)
      : 7 + Math.floor(nx() * 5);   // avoid categories (7-11)
    const cat = CATEGORIES[catIdx]!;
    const isHighValue = nx() < cfg.hv;

    const retail = isHighValue
      ? cfg.mn * 3 + nx() * (cfg.mx - cfg.mn * 3)
      : cfg.mn + nx() * (cfg.mx * 0.3);

    const nameIdx = Math.floor(nx() * PRODUCT_NAMES.length);
    const qty = nx() < cfg.sv ? 1 : Math.floor(2 + nx() * (nx() < 0.1 ? 50 : 5));

    // Check seasonal keywords
    let seasonal: SeasonalInfo | null = null;
    const lowerName = PRODUCT_NAMES[nameIdx]!.toLowerCase();
    for (const [kw, info] of Object.entries(SEASONAL_KEYWORDS)) {
      if (lowerName.includes(kw)) {
        seasonal = {
          ...info,
          now: info.m.includes(currentMonth) || info.m.includes(currentMonth + 1),
        };
        break;
      }
    }

    items.push({
      id: i,
      nm: PRODUCT_NAMES[nameIdx]!,
      cat: cat.n,
      rp: Math.round(retail * 100) / 100,
      qt: qty,
      wr: cat.w,
      sr: cat.s,
      pf: cat.p,
      se: seasonal,
      sp: nx() < 0.08,
    });
  }
  return items;
}
