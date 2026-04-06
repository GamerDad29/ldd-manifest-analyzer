import type { AnalysisResult, CategoryData, ValueBuckets, ScoreReason } from '../types';
import type { Load } from '../types';
import { pc } from '../utils';

export function analyze(load: Load): AnalysisResult {
  const items = load.items;
  const ti = items.reduce((a, i) => a + i.qt, 0);
  const tr = items.reduce((a, i) => a + i.rp * i.qt, 0);
  const ar = tr / ti;

  // Value buckets
  const vb: ValueBuckets = { u10: 0, t25: 0, t50: 0, f100: 0, o100: 0 };
  items.forEach(i => {
    const q = i.qt;
    if (i.rp < 10) vb.u10 += q;
    else if (i.rp < 25) vb.t25 += q;
    else if (i.rp < 50) vb.t50 += q;
    else if (i.rp < 100) vb.f100 += q;
    else vb.o100 += q;
  });
  const o50 = (vb.f100 + vb.o100) / ti;

  // Category aggregation
  const catMap: Record<string, { c: number; r: number; p: number; w: number; s: number }> = {};
  items.forEach(i => {
    if (!catMap[i.cat]) catMap[i.cat] = { c: 0, r: 0, p: i.pf, w: i.wr, s: i.sr };
    catMap[i.cat]!.c += i.qt;
    catMap[i.cat]!.r += i.rp * i.qt;
  });
  const cats: CategoryData[] = Object.entries(catMap)
    .map(([n, d]) => ({ n, ...d, pct: d.c / ti }))
    .sort((a, b) => b.r - a.r);

  // Preferred %
  const pp = cats.filter(c => c.p).reduce((a, c) => a + c.pct, 0);

  // Weighted waste
  const ww = items.reduce((a, i) => a + i.wr * i.rp * i.qt, 0) / tr;

  // Seasonal hold
  const seasonalItems = items.filter(i => i.se && !i.se.now);
  const shp = seasonalItems.reduce((a, i) => a + i.rp * i.qt, 0) / tr;

  // SKU depth
  const skuDepth: Record<string, number> = {};
  items.forEach(i => { skuDepth[i.nm] = (skuDepth[i.nm] || 0) + i.qt; });
  const msd = Math.max(...Object.values(skuDepth));
  const ds: [string, number][] = Object.entries(skuDepth)
    .filter(([, v]) => v > 20)
    .sort((a, b) => b[1] - a[1]) as [string, number][];

  // Suspect pricing
  const sc = items.filter(i => i.sp).length;
  const cs = Math.max(0, Math.min(100, Math.round((1 - (sc / items.length) * 3) * 100)));

  // Revenue projections
  const sellableRetail = tr * (1 - ww) * (1 - shp);
  const wsr = items.reduce((a, i) => a + i.sr * i.rp * i.qt, 0) / tr;
  const er = sellableRetail * wsr;
  const mb = tr * 0.20;

  // Scoring
  let score = 0;
  const rr: ScoreReason[] = [];

  if (tr >= 80000) { score += 25; rr.push({ g: 1, t: 'Strong retail: $' + Math.round(tr / 1000) + 'K' }); }
  else if (tr >= 50000) { score += 15; rr.push({ g: 1, t: 'Solid retail' }); }
  else { score += 5; rr.push({ g: -1, t: 'Low retail: $' + Math.round(tr / 1000) + 'K' }); }

  if (ti <= 2500 && tr >= 50000) { score += 20; rr.push({ g: 1, t: 'Great value ratio' }); }
  else if (ti <= 3000) { score += 10; rr.push({ g: 0, t: 'Moderate count' }); }
  else { rr.push({ g: -1, t: 'High count: ' + ti }); }

  if (o50 >= 0.5) { score += 20; rr.push({ g: 1, t: pc(o50) + ' over $50' }); }
  else if (o50 >= 0.35) { score += 10; rr.push({ g: 0, t: pc(o50) + ' over $50' }); }
  else { rr.push({ g: -1, t: 'Only ' + pc(o50) + ' over $50' }); }

  if (pp >= 0.7) { score += 15; rr.push({ g: 1, t: pc(pp) + ' preferred' }); }
  else if (pp >= 0.5) { score += 8; rr.push({ g: 0, t: pc(pp) + ' preferred' }); }
  else { rr.push({ g: -1, t: 'Heavy avoid categories' }); }

  if (msd <= 10) { score += 10; rr.push({ g: 1, t: 'Great variety' }); }
  else if (msd <= 30) { score += 5; rr.push({ g: 0, t: 'Some deep SKUs' }); }
  else { rr.push({ g: -1, t: 'Deep: ' + msd + ' units' }); }

  if (ww <= 0.12) { score += 10; rr.push({ g: 1, t: 'Low waste' }); }
  else if (ww <= 0.25) { score += 5; rr.push({ g: 0, t: 'Moderate waste' }); }
  else { rr.push({ g: -1, t: 'High waste: ' + pc(ww) }); }

  const grade = score >= 70 ? 'green' : score >= 40 ? 'yellow' : 'red';
  const top = [...items].sort((a, b) => b.rp - a.rp).slice(0, 12);

  return {
    ti, tr, ar, us: items.length, vb, o50, cats, pp, ww, shp,
    sr: sellableRetail, wsr, er, mb, msd, ds, sc, cs, score, grade, rr,
    fr: load.fr, top,
  };
}
