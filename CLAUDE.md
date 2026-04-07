# LDD Manifest Analyzer

## Project
Manifest analysis tool for Lucky Duck Dealz (Rebecca's liquidation resale business).
Scrapes Target B-Stock auctions, downloads manifests, scores loads, projects waste/revenue, and recommends bid amounts.

## Stack
- Frontend: React 18 + TypeScript strict, Vite, inline styles (no Tailwind, no CSS frameworks)
- Crawler: Node.js + Playwright, connects to Chrome via CDP (port 9222)
- Fonts: DM Sans (body) + DM Serif Display (headings/numbers)
- Deploy target: Cloudflare Pages (future)
- Package manager: npm

## Design Direction
- "Dealer's Table" aesthetic: warm dark theme, gold accents from LDD duck logo
- Muted coral (#c4786a) for PASS/waste (not aggressive red)
- Green (#3ae88f) for BUY, yellow (#e8c93a) for CONSIDER
- All design tokens in src/tokens.ts
- Tablet-first (Samsung Galaxy Tab), but works on desktop
- Score breakdown is collapsible by default (avoid info dump)
- Load drawer shows top 10 by score, toggle to reveal rest

## Key Paths
- `src/tokens.ts` - design tokens (colors, grades)
- `src/types.ts` - all TypeScript interfaces
- `src/utils.ts` - formatters (fm, fd, pc, timeLeft)
- `src/data/analyzer.ts` - scoring engine (waste, revenue, confidence, grade)
- `src/data/csv-parser.ts` - B-Stock manifest CSV parser (20 columns)
- `src/data/category-config.ts` - category waste/sell rates, preferred status
- `src/data/html-scraper.ts` - HTML parser for saved B-Stock pages
- `src/data/load-source.ts` - loads from scraped JSON or mock data fallback
- `src/data/loads.ts` - mock data generator (fallback when no loads.json)
- `src/components/` - all React components
- `scripts/crawl-bstock.mjs` - Playwright crawler (connects to Chrome CDP)
- `scripts/start-chrome-debug.bat` - launch Chrome with debug port
- `public/loads.json` - crawler output (gitignored, generated)
- `downloads/` - cached manifest CSVs from crawler (gitignored)
- `concepts/` - HTML design mockups (reference only)
- `sample-data/` - real manifest CSVs for testing

## Commands
- `npm run dev` - Start Vite dev server (port 5173)
- `npm run build` - TypeScript check + Vite production build
- `npx tsc --noEmit` - Type check only
- `npm run crawl` - Scrape B-Stock (Chrome must be running with debug port)
- `npm run crawl:headless` - Headless crawl (needs Chrome closed first)

## Crawler Setup
1. Run `scripts/start-chrome-debug.bat` (or restart Chrome with --remote-debugging-port=9222)
2. Log into B-Stock in the debug Chrome window (session persists in .chrome-debug/)
3. Navigate to Target listings page
4. Run `npm run crawl` - outputs public/loads.json
5. App auto-loads scraped data on next page load

## B-Stock Page Structure
- Marketplace URL: https://bstock.com/buy/seller/target
- Listing cards: `data-testid="search-result-card"` (the card itself is an `<a>` tag)
- Pagination: `button[aria-label="next-page"]`
- Manifest download: `<button>` with text "Download Full Manifest" or "Download Manifest"
- Detail fields: data-testid="listing-description-condition", "listing-description-shipment-size", etc.

## Manifest CSV Format (Target)
20 columns: Item #, Seller Category, Item Description, Qty, Unit Retail, Ext. Retail, Brand, UPC, TCIN, Origin, Category, Condition, Product Class, Category Code, Division, Department, Optoro Condition, Pallet ID, Subcategory, Lot ID

Key fields: TCIN (Target product ID for images), UPC (barcode), Condition (NEW/USED_GOOD/etc.), Pallet ID (for pallet-level analysis)

## Conventions
- No em dashes in any generated text, comments, or documentation
- Raw inline styles (no CSS files, no Tailwind)
- font-variant-numeric: tabular-nums on all number displays
- Components use named exports (not default)
- All currency uses fm() or fd() from utils.ts
- Crawler is standalone .mjs (no TypeScript, runs directly with Node)

## Known Issues
- Condition field shows "ConditionUsed Good" instead of "Used Good" (HTML parsing artifact)
- Loads without manifests (6 of 77) show empty dashboards
- No product images yet (TCIN available for Target CDN lookup)
- No localStorage persistence for uploaded CSVs
- Auction end times are estimated (24h from scrape), not real countdown

## Roadmap
- V1.0: Frontend SPA with mock data + real CSV upload (DONE)
- V1.1: B-Stock crawler with real manifest download (DONE)
- V1.2: Fix condition parsing, filter/sort controls, empty state for no-manifest loads
- V1.5: Product images via TCIN, localStorage persistence, Cloudflare Pages deploy
- V2.0: Cloudflare Worker backend, D1 database, scheduled crawling, real auction timers
