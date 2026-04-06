/** Category definitions: preferred (p), waste rate (w), sell rate (s) */
export interface CategoryDef {
  n: string;
  p: number;   // 1 = preferred, 0 = avoid
  w: number;   // waste rate
  s: number;   // sell rate
}

export const CATEGORIES: CategoryDef[] = [
  { n: 'Home Decor',        p: 1, w: 0.12, s: 0.50 },
  { n: 'Bedding',           p: 1, w: 0.08, s: 0.50 },
  { n: 'Lighting',          p: 1, w: 0.45, s: 0.50 },
  { n: 'Toys',              p: 1, w: 0.10, s: 0.28 },
  { n: 'Furniture',         p: 1, w: 0.15, s: 0.50 },
  { n: 'Wall Art',          p: 1, w: 0.10, s: 0.50 },
  { n: 'Rugs',              p: 1, w: 0.05, s: 0.50 },
  { n: 'Mirrors',           p: 0, w: 0.50, s: 0.50 },
  { n: 'Clothing',          p: 0, w: 0.05, s: 0.35 },
  { n: 'Health & Beauty',   p: 0, w: 0.08, s: 0.40 },
  { n: 'Small Appliances',  p: 0, w: 0.20, s: 0.45 },
  { n: 'Kitchen',           p: 1, w: 0.12, s: 0.50 },
];

export const PRODUCT_NAMES = [
  'Threshold Floor Lamp', 'Casaluna Comforter Queen', 'Hearth & Hand Vase',
  'Pillowfort Bedding Set', 'Opalhouse Throw Pillow', 'Project 62 Table Lamp',
  'Threshold Curtain Panel', 'Casaluna Sheet Set King', 'Hearth & Hand Clock',
  'Opalhouse Mirror', 'LEGO City Set', 'Hot Wheels Track Builder',
  'Barbie Dreamhouse', 'Nerf Blaster', 'Threshold Rug 5x7',
  'Casaluna Towels', 'Project 62 Bookshelf', 'KitchenAid Attachment',
  'Cuisinart Coffee Maker', 'Casaluna Weighted Blanket', 'Threshold Wall Art',
  'Opalhouse String Lights', 'Christmas Ornament Set', 'Halloween Decor',
  'Project 62 Side Table',
];

export const SEASONAL_KEYWORDS: Record<string, { h: string; m: number[] }> = {
  christmas: { h: 'Christmas', m: [10, 11] },
  holiday:   { h: 'Christmas', m: [10, 11] },
  halloween: { h: 'Halloween', m: [9] },
  easter:    { h: 'Easter',    m: [2, 3] },
  valentine: { h: "Valentine's", m: [1] },
};
