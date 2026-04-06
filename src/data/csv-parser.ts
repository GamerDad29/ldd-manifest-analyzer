import type { Item, Load, SeasonalInfo } from '../types';
import { CATEGORY_CONFIG } from './category-config';

/**
 * Parse a B-Stock manifest CSV into a Load object.
 *
 * Expected columns (Target manifest format):
 * Item #, Seller Category, Item Description, Qty, Unit Retail, Ext. Retail,
 * Brand, UPC, TCIN, Origin, Category, Condition, Product Class, Category Code,
 * Division, Department, Optoro Condition, Pallet ID, Subcategory, Lot ID
 */

interface RawRow {
  'Item #': string;
  'Seller Category': string;
  'Item Description': string;
  'Qty': string;
  'Unit Retail': string;
  'Ext. Retail': string;
  'Brand': string;
  'UPC': string;
  'TCIN': string;
  'Origin': string;
  'Category': string;
  'Condition': string;
  'Product Class': string;
  'Category Code': string;
  'Division': string;
  'Department': string;
  'Optoro Condition': string;
  'Pallet ID': string;
  'Subcategory': string;
  'Lot ID': string;
}

/** Seasonal keyword detection */
const SEASONAL_KEYWORDS: Record<string, { h: string; m: number[] }> = {
  christmas: { h: 'Christmas', m: [10, 11] },
  holiday: { h: 'Christmas', m: [10, 11] },
  xmas: { h: 'Christmas', m: [10, 11] },
  halloween: { h: 'Halloween', m: [9] },
  easter: { h: 'Easter', m: [2, 3] },
  valentine: { h: "Valentine's", m: [1] },
  'st. patrick': { h: "St. Patrick's", m: [2] },
  'fourth of july': { h: 'July 4th', m: [5, 6] },
  'independence day': { h: 'July 4th', m: [5, 6] },
  thanksgiving: { h: 'Thanksgiving', m: [10] },
};

function detectSeasonal(name: string): SeasonalInfo | null {
  const lower = name.toLowerCase();
  const currentMonth = new Date().getMonth();
  for (const [kw, info] of Object.entries(SEASONAL_KEYWORDS)) {
    if (lower.includes(kw)) {
      return {
        ...info,
        now: info.m.includes(currentMonth) || info.m.includes(currentMonth + 1),
      };
    }
  }
  return null;
}

/** Parse CSV text into array of objects using header row */
function parseCsvText(text: string): RawRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]!);
  const rows: RawRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]!);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]!] = values[j] || '';
    }
    rows.push(row as unknown as RawRow);
  }
  return rows;
}

/** Parse a single CSV line, handling quoted fields with commas and escaped quotes */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"') {
        // Check for escaped quote ""
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip next quote
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

/** Detect suspect pricing: price seems too high or too low for the category */
function isSuspectPricing(unitRetail: number, category: string): boolean {
  // Flag items with $0 or extremely high retail relative to typical category ranges
  if (unitRetail <= 0) return true;
  if (unitRetail > 2000) return true;

  // Category-specific flags
  const lower = category.toLowerCase();
  if (lower.includes('toy') && unitRetail > 500) return true;
  if (lower.includes('apparel') && unitRetail > 300) return true;
  if (lower.includes('clothing') && unitRetail > 300) return true;

  return false;
}

/** Convert raw CSV rows into Item[] */
function rowsToItems(rows: RawRow[]): Item[] {
  return rows.map((row, idx) => {
    const qty = parseInt(row['Qty'], 10) || 1;
    const unitRetail = parseFloat(row['Unit Retail']) || 0;
    const category = normalizeCategory(row['Category'], row['Seller Category']);
    const config = CATEGORY_CONFIG[category];
    const condition = row['Condition'] || 'NEW';

    // Adjust waste/sell rates based on condition
    let wasteRate = config?.w ?? 0.15;
    let sellRate = config?.s ?? 0.45;

    if (condition === 'USED_GOOD') {
      wasteRate += 0.05;
      sellRate -= 0.05;
    } else if (condition === 'USED_FAIR' || condition === 'SALVAGE') {
      wasteRate += 0.15;
      sellRate -= 0.15;
    }

    return {
      id: idx,
      nm: row['Item Description'] || 'Unknown Item',
      cat: category,
      rp: unitRetail,
      qt: qty,
      wr: Math.min(wasteRate, 0.8),
      sr: Math.max(sellRate, 0.1),
      pf: config?.p ?? 0,
      se: detectSeasonal(row['Item Description'] || ''),
      sp: isSuspectPricing(unitRetail, category),
      // Real manifest fields
      itemNum: row['Item #'],
      brand: row['Brand'],
      upc: row['UPC'],
      tcin: row['TCIN'],
      condition: condition,
      sellerCat: row['Seller Category'],
      subcat: row['Subcategory'],
      palletId: row['Pallet ID'],
      origin: row['Origin'],
      department: row['Department'],
    };
  });
}

/** Normalize B-Stock category strings to our display categories */
function normalizeCategory(category: string, sellerCategory: string): string {
  const cat = (category || '').toUpperCase().replace(/_/g, ' ');
  const seller = (sellerCategory || '').toUpperCase();

  // Map B-Stock categories to our display names
  if (cat.includes('TOY') || seller.includes('TOY')) return 'Toys';
  if (cat.includes('OUTDOOR') || cat.includes('SPORT')) return 'Outdoor Sports';
  if (cat.includes('FURNITURE')) return 'Furniture';
  if (cat.includes('BEDDING') || cat.includes('BATH')) return 'Bedding & Bath';
  if (cat.includes('LIGHTING') || cat.includes('LIGHT')) return 'Lighting';
  if (cat.includes('KITCHEN') || cat.includes('DINING')) return 'Kitchen';
  if (cat.includes('DECOR') || cat.includes('HOME')) return 'Home Decor';
  if (cat.includes('RUG') || cat.includes('FLOOR')) return 'Rugs';
  if (cat.includes('WALL') || cat.includes('ART')) return 'Wall Art';
  if (cat.includes('MIRROR')) return 'Mirrors';
  if (cat.includes('CLOTH') || cat.includes('APPAREL') || cat.includes('FASHION')) return 'Clothing';
  if (cat.includes('HEALTH') || cat.includes('BEAUTY') || cat.includes('PERSONAL')) return 'Health & Beauty';
  if (cat.includes('APPLIANCE')) return 'Small Appliances';
  if (cat.includes('ELECTRONIC') || cat.includes('TECH')) return 'Electronics';
  if (cat.includes('GARDEN') || cat.includes('PATIO')) return 'Garden & Patio';
  if (cat.includes('PET')) return 'Pet Supplies';
  if (cat.includes('FOOD') || cat.includes('GROCERY') || cat.includes('BEVERAGE')) return 'Food & Beverage';
  if (cat.includes('BABY') || cat.includes('INFANT') || cat.includes('NEWBORN') || cat.includes('TODDLER')) return 'Baby';
  if (cat.includes('BICYCLE') || seller.includes('BICYCLE')) return 'Outdoor Sports';
  if (cat.includes('SEASONAL')) return 'Seasonal';
  if (cat.includes('STORAGE') || cat.includes('ORGANIZATION')) return 'Storage';

  // Fallback: use the raw category, title-cased
  if (category) {
    return category.split('_').map(w =>
      w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    ).join(' ');
  }
  return 'Other';
}

/** Extract unique pallet IDs from items */
function countPallets(items: Item[]): number {
  const pallets = new Set(items.map(i => i.palletId).filter(Boolean));
  return pallets.size || 1;
}

/** Generate a load ID from filename */
function generateLoadId(filename: string): string {
  const clean = filename
    .replace(/^BStock_/, '')
    .replace(/_Manifest.*$/, '')
    .replace(/\.csv$/i, '');

  // Try to extract a meaningful short ID
  const words = clean.split(/[\s_-]+/).filter(w => w.length > 0);
  if (words.length >= 2) {
    return words.slice(0, 3).map(w => w.substring(0, 4).toUpperCase()).join('-');
  }
  return 'CSV-' + Date.now().toString(36).toUpperCase();
}

/** Extract title from filename */
function extractTitle(filename: string): string {
  let title = filename
    .replace(/^BStock_/, '')
    .replace(/_Manifest.*$/, '')
    .replace(/\.csv$/i, '')
    .replace(/_/g, ' ');

  // Trim if too long
  if (title.length > 60) {
    // Try to get a meaningful short version
    const match = title.match(/^(.*?),\s*\d+\s*Units/);
    if (match) {
      title = match[1]!;
    } else {
      title = title.substring(0, 57) + '...';
    }
  }
  return title;
}

/** Extract location from filename or items */
function extractLocation(filename: string, items: Item[]): string {
  // Check filename for location patterns
  const locMatch = filename.match(/,\s*([A-Z][a-z]+(?: [A-Z][a-z]+)*,\s*[A-Z]{2})/);
  if (locMatch) return locMatch[1]!;

  // Fallback: check if all items have same origin
  const origins = new Set(items.map(i => i.origin).filter(Boolean));
  if (origins.size === 1) return `Origin: ${[...origins][0]}`;

  return 'Unknown Location';
}

export interface ParseResult {
  load: Load;
  warnings: string[];
}

/** Main entry: parse a CSV file into a Load */
export function parseManifestCsv(
  csvText: string,
  filename: string,
  overrides?: {
    freight?: number;
    auctionEnd?: string;
    title?: string;
    location?: string;
    condition?: string;
    shipmentSize?: string;
  }
): ParseResult {
  const warnings: string[] = [];
  const rows = parseCsvText(csvText);

  if (rows.length === 0) {
    warnings.push('No data rows found in CSV');
    return {
      load: {
        id: generateLoadId(filename),
        t: overrides?.title || 'Empty Manifest',
        sub: overrides?.location || 'Unknown',
        items: [],
        fr: overrides?.freight || 0,
        end: overrides?.auctionEnd || new Date(Date.now() + 86400000).toISOString(),
        hue: 210,
        source: 'csv',
      },
      warnings,
    };
  }

  // Validate required columns
  const firstRow = rows[0]!;
  const requiredCols = ['Item Description', 'Qty', 'Unit Retail'];
  for (const col of requiredCols) {
    if (!(col in firstRow) || firstRow[col as keyof RawRow] === undefined) {
      warnings.push(`Missing required column: "${col}"`);
    }
  }

  const items = rowsToItems(rows);
  const palletCount = countPallets(items);

  // Check for data quality issues
  const zeroPrice = items.filter(i => i.rp <= 0).length;
  if (zeroPrice > 0) {
    warnings.push(`${zeroPrice} items have $0 or negative retail price`);
  }

  const suspectCount = items.filter(i => i.sp).length;
  if (suspectCount > items.length * 0.1) {
    warnings.push(`${suspectCount} items (${Math.round(suspectCount / items.length * 100)}%) flagged as suspect pricing`);
  }

  // Detect conditions across the load
  const conditions = new Set(items.map(i => i.condition).filter(Boolean));
  const loadCondition = conditions.size === 1 ? [...conditions][0]! :
    conditions.size > 1 ? 'Mixed' : 'Unknown';

  // Detect categories
  const catCounts: Record<string, number> = {};
  items.forEach(i => { catCounts[i.cat] = (catCounts[i.cat] || 0) + i.qt; });
  const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Mixed';

  const load: Load = {
    id: generateLoadId(filename),
    t: overrides?.title || extractTitle(filename),
    sub: overrides?.location || extractLocation(filename, items),
    items,
    fr: overrides?.freight || estimateFreight(palletCount),
    end: overrides?.auctionEnd || new Date(Date.now() + 86400000).toISOString(),
    hue: categoryHue(topCat),
    condition: overrides?.condition || loadCondition,
    category: topCat,
    inventoryType: 'Overstock',
    shipmentSize: overrides?.shipmentSize || `${palletCount} Pallet${palletCount !== 1 ? 's' : ''}`,
    palletCount,
    source: 'csv',
  };

  return { load, warnings };
}

/** Estimate freight cost based on pallet count */
function estimateFreight(pallets: number): number {
  if (pallets <= 3) return 800;       // LTL small
  if (pallets <= 6) return 1500;      // LTL medium
  if (pallets <= 12) return 2500;     // LTL large
  if (pallets <= 20) return 3800;     // partial truckload
  return 4500;                        // full truckload
}

/** Map category to ambient hue for UI */
function categoryHue(cat: string): number {
  const hues: Record<string, number> = {
    'Toys': 30,
    'Outdoor Sports': 150,
    'Home Decor': 210,
    'Bedding & Bath': 260,
    'Furniture': 180,
    'Lighting': 45,
    'Kitchen': 15,
    'Clothing': 330,
    'Health & Beauty': 300,
    'Electronics': 240,
    'Baby': 350,
  };
  return hues[cat] ?? 210;
}

/** Read a File object and return its text content */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
