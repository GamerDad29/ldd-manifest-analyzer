import { useState, useMemo, useCallback, useEffect } from 'react';
import { C } from './tokens';
import { LOADS } from './data/loads';
import { analyze } from './data/analyzer';
import { Header } from './components/Header';
import { LeftPanel } from './components/LeftPanel';
import { LoadDrawer } from './components/LoadDrawer';
import { OverviewTab } from './components/OverviewTab';
import { ItemBreakdownTab } from './components/ItemBreakdownTab';
import { BidModelerTab } from './components/BidModelerTab';
import type { AnalysisResult } from './types';

type TabKey = 'overview' | 'items' | 'bid';

const TABS: { k: TabKey; l: string }[] = [
  { k: 'overview', l: 'Overview' },
  { k: 'items', l: 'Item Breakdown' },
  { k: 'bid', l: 'Bid Modeler' },
];

export default function App() {
  const [selectedId, setSelectedId] = useState(LOADS[0]!.id);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [bid, setBid] = useState<number>(0);

  // Pre-compute analyses for all loads
  const analyses = useMemo(() => {
    const m: Record<string, AnalysisResult> = {};
    LOADS.forEach(l => { m[l.id] = analyze(l); });
    return m;
  }, []);

  const load = LOADS.find(l => l.id === selectedId)!;
  const a = analyses[selectedId]!;

  // Reset bid when switching loads
  useEffect(() => {
    setBid(Math.round(a.mb));
  }, [selectedId, a]);

  const pickLoad = useCallback((id: string) => {
    setSelectedId(id);
    setActiveTab('overview');
    setDrawerOpen(false);
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
        onUploadCsv={(file) => {
          // V1.5: parse CSV and add to loads
          console.log('CSV uploaded:', file.name);
        }}
        onScanNow={() => {
          // V1.5: trigger B-Stock API scan
          console.log('Scan triggered');
        }}
      />

      {/* Load drawer */}
      <LoadDrawer
        open={drawerOpen}
        loads={LOADS}
        analyses={analyses}
        selectedId={selectedId}
        onSelect={pickLoad}
        onClose={() => setDrawerOpen(false)}
      />

      {/* Main content */}
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
    </div>
  );
}
