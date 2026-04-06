# LDD Manifest Analyzer

## Project
Manifest analysis tool for Lucky Duck Dealz (Rebecca's liquidation resale business).
Scores Target B-Stock truckloads, projects waste/revenue, and recommends bid amounts.

## Stack
- Frontend: React 18 + TypeScript strict, Vite, inline styles (no Tailwind, no CSS frameworks)
- Fonts: DM Sans (body) + DM Serif Display (headings/numbers)
- Deploy target: Cloudflare Pages (V1.5+)
- Package manager: npm

## Design Direction
- "Dealer's Table" aesthetic: warm dark theme, gold accents from duck logo
- Muted coral for PASS/waste (not aggressive red)
- Green (#3ae88f) for BUY, yellow (#e8c93a) for CONSIDER
- All design tokens in src/tokens.ts
- Tablet-first (Samsung Galaxy Tab), but works on desktop
- Score breakdown is collapsible by default (avoid info dump)

## Key Paths
- `src/tokens.ts` - design tokens (colors, grades)
- `src/types.ts` - all TypeScript interfaces
- `src/utils.ts` - formatters (fm, fd, pc, timeLeft)
- `src/data/` - analysis engine, mock data generator, load definitions
- `src/components/` - all React components
- `concepts/` - HTML design mockups (reference only, not built code)

## Commands
- `npm run dev` - Start Vite dev server (port 5173)
- `npm run build` - TypeScript check + Vite production build
- `npx tsc --noEmit` - Type check only

## Conventions
- No em dashes in any generated text, comments, or documentation
- Inline styles (no CSS files, no Tailwind)
- font-variant-numeric: tabular-nums on all number displays
- Components use named exports (not default)
- All currency uses fm() or fd() from utils.ts

## Roadmap
- V1.0: Frontend SPA with mock data (current)
- V1.5: Real CSV parser, Redsky product images, Cloudflare Pages deploy
- V2.0: Cloudflare Worker backend, D1 database, B-Stock API integration
