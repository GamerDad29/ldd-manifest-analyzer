import { useState, useMemo, useCallback, useEffect } from 'react';
import { C } from './tokens';
import { LOADS } from './data/loads';
import { analyze } from './data/analyzer';
import { readFileAsText } from './data/csv-parser';
import { Header } from './components/Header';
import { LeftPanel } from './components/LeftPanel';
import { LoadDrawer } from './components/LoadDrawer';
import { OverviewTab } from './components/OverviewTab';
import { ItemBreakdownTab } from './components/ItemBreakdownTab';
import { BidModelerTab } from './components/BidModelerTab';
import { UploadModal } from './components/UploadModal';
import type { Load, AnalysisResult } from './types';

type TabKey = 'overview' | 'items' | 'bid';

const TABS: { k: TabKey; l: string }[] = [
  { k: 'overview', l: 'Overview' },
  { k: 'items', l: 'Item Breakdown' },
  { k: 'bid', l: 'Bid Modeler' },
];

export default function App() {
  const [loads, setLoads] = useState<Load[]>(LOADS);
  const [selectedId, setSelectedId] = useState(LOADS[0]!.id);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [bid, setBid] = useState<number>(0);
  const [uploadModal, setUploadModal] = useState<{ csvText: string; filename: string } | null>(null);

  // Compute analyses for all loads
  const analyses = useMemo(() => {
    const m: Record<string, AnalysisResult> = {};
    loads.forEach(l => { m[l.id] = analyze(l); });
    return m;
  }, [loads]);

  const load = loads.find(l => l.id === selectedId);
  const a = load ? analyses[selectedId] : undefined;

  // Reset bid when switching loads
  useEffect(() => {
    if (a) setBid(Math.round(a.mb));
  }, [selectedId, a]);

  const pickLoad = useCallback((id: string) => {
    setSelectedId(id);
    setActiveTab('overview');
    setDrawerOpen(false);
  }, []);

  const handleUploadCsv = useCallback(async (file: File) => {
    try {
      const text = await readFileAsText(file);
      setUploadModal({ csvText: text, filename: file.name });
    } catch {
      console.error('Failed to read CSV file');
    }
  }, []);

  const handleUploadConfirm = useCallback((newLoad: Load) => {
    setLoads(prev => [...prev, newLoad]);
    setSelectedId(newLoad.id);
    setActiveTab('overview');
    setUploadModal(null);
  }, []);

  const strongCount = Object.values(analyses).filter(x => x.grade === 'green').length;

  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      background: C.bg, color: C.t1,
      fontFamily: "'DM Sans', system-ui, sans-serif",
      position: 'relative',
    }}>
      {/* Global styles */}
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        button { font-family: inherit; }
        body { margin: 0; }

        /* Grain overlay */
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9999;
          opacity: 0.015;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-repeat: repeat;
          mix-blend-mode: overlay;
        }

        /* Warm vignette */
        body::after {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%);
        }

        /* Scrollbar styling */
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.04); border-radius: 2px; }

        /* Range slider thumb */
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 24px; height: 24px; border-radius: 50%;
          background: ${C.gold}; cursor: pointer;
          border: 3px solid ${C.bg};
          box-shadow: 0 0 14px ${C.goldGlow};
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* Header */}
      <Header
        strongCount={strongCount}
        onToggleDrawer={() => setDrawerOpen(!drawerOpen)}
        drawerOpen={drawerOpen}
        onUploadCsv={handleUploadCsv}
        onScanNow={() => {
          // V2.0: trigger B-Stock scraper
          console.log('Scan triggered');
        }}
      />

      {/* Load drawer */}
      <LoadDrawer
        open={drawerOpen}
        loads={loads}
        analyses={analyses}
        selectedId={selectedId}
        onSelect={pickLoad}
        onClose={() => setDrawerOpen(false)}
      />

      {/* Upload modal */}
      {uploadModal && (
        <UploadModal
          csvText={uploadModal.csvText}
          filename={uploadModal.filename}
          onConfirm={handleUploadConfirm}
          onCancel={() => setUploadModal(null)}
        />
      )}

      {/* Main content */}
      {load && a && (
        <div style={{
          position: 'relative', zIndex: 10,
          height: 'calc(100vh - 56px)',
          display: 'grid', gridTemplateColumns: '360px 1fr',
          overflow: 'hidden',
        }}>
          {/* Left panel */}
          <LeftPanel load={load} analysis={a} />

          {/* Right panel */}
          <div style={{
            padding: '20px 24px', overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            {/* Tabs */}
            <div style={{
              display: 'flex', gap: 2,
              background: 'rgba(255,255,255,0.02)', borderRadius: 10,
              padding: 3, width: 'fit-content',
            }} role="tablist">
              {TABS.map(t => (
                <button
                  key={t.k}
                  role="tab"
                  aria-selected={activeTab === t.k}
                  onClick={() => setActiveTab(t.k)}
                  style={{
                    padding: '8px 22px', borderRadius: 8,
                    fontSize: 12, fontWeight: 600,
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'background 0.25s, color 0.25s',
                    background: activeTab === t.k ? C.goldDim : 'transparent',
                    color: activeTab === t.k ? C.gold : C.t3,
                  }}
                >{t.l}</button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === 'overview' && <OverviewTab a={a} />}
            {activeTab === 'items' && <ItemBreakdownTab a={a} />}
            {activeTab === 'bid' && <BidModelerTab a={a} bid={bid} onBidChange={setBid} />}
          </div>
        </div>
      )}
    </div>
  );
}
