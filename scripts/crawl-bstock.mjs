#!/usr/bin/env node
/**
 * B-Stock Crawler for Lucky Duck Dealz
 *
 * Scrapes the Target liquidation marketplace on B-Stock,
 * downloads manifest CSVs, parses everything, and outputs
 * a single loads.json file that the frontend app consumes.
 *
 * Usage:
 *   node scripts/crawl-bstock.mjs
 *   node scripts/crawl-bstock.mjs --headed    (visible browser for debugging)
 *   node scripts/crawl-bstock.mjs --max=5     (limit to 5 listings)
 *
 * The script will:
 * 1. Launch a browser and navigate to B-Stock Target marketplace
 * 2. If not logged in, pause for manual login
 * 3. Scrape all visible auction listings
 * 4. Visit each listing detail page
 * 5. Download manifest CSVs where available
 * 6. Parse manifests through the analysis engine
 * 7. Output public/loads.json for the frontend
 */

import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { createInterface } from 'readline';

const PROJECT_ROOT = resolve(import.meta.dirname, '..');
const OUTPUT_DIR = join(PROJECT_ROOT, 'public');
const DOWNLOAD_DIR = join(PROJECT_ROOT, 'downloads');
const OUTPUT_FILE = join(OUTPUT_DIR, 'loads.json');

const TARGET_MARKETPLACE = 'https://bstock.com/buy/browse/target';

// ── CLI args ────────────────────────────────────────────────────
const args = process.argv.slice(2);
const HEADED = args.includes('--headed');
const MAX_LISTINGS = (() => {
  const m = args.find(a => a.startsWith('--max='));
  return m ? parseInt(m.split('=')[1], 10) : 50;
})();

// ── CSV Parser (standalone, no TS imports) ──────────────────────

function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCsvText(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });
}

// ── Category mapping ────────────────────────────────────────────

const CATEGORY_CONFIG = {
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
  'Mirrors':          { p: 0, w: 0.50, s: 0.50 },
  'Clothing':         { p: 0, w: 0.05, s: 0.35 },
  'Health & Beauty':  { p: 0, w: 0.08, s: 0.40 },
  'Small Appliances': { p: 0, w: 0.20, s: 0.45 },
  'Electronics':      { p: 0, w: 0.25, s: 0.40 },
  'Food & Beverage':  { p: 0, w: 0.60, s: 0.20 },
  'Pet Supplies':     { p: 0, w: 0.10, s: 0.35 },
  'Other':            { p: 0, w: 0.15, s: 0.40 },
};

function normalizeCategory(category, sellerCategory) {
  const cat = (category || '').toUpperCase().replace(/_/g, ' ');
  const seller = (sellerCategory || '').toUpperCase();
  if (cat.includes('TOY') || seller.includes('TOY')) return 'Toys';
  if (cat.includes('OUTDOOR') || cat.includes('SPORT') || seller.includes('BICYCLE')) return 'Outdoor Sports';
  if (cat.includes('FURNITURE')) return 'Furniture';
  if (cat.includes('BEDDING') || cat.includes('BATH')) return 'Bedding & Bath';
  if (cat.includes('LIGHTING') || cat.includes('LIGHT')) return 'Lighting';
  if (cat.includes('KITCHEN') || cat.includes('DINING')) return 'Kitchen';
  if (cat.includes('DECOR') || cat.includes('HOME')) return 'Home Decor';
  if (cat.includes('CLOTH') || cat.includes('APPAREL')) return 'Clothing';
  if (cat.includes('HEALTH') || cat.includes('BEAUTY') || cat.includes('PERSONAL')) return 'Health & Beauty';
  if (cat.includes('ELECTRONIC') || cat.includes('TECH')) return 'Electronics';
  if (cat.includes('BABY') || cat.includes('NEWBORN') || cat.includes('TODDLER')) return 'Baby';
  if (cat.includes('GARDEN') || cat.includes('PATIO')) return 'Garden & Patio';
  if (cat.includes('PET')) return 'Pet Supplies';
  if (cat.includes('RUG')) return 'Rugs';
  if (cat.includes('SEASONAL')) return 'Seasonal';
  if (category) return category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  return 'Other';
}

const SEASONAL_KW = {
  christmas: { h: 'Christmas', m: [10, 11] },
  holiday: { h: 'Christmas', m: [10, 11] },
  halloween: { h: 'Halloween', m: [9] },
  easter: { h: 'Easter', m: [2, 3] },
  valentine: { h: "Valentine's", m: [1] },
};

function detectSeasonal(name) {
  const lower = name.toLowerCase();
  const mo = new Date().getMonth();
  for (const [kw, info] of Object.entries(SEASONAL_KW)) {
    if (lower.includes(kw)) {
      return { ...info, now: info.m.includes(mo) || info.m.includes(mo + 1) };
    }
  }
  return null;
}

function csvRowsToItems(rows) {
  return rows.map((row, idx) => {
    const qty = parseInt(row['Qty'], 10) || 1;
    const unitRetail = parseFloat(row['Unit Retail']) || 0;
    const category = normalizeCategory(row['Category'], row['Seller Category']);
    const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG['Other'];
    const condition = row['Condition'] || 'NEW';
    let wr = config.w;
    let sr = config.s;
    if (condition === 'USED_GOOD') { wr += 0.05; sr -= 0.05; }
    else if (condition === 'USED_FAIR' || condition === 'SALVAGE') { wr += 0.15; sr -= 0.15; }
    return {
      id: idx,
      nm: row['Item Description'] || 'Unknown Item',
      cat: category,
      rp: unitRetail,
      qt: qty,
      wr: Math.min(wr, 0.8),
      sr: Math.max(sr, 0.1),
      pf: config.p,
      se: detectSeasonal(row['Item Description'] || ''),
      sp: unitRetail <= 0 || unitRetail > 2000,
      itemNum: row['Item #'],
      brand: row['Brand'],
      upc: row['UPC'],
      tcin: row['TCIN'],
      condition,
      sellerCat: row['Seller Category'],
      subcat: row['Subcategory'],
      palletId: row['Pallet ID'],
      origin: row['Origin'],
      department: row['Department'],
    };
  });
}

// ── Helpers ──────────────────────────────────────────────────────

function estimateFreight(pallets) {
  if (pallets <= 3) return 800;
  if (pallets <= 6) return 1500;
  if (pallets <= 12) return 2500;
  if (pallets <= 20) return 3800;
  return 4500;
}

function extractFromTitle(title) {
  const units = (title.match(/([\d,]+)\s*Units?/i) || [])[1];
  const pallets = (title.match(/(\d+)\s*Pallet/i) || [])[1];
  const msrp = (title.match(/Ext\.\s*Retail\s*\$([\d,.]+)/i) || [])[1];
  const brands = (title.match(/by\s+(.+?)(?:,\s*[A-Z]{2}\b)/i) || [])[1];
  const location = (title.match(/,\s*([^,]+,\s*[A-Z]{2})\s*$/i) || [])[1];
  return {
    unitCount: units ? parseInt(units.replace(/,/g, ''), 10) : 0,
    palletCount: pallets ? parseInt(pallets, 10) : 0,
    msrpValue: msrp ? parseFloat(msrp.replace(/,/g, '')) : 0,
    brands: brands ? brands.trim() : '',
    location: location ? location.trim() : '',
  };
}

function categoryHue(cat) {
  const hues = {
    'Toys': 30, 'Outdoor Sports': 150, 'Home Decor': 210,
    'Bedding & Bath': 260, 'Furniture': 180, 'Lighting': 45,
    'Kitchen': 15, 'Clothing': 330, 'Health & Beauty': 300,
    'Electronics': 240, 'Baby': 350,
  };
  return hues[cat] ?? 210;
}

function extractCategory(title) {
  const lower = title.toLowerCase();
  if (lower.includes('toy') || lower.includes('lego') || lower.includes('squishmallow')) return 'Toys';
  if (lower.includes('outdoor') || lower.includes('sport') || lower.includes('bicycle')) return 'Outdoor Sports';
  if (lower.includes('furniture')) return 'Furniture';
  if (lower.includes('bedding') || lower.includes('bath')) return 'Bedding & Bath';
  if (lower.includes('lighting')) return 'Lighting';
  if (lower.includes('kitchen') || lower.includes('dining')) return 'Kitchen';
  if (lower.includes('decor') || lower.includes('home d')) return 'Home Decor';
  if (lower.includes('apparel') || lower.includes('clothing')) return 'Clothing';
  if (lower.includes('health') || lower.includes('beauty') || lower.includes('makeup') || lower.includes('personal care')) return 'Health & Beauty';
  if (lower.includes('electronic')) return 'Electronics';
  if (lower.includes('baby') || lower.includes('newborn') || lower.includes('toddler')) return 'Baby';
  if (lower.includes('garden') || lower.includes('patio')) return 'Garden & Patio';
  return 'Mixed';
}

async function waitForUser(msg) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(msg, () => { rl.close(); resolve(); });
  });
}

// ── Main Crawler ────────────────────────────────────────────────

async function main() {
  console.log('\n  Lucky Duck Dealz - B-Stock Crawler');
  console.log('  ===================================\n');

  // Ensure directories exist
  mkdirSync(OUTPUT_DIR, { recursive: true });
  mkdirSync(DOWNLOAD_DIR, { recursive: true });

  // Launch browser
  console.log(`  Launching browser (${HEADED ? 'headed' : 'headless'})...`);
  const browser = await chromium.launch({
    headless: !HEADED,
    // Use a persistent context so login session is saved
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    acceptDownloads: true,
  });

  const page = await context.newPage();

  // ── Step 1: Navigate to Target marketplace ──
  console.log('  Navigating to B-Stock Target marketplace...');
  await page.goto(TARGET_MARKETPLACE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Check if we need to log in
  const isLoggedIn = await page.$('[data-testid="search-result-card"]');
  if (!isLoggedIn) {
    console.log('\n  !! Not logged in. Please log in to B-Stock in the browser window.');
    console.log('  !! The browser window should be visible (use --headed if not).\n');

    if (!HEADED) {
      console.log('  Tip: Re-run with --headed flag to see the browser:');
      console.log('    node scripts/crawl-bstock.mjs --headed\n');
      await browser.close();
      process.exit(1);
    }

    await waitForUser('  Press Enter after you have logged in and can see listings...');

    // Navigate again after login
    await page.goto(TARGET_MARKETPLACE, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
  }

  // ── Step 2: Scrape listing cards ──
  console.log('  Scraping auction listings...');
  await page.waitForSelector('[data-testid="search-result-card"]', { timeout: 15000 });

  const listings = await page.$$eval('[data-testid="search-result-card"]', (cards) => {
    return cards.map(card => {
      const get = (tid) => card.querySelector(`[data-testid="${tid}"]`)?.textContent?.trim() || '';
      const link = card.querySelector('a[href*="/listings/details/"]');
      return {
        title: get('listing-title'),
        location: get('listing-location'),
        price: get('price'),
        pricePerUnit: get('price-per-unit'),
        msrp: get('msrp'),
        percentOfMsrp: get('percent-of-msrp'),
        condition: get('condition'),
        inventoryType: get('inventory-type'),
        url: link ? link.href : '',
      };
    });
  });

  console.log(`  Found ${listings.length} listings on page 1`);

  // TODO: pagination - scrape additional pages if needed

  const toProcess = listings.slice(0, MAX_LISTINGS);
  const loads = [];
  let processed = 0;

  // ── Step 3: Visit each listing detail page + download manifest ──
  for (const listing of toProcess) {
    processed++;
    const shortTitle = listing.title.length > 50
      ? listing.title.substring(0, 47) + '...'
      : listing.title;
    console.log(`\n  [${processed}/${toProcess.length}] ${shortTitle}`);

    if (!listing.url) {
      console.log('    Skipping: no URL');
      continue;
    }

    const parsed = extractFromTitle(listing.title);
    const category = extractCategory(listing.title);
    const listingId = listing.url.split('/').pop() || `listing-${processed}`;

    let items = [];
    let manifestDownloaded = false;

    try {
      // Navigate to detail page
      await page.goto(listing.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(1500);

      // Extract detail page data
      const detail = await page.evaluate(() => {
        const get = (tid) => document.querySelector(`[data-testid="${tid}"]`)?.textContent?.trim() || '';
        return {
          condition: get('listing-description-condition') || get('condition'),
          inventoryType: get('listing-description-inventory-type') || get('inventory-type'),
          shipmentSize: get('listing-description-shipment-size'),
          category: get('listing-description-category'),
          location: get('listing-description-location') || get('listing-location'),
          weight: get('Weight'),
          palletSpaces: get('PalletSpaces'),
          closesIn: get('closes-in'),
          numberOfBids: get('number-of-bids'),
        };
      });

      console.log(`    Condition: ${detail.condition || listing.condition}`);
      console.log(`    Location: ${detail.location || listing.location}`);

      // Try to download manifest
      const manifestLink = await page.$('a[href*="manifest"], a[href*="Manifest"], a[download]');
      if (manifestLink) {
        console.log('    Downloading manifest...');
        try {
          const [download] = await Promise.all([
            page.waitForEvent('download', { timeout: 10000 }),
            manifestLink.click(),
          ]);
          const savePath = join(DOWNLOAD_DIR, `manifest-${listingId}.csv`);
          await download.saveAs(savePath);
          console.log(`    Saved: manifest-${listingId}.csv`);

          // Parse the CSV
          const csvText = readFileSync(savePath, 'utf-8');
          const rows = parseCsvText(csvText);
          if (rows.length > 0) {
            items = csvRowsToItems(rows);
            manifestDownloaded = true;
            console.log(`    Parsed ${items.length} line items (${items.reduce((a, i) => a + i.qt, 0)} units)`);
          }
        } catch (dlErr) {
          console.log(`    Manifest download failed: ${dlErr.message}`);
        }
      } else {
        console.log('    No manifest download link found');
      }

      // Build the load object
      const palletCount = parseInt(detail.palletSpaces, 10) || parsed.palletCount || 1;
      const load = {
        id: 'BS-' + listingId.substring(0, 8).toUpperCase(),
        t: listing.title.length > 60 ? listing.title.substring(0, 57) + '...' : listing.title,
        sub: detail.location || listing.location || parsed.location,
        items,
        fr: estimateFreight(palletCount),
        end: new Date(Date.now() + 86400000).toISOString(),
        hue: categoryHue(category),
        condition: detail.condition || listing.condition,
        category: detail.category || category,
        inventoryType: detail.inventoryType || listing.inventoryType,
        shipmentSize: detail.shipmentSize || `${palletCount} Pallet${palletCount !== 1 ? 's' : ''}`,
        palletCount,
        source: manifestDownloaded ? 'scrape' : 'scrape',
        bstockUrl: listing.url,
        msrp: listing.msrp,
        percentOfMsrp: listing.percentOfMsrp,
        currentBid: listing.price,
        pricePerUnit: listing.pricePerUnit,
        numberOfBids: detail.numberOfBids,
        closesIn: detail.closesIn,
        hasManifest: manifestDownloaded,
      };

      loads.push(load);

    } catch (err) {
      console.log(`    Error: ${err.message}`);
    }
  }

  // ── Step 4: Output loads.json ──
  console.log(`\n\n  Writing ${loads.length} loads to ${OUTPUT_FILE}...`);

  const output = {
    scrapedAt: new Date().toISOString(),
    source: 'B-Stock Target Marketplace',
    totalListings: listings.length,
    processedListings: loads.length,
    withManifest: loads.filter(l => l.hasManifest).length,
    loads,
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log('  Done!\n');

  // Summary
  console.log('  Summary');
  console.log('  -------');
  console.log(`  Total listings found:  ${listings.length}`);
  console.log(`  Processed:             ${loads.length}`);
  console.log(`  With manifest:         ${output.withManifest}`);
  console.log(`  Output:                ${OUTPUT_FILE}\n`);

  await browser.close();
}

main().catch(err => {
  console.error('  Crawler error:', err.message);
  process.exit(1);
});
