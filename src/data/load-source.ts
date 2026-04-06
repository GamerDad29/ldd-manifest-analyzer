import { LOADS as MOCK_LOADS } from './loads';
import type { Load } from '../types';

interface ScrapedData {
  scrapedAt: string;
  source: string;
  totalListings: number;
  processedListings: number;
  withManifest: number;
  loads: (Load & {
    bstockUrl?: string;
    msrp?: string;
    percentOfMsrp?: string;
    currentBid?: string;
    pricePerUnit?: string;
    numberOfBids?: string;
    closesIn?: string;
    hasManifest?: boolean;
  })[];
}

export interface LoadSourceResult {
  loads: Load[];
  source: 'scraped' | 'mock';
  scrapedAt: string | null;
  totalAvailable: number;
  withManifest: number;
}

/** Try to load scraped data from /loads.json, fall back to mock data */
export async function fetchLoads(): Promise<LoadSourceResult> {
  try {
    const response = await fetch('/loads.json');
    if (!response.ok) throw new Error('No scraped data');

    const data: ScrapedData = await response.json();
    if (!data.loads || data.loads.length === 0) throw new Error('Empty scraped data');

    return {
      loads: data.loads,
      source: 'scraped',
      scrapedAt: data.scrapedAt,
      totalAvailable: data.totalListings,
      withManifest: data.withManifest,
    };
  } catch {
    // Fall back to mock data
    return {
      loads: MOCK_LOADS,
      source: 'mock',
      scrapedAt: null,
      totalAvailable: MOCK_LOADS.length,
      withManifest: 0,
    };
  }
}
