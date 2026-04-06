import { useRef } from 'react';
import { C } from '../tokens';

interface HeaderProps {
  strongCount: number;
  onToggleDrawer: () => void;
  drawerOpen: boolean;
  onUploadCsv: (file: File) => void;
  onScanNow: () => void;
}

export function Header({ strongCount, onToggleDrawer, drawerOpen, onUploadCsv, onScanNow }: HeaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <header style={{
      position: 'relative', zIndex: 100, height: 56,
      padding: '0 24px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: `1px solid ${C.border}`,
      background: 'linear-gradient(180deg, rgba(232,176,58,0.02) 0%, transparent 100%)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={onToggleDrawer}
          aria-label="Open load drawer"
          style={{
            width: 38, height: 38, borderRadius: 10,
            background: drawerOpen ? C.goldDim : 'rgba(255,255,255,0.03)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', cursor: 'pointer', transition: 'background 0.2s',
          }}
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
            <rect y="0" width="18" height="2" rx="1" fill={drawerOpen ? C.gold : C.t2} />
            <rect y="6" width={drawerOpen ? '12' : '18'} height="2" rx="1" fill={C.t2}
              style={{ transition: 'width 0.3s' }} />
            <rect y="12" width="18" height="2" rx="1" fill={C.t2} />
          </svg>
        </button>
        <span style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 22, color: C.gold, letterSpacing: '-0.01em',
        }}>Lucky Duck</span>
        <span style={{
          fontSize: 11, color: C.t3, fontWeight: 500,
          marginLeft: 6, letterSpacing: '0.05em', textTransform: 'uppercase' as const,
        }}>Dealz</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Status pills */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 16px', borderRadius: 8, fontSize: 11, fontWeight: 600,
          background: C.buyDim, color: C.buy,
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: C.buy, boxShadow: `0 0 10px rgba(58,232,143,0.4)`,
          }} />
          {strongCount} Strong
        </div>
        <div style={{
          padding: '6px 16px', borderRadius: 8, fontSize: 11,
          background: 'rgba(255,255,255,0.02)', color: C.t3,
        }}>
          Scanned {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </div>

        {/* Separator dot */}
        <div style={{ width: 3, height: 3, borderRadius: '50%', background: C.t3 }} />

        {/* Scan Now */}
        <button
          onClick={onScanNow}
          aria-label="Scan B-Stock now"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600,
            border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.03)',
            color: C.t2, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'background 0.2s, border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = C.goldDim;
            e.currentTarget.style.borderColor = C.borderGold;
            e.currentTarget.style.color = C.gold;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            e.currentTarget.style.borderColor = C.border;
            e.currentTarget.style.color = C.t2;
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6" /><path d="M21.34 13.72A10 10 0 1 1 18.57 4.1L21.5 2" />
          </svg>
          Scan Now
        </button>

        {/* Upload CSV */}
        <button
          onClick={() => fileRef.current?.click()}
          aria-label="Upload manifest CSV"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600,
            border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.03)',
            color: C.t2, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'background 0.2s, border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = C.goldDim;
            e.currentTarget.style.borderColor = C.borderGold;
            e.currentTarget.style.color = C.gold;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            e.currentTarget.style.borderColor = C.border;
            e.currentTarget.style.color = C.t2;
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload CSV
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          style={{ display: 'none' }}
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) onUploadCsv(file);
            e.target.value = '';
          }}
        />
      </div>
    </header>
  );
}
