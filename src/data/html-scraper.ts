/**
 * B-Stock HTML scraper.
 * Parses saved B-Stock HTML pages to extract auction listings and lot details.
 *
 * Supports two page types:
 * 1. Marketplace listing page (Target Liquidation Auction Marketplace)
 *    -> Extracts all visible auction cards with metadata
 * 2. Individual lot detail page
 *    -> Extracts full lot info (condition, shipment, weight, pallets, etc.)
 */

export interface ScrapedListing {
  title: string;
  location: string;
  price: string;           // current bid/price
  pricePerUnit: string;
  msrp: string;            // total MSRP string
  msrpValue: number;       // parsed MSRP number
  percentOfMsrp: string;
  condition: string;
  inventoryType: string;   // Customer Returns, Overstock, etc.
  url: string;
  // Parsed from title
  unitCount: number;
  palletCount: number;
  shipmentSize: string;
  category: string;
  brands: string;
}

export interface ScrapedLotDetail {
  title: string;
  location: string;
  condition: string;
  inventoryType: string;
  shipmentSize: string;
  category: string;
  description: string;
  weight: string;
  dimensions: string;
  palletSpaces: number;
  totalUnits: string;
  totalMSRP: string;
  buyingFormat: string;
  brands: string;
  closesIn: string;
  numberOfBids: string;
  manifestUrl: string | null;
}

/** Extract text content following a data-testid attribute */
function extractField(html: string, testId: string): string {
  // Match: data-testid="X" ... > TEXT <
  // Account for attributes between the testid and the closing >
  const pattern = new RegExp(
    `data-testid="${escapeRegex(testId)}"[^>]*>([^<]+)`,
  );
  const m = html.match(pattern);
  return m ? decodeHtmlEntities(m[1]!.trim()) : '';
}

/** Escape special regex characters */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Decode common HTML entities */
function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/\u00e9/g, 'e')  // accented e in "Decor"
    .replace(/\u00e8/g, 'e');
}

/** Parse a number from a string like "$23,324.31" or "2,662" */
function parseNum(s: string): number {
  const cleaned = s.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

/** Extract unit count from listing title like "2,662 Units" */
function extractUnits(title: string): number {
  const m = title.match(/([\d,]+)\s*Units?/i);
  return m ? parseNum(m[1]!) : 0;
}

/** Extract pallet count from title or shipment string */
function extractPallets(text: string): number {
  const m = text.match(/(\d+)\s*Pallet/i);
  return m ? parseInt(m[1]!, 10) : 0;
}

/** Extract category from title or infer from keywords */
function extractCategory(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('toy') || lower.includes('lego') || lower.includes('squishmallow')) return 'Toys';
  if (lower.includes('outdoor') || lower.includes('sport') || lower.includes('bicycle')) return 'Outdoor Sports';
  if (lower.includes('furniture')) return 'Furniture';
  if (lower.includes('bedding') || lower.includes('bath')) return 'Bedding & Bath';
  if (lower.includes('lighting') || lower.includes('light')) return 'Lighting';
  if (lower.includes('kitchen') || lower.includes('dining')) return 'Kitchen';
  if (lower.includes('decor') || lower.includes('home d')) return 'Home Decor';
  if (lower.includes('apparel') || lower.includes('clothing') || lower.includes('fashion')) return 'Clothing';
  if (lower.includes('health') || lower.includes('beauty') || lower.includes('makeup') || lower.includes('personal care')) return 'Health & Beauty';
  if (lower.includes('electronic')) return 'Electronics';
  if (lower.includes('baby') || lower.includes('newborn') || lower.includes('toddler') || lower.includes('infant')) return 'Baby';
  if (lower.includes('garden') || lower.includes('patio')) return 'Garden & Patio';
  if (lower.includes('pet')) return 'Pet Supplies';
  if (lower.includes('rug') || lower.includes('floor')) return 'Rugs';
  if (lower.includes('wall art') || lower.includes('art')) return 'Wall Art';
  if (lower.includes('mirror')) return 'Mirrors';
  if (lower.includes('appliance')) return 'Small Appliances';
  if (lower.includes('storage') || lower.includes('organization')) return 'Storage';
  if (lower.includes('seasonal') || lower.includes('christmas') || lower.includes('halloween')) return 'Seasonal';
  return 'Mixed';
}

/** Extract brand names from title like "by Schwinn, Kent & More" */
function extractBrands(title: string): string {
  const m = title.match(/by\s+(.+?)(?:,\s*(?:Upper|Franklin|Indianapolis|MD|IN|CA|TX|FL|OH|PA|NJ|GA|NC|VA|WA|OR|AZ|CO|MN|WI|MO|TN|SC|AL|LA|KY|OK|CT|IA|MS|AR|KS|NE|NV|NM|WV|ID|HI|ME|NH|RI|MT|DE|SD|ND|AK|VT|WY|DC)\b)/i);
  if (m) return m[1]!.trim();
  return '';
}

/** Extract shipment size from title like "Truckload (26 Pallets)" or "3 Pallets" */
function extractShipmentSize(title: string): string {
  const truckMatch = title.match(/Truckload\s*\((\d+)\s*Pallets?\)/i);
  if (truckMatch) return `Truckload (${truckMatch[1]} Pallets)`;

  const palletMatch = title.match(/(\d+)\s*Pallets?\s+of/i);
  if (palletMatch) return `${palletMatch[1]} Pallet${parseInt(palletMatch[1]!, 10) !== 1 ? 's' : ''}`;

  return '';
}

// ─── Marketplace Listing Page Parser ────────────────────────────

/**
 * Parse a B-Stock marketplace listing page (e.g., "Target Liquidation Auction Marketplace").
 * Extracts all auction cards visible on the page.
 */
export function parseListingPage(html: string): ScrapedListing[] {
  // Split HTML by search-result-card boundaries
  const cardSections = html.split(/data-testid="search-result-card"/);
  if (cardSections.length < 2) return [];

  const listings: ScrapedListing[] = [];

  for (let i = 1; i < cardSections.length; i++) {
    const section = cardSections[i]!;

    const title = extractField(section, 'listing-title');
    if (!title) continue;

    const msrpStr = extractField(section, 'msrp');
    const msrpValue = parseNum(msrpStr);

    // Extract URL
    const urlMatch = section.match(/href="(https:\/\/bstock\.com\/buy\/listings\/details\/[^"]+)"/);
    const url = urlMatch ? urlMatch[1]! : '';

    const listing: ScrapedListing = {
      title,
      location: extractField(section, 'listing-location'),
      price: extractField(section, 'price'),
      pricePerUnit: extractField(section, 'price-per-unit'),
      msrp: msrpStr,
      msrpValue,
      percentOfMsrp: extractField(section, 'percent-of-msrp'),
      condition: extractField(section, 'condition'),
      inventoryType: extractField(section, 'inventory-type'),
      url,
      // Parsed from title
      unitCount: extractUnits(title),
      palletCount: extractPallets(title),
      shipmentSize: extractShipmentSize(title),
      category: extractCategory(title),
      brands: extractBrands(title),
    };

    listings.push(listing);
  }

  return listings;
}

// ─── Lot Detail Page Parser ─────────────────────────────────────

/**
 * Parse a B-Stock individual lot detail page.
 * Extracts full metadata including condition, shipment details, weight, etc.
 */
export function parseLotDetailPage(html: string): ScrapedLotDetail {
  const title = extractField(html, 'lot.title') || extractField(html, 'listing-title');

  // Try to find manifest download URL
  const manifestMatch = html.match(/href="([^"]*manifest[^"]*\.csv[^"]*)"/i)
    || html.match(/href="([^"]*download[^"]*manifest[^"]*)"/i);

  return {
    title,
    location: extractField(html, 'listing-description-location')
      || extractField(html, 'listing-location'),
    condition: extractField(html, 'listing-description-condition')
      || extractField(html, 'condition'),
    inventoryType: extractField(html, 'listing-description-inventory-type')
      || extractField(html, 'inventory-type'),
    shipmentSize: extractField(html, 'listing-description-shipment-size')
      || extractShipmentSize(title),
    category: extractField(html, 'listing-description-category')
      || extractCategory(title),
    description: extractField(html, 'lot-description'),
    weight: extractField(html, 'Weight'),
    dimensions: extractField(html, 'Dimensions'),
    palletSpaces: parseInt(extractField(html, 'PalletSpaces'), 10) || extractPallets(title),
    totalUnits: extractField(html, 'manifest-stat-item--totalUnits'),
    totalMSRP: extractField(html, 'manifest-stat-item--totalMSRP'),
    buyingFormat: extractField(html, 'buying-format'),
    brands: extractField(html, 'seller-brands') || extractBrands(title),
    closesIn: extractField(html, 'closes-in'),
    numberOfBids: extractField(html, 'number-of-bids'),
    manifestUrl: manifestMatch ? manifestMatch[1]! : null,
  };
}

// ─── Page Type Detection ────────────────────────────────────────

export type PageType = 'listing' | 'detail' | 'unknown';

/** Detect whether an HTML file is a listing page or a lot detail page */
export function detectPageType(html: string): PageType {
  if (html.includes('data-testid="search-result-card"') || html.includes('data-testid="listing-grid"')) {
    return 'listing';
  }
  if (html.includes('data-testid="lot.title"') || html.includes('data-testid="lot-description"')) {
    return 'detail';
  }
  return 'unknown';
}

// ─── Convert scraped data to Load-compatible format ─────────────

import type { Load } from '../types';

/** Estimate freight from pallet count and location */
function estimateFreight(pallets: number): number {
  if (pallets <= 3) return 800;
  if (pallets <= 6) return 1500;
  if (pallets <= 12) return 2500;
  if (pallets <= 20) return 3800;
  return 4500;
}

/** Generate a stable ID from a listing URL or title */
function generateId(listing: ScrapedListing): string {
  if (listing.url) {
    // Use last segment of URL as ID
    const parts = listing.url.split('/');
    const slug = parts[parts.length - 1] || '';
    return 'BS-' + slug.substring(0, 8).toUpperCase();
  }
  // Fallback: hash from title
  let hash = 0;
  for (let i = 0; i < listing.title.length; i++) {
    hash = ((hash << 5) - hash) + listing.title.charCodeAt(i);
    hash = hash & hash;
  }
  return 'BS-' + Math.abs(hash).toString(36).substring(0, 8).toUpperCase();
}

/** Convert a ScrapedListing into a partial Load (no items, needs manifest CSV) */
export function scrapedListingToLoadMeta(listing: ScrapedListing): Omit<Load, 'items'> & { items: [] } {
  return {
    id: generateId(listing),
    t: listing.title.length > 60
      ? listing.title.substring(0, 57) + '...'
      : listing.title,
    sub: listing.location,
    items: [],
    fr: estimateFreight(listing.palletCount),
    end: new Date(Date.now() + 86400000).toISOString(), // default 24h from now
    hue: categoryHue(listing.category),
    condition: listing.condition,
    category: listing.category,
    inventoryType: listing.inventoryType,
    shipmentSize: listing.shipmentSize,
    palletCount: listing.palletCount,
    source: 'scrape',
  };
}

function categoryHue(cat: string): number {
  const hues: Record<string, number> = {
    'Toys': 30, 'Outdoor Sports': 150, 'Home Decor': 210,
    'Bedding & Bath': 260, 'Furniture': 180, 'Lighting': 45,
    'Kitchen': 15, 'Clothing': 330, 'Health & Beauty': 300,
    'Electronics': 240, 'Baby': 350, 'Mixed': 210,
  };
  return hues[cat] ?? 210;
}
