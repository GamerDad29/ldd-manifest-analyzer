import { generateItems } from './generator';
import type { Load } from '../types';

export const LOADS: Load[] = [
  { id: 'TGT-04-001', t: 'Home & Decor Mixed',       sub: 'East Coast DC',    items: generateItems(42, 'great'), fr: 4500, end: '2026-04-07T13:00:00', hue: 210 },
  { id: 'TGT-04-002', t: 'Bedding & Bath Premium',    sub: 'Southeast DC',     items: generateItems(77, 'good'),  fr: 4200, end: '2026-04-07T13:00:00', hue: 260 },
  { id: 'TGT-04-003', t: 'Toys & Games Overstock',    sub: 'Midwest Hub',      items: generateItems(13, 'toy'),   fr: 4800, end: '2026-04-07T13:00:00', hue: 30 },
  { id: 'TGT-04-004', t: 'Mixed General Merch',       sub: 'East Coast DC',    items: generateItems(99, 'mid'),   fr: 4300, end: '2026-04-08T13:00:00', hue: 195 },
  { id: 'TGT-04-005', t: 'Clothing & Health Heavy',   sub: 'Southeast DC',     items: generateItems(55, 'poor'),  fr: 3900, end: '2026-04-08T13:00:00', hue: 0 },
  { id: 'TGT-04-006', t: 'Furniture & Lighting Mix',  sub: 'Northeast Hub',    items: generateItems(31, 'good'),  fr: 5100, end: '2026-04-08T13:00:00', hue: 150 },
];
