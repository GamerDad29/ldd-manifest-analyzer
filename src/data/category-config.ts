/**
 * Category configuration for the analyzer.
 * Maps display categories to preferred status (p), waste rate (w), and sell rate (s).
 *
 * These are Rebecca's defaults based on her resale experience.
 * V2.0 will let her customize these per-category.
 *
 * p = 1 means preferred category (she wants these)
 * w = waste rate (fraction of items that won't sell / are damaged)
 * s = sell rate (fraction of sellable items she expects to actually sell)
 */
export interface CategoryConfig {
  p: number;   // preferred: 1 = yes, 0 = avoid
  w: number;   // waste rate (0-1)
  s: number;   // sell rate (0-1)
}

export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  // Preferred categories
  'Home Decor':       { p: 1, w: 0.12, s: 0.50 },
  'Bedding & Bath':   { p: 1, w: 0.08, s: 0.50 },
  'Lighting':         { p: 1, w: 0.45, s: 0.50 },
  'Toys':             { p: 1, w: 0.10, s: 0.28 },
  'Furniture':        { p: 1, w: 0.15, s: 0.50 },
  'Wall Art':         { p: 1, w: 0.10, s: 0.50 },
  'Rugs':             { p: 1, w: 0.05, s: 0.50 },
  'Kitchen':          { p: 1, w: 0.12, s: 0.50 },
  'Outdoor Sports':   { p: 1, w: 0.12, s: 0.45 },
  'Garden & Patio':   { p: 1, w: 0.15, s: 0.45 },
  'Baby':             { p: 1, w: 0.08, s: 0.45 },
  'Storage':          { p: 1, w: 0.08, s: 0.45 },
  'Seasonal':         { p: 1, w: 0.20, s: 0.35 },

  // Avoid categories
  'Mirrors':          { p: 0, w: 0.50, s: 0.50 },
  'Clothing':         { p: 0, w: 0.05, s: 0.35 },
  'Health & Beauty':  { p: 0, w: 0.08, s: 0.40 },
  'Small Appliances': { p: 0, w: 0.20, s: 0.45 },
  'Electronics':      { p: 0, w: 0.25, s: 0.40 },
  'Food & Beverage':  { p: 0, w: 0.60, s: 0.20 },
  'Pet Supplies':     { p: 0, w: 0.10, s: 0.35 },

  // Fallback for unknown categories
  'Other':            { p: 0, w: 0.15, s: 0.40 },
};

/** Get config for a category, falling back to Other */
export function getCategoryConfig(category: string): CategoryConfig {
  return CATEGORY_CONFIG[category] || CATEGORY_CONFIG['Other']!;
}
