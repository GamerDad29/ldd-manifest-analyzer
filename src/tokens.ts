/** Design tokens: Dealer's Table palette derived from LDD duck logo */
export const C = {
  // Background / surfaces
  bg: '#0e1210',
  surface: '#151c18',
  card: '#1a231e',
  cardHover: '#1f2a24',
  border: 'rgba(255,255,255,0.05)',
  borderGold: 'rgba(232,176,58,0.18)',

  // Brand: from the duck
  gold: '#e8b03a',
  goldDim: 'rgba(232,176,58,0.10)',
  goldGlow: 'rgba(232,176,58,0.06)',
  cyan: '#2bc5e6',
  cyanDim: 'rgba(43,197,230,0.08)',
  orange: '#e8933a',

  // Semantic: BUY / CONSIDER / PASS
  buy: '#3ae88f',
  buyDim: 'rgba(58,232,143,0.08)',
  buySurface: 'rgba(58,232,143,0.04)',
  consider: '#e8c93a',
  considerDim: 'rgba(232,201,58,0.08)',
  pass: '#c4786a',
  passDim: 'rgba(196,120,106,0.08)',
  passBorder: 'rgba(196,120,106,0.15)',

  // Text
  t1: '#e8e4dc',
  t2: '#8a8578',
  t3: '#5a564c',
} as const;

/** Category colors for composition ring */
export const RING_COLORS = [
  '#2bc5e6', '#3ae88f', '#e8c93a', '#e8933a', '#e8b03a',
  '#8b5cf6', '#64748b', '#ec4899',
] as const;

/** Grade label/color maps */
export const GRADE_COLOR: Record<string, string> = {
  green: C.buy,
  yellow: C.consider,
  red: C.pass,
};
export const GRADE_DIM: Record<string, string> = {
  green: C.buyDim,
  yellow: C.considerDim,
  red: C.passDim,
};
export const GRADE_SURFACE: Record<string, string> = {
  green: C.buySurface,
  yellow: C.considerDim,
  red: C.passDim,
};
export const GRADE_LABEL: Record<string, string> = {
  green: 'BUY',
  yellow: 'CONSIDER',
  red: 'PASS',
};
