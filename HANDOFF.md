# LDD Manifest Analyzer - Handoff

## What Is This?
A tool for Rebecca (Lucky Duck Dealz) to analyze Target liquidation truckloads on B-Stock before bidding. It scrapes the B-Stock marketplace, downloads manifest CSVs, and scores every load on value, waste, category mix, and pricing confidence.

## Current State (V1.1)
Everything below is working and tested with real B-Stock data.

### What's Built

**Crawler** (`scripts/crawl-bstock.mjs`)
- Connects to Chrome via remote debugging (port 9222)
- Finds the Target listings tab automatically
- Paginates through all pages (77 listings across 4 pages as of Apr 6)
- Visits each listing detail page for metadata (condition, location, shipment size)
- Downloads manifest CSVs via "Download Full Manifest" button
- Parses 20-column Target manifest format into structured items
- Outputs `public/loads.json` for the frontend
- 71 of 77 listings had downloadable manifests (98,190 total items)

**Analysis Engine** (`src/data/analyzer.ts`)
- Scores each load 0-100 based on: total retail, value ratio, category mix, SKU variety, waste projection
- Grade: BUY (70+) / CONSIDER (40-69) / PASS (<40)
- Projects waste % based on category and item condition
- Detects seasonal items (Christmas, Halloween, etc.) and flags hold risk
- Identifies deep SKUs (same product stacked 20+ units)
- Price confidence scoring (flags suspect retail values)
- Revenue projection: sellable retail x weighted sell rate
- Max bid calculation at 20% of retail

**Frontend** (React + TypeScript + Vite)
- Dealer's Table dark theme (gold accents, DM Serif Display headings)
- Left panel: load identity, grade badge, auction timer, composition ring ("by % of retail value")
- Overview tab: 4 metric cards, real load breakdown bar, collapsible score breakdown, value distribution, price confidence + deep SKU alerts
- Item Breakdown tab: 4-column grid with image placeholders, brand, TCIN, condition, category tags
- Bid Modeler tab: slider with per-item cost, profit, ROI, reference points, sell rates
- Load drawer: top 10 by score, toggle to show rest, sorted by analysis score
- CSV upload modal: parse real manifests with metadata auto-detection
- Auto-loads scraped data from loads.json, falls back to mock data
- Header shows "Live" timestamp for scraped data, "Demo Data" for mock

### How to Run

**First time setup:**
```
cd ldd-manifest-analyzer
npm install
npx playwright install chromium
```

**Start the app:**
```
npm run dev
```

**Run the crawler:**
```
# 1. Start Chrome with debug port (close Chrome first)
scripts/start-chrome-debug.bat

# 2. Log into B-Stock in the debug Chrome window

# 3. Navigate to Target listings page

# 4. Run the crawler
npm run crawl

# App will show live data on next page load
```

### Architecture

```
ldd-manifest-analyzer/
  src/
    App.tsx               Main app shell, state management, tab switching
    tokens.ts             Design tokens (colors, grades)
    types.ts              TypeScript interfaces (Item, Load, AnalysisResult)
    utils.ts              Formatters (currency, percentage, time)
    data/
      analyzer.ts         Scoring engine
      csv-parser.ts       B-Stock CSV parser (20 columns)
      category-config.ts  Category waste/sell rates
      html-scraper.ts     HTML parser for saved B-Stock pages
      load-source.ts      Load data fetcher (scraped or mock)
      loads.ts            Mock data generator (fallback)
      generator.ts        Seeded PRNG for mock items
      categories.ts       Category definitions
    components/
      Header.tsx          Brand bar, status pills, scan/upload buttons
      LeftPanel.tsx        Load identity, grade, auction timer, composition ring
      CompRing.tsx         SVG donut chart
      LoadDrawer.tsx       Slide-out load list (top 10 + toggle)
      OverviewTab.tsx      Metrics, load bar, score, value dist, confidence
      ItemBreakdownTab.tsx Item cards with image placeholders
      BidModelerTab.tsx    Bid slider, profit/ROI, reference points
      UploadModal.tsx      CSV upload with preview and metadata form
  scripts/
    crawl-bstock.mjs      Playwright crawler (Chrome CDP)
    start-chrome-debug.bat Chrome launcher with debug port
  public/
    loads.json            Crawler output (gitignored)
  sample-data/            Real manifest CSVs for testing
  concepts/               HTML design mockups (reference)
```

### What's Next (V1.2+)

**Polish**
- Fix "ConditionUsed Good" parsing artifact
- Filter/sort loads by category, condition, location
- Empty state for loads without manifests
- Responsive tablet layout for Rebecca's Samsung Tab

**V1.5 Features**
- Product images via TCIN (Target CDN: target.scene7.com/is/image/Target/{TCIN})
- localStorage persistence for uploaded CSVs
- Deploy to Cloudflare Pages
- Real auction end times from scrape data

**V2.0 Backend**
- Cloudflare Worker + D1 database
- Scheduled crawling (daily or on-demand)
- Historical load tracking and trend analysis
- Rebecca's custom category preferences (editable waste/sell rates)
- Push notifications for high-score loads
