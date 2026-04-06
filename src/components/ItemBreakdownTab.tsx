import { C } from '../tokens';
import { fd } from '../utils';
import type { AnalysisResult } from '../types';

interface ItemBreakdownTabProps {
  a: AnalysisResult;
}

const CAT_COLORS: Record<string, { bg: string; fg: string }> = {
  'Bedding':          { bg: C.cyanDim, fg: C.cyan },
  'Furniture':        { bg: 'rgba(139,92,246,0.08)', fg: '#8b5cf6' },
  'Kitchen':          { bg: 'rgba(232,147,58,0.08)', fg: C.orange },
  'Lighting':         { bg: C.considerDim, fg: C.consider },
  'Toys':             { bg: C.buyDim, fg: C.buy },
  'Home Decor':       { bg: C.goldDim, fg: C.gold },
  'Wall Art':         { bg: 'rgba(139,92,246,0.08)', fg: '#8b5cf6' },
  'Rugs':             { bg: C.passDim, fg: C.pass },
  'Mirrors':          { bg: 'rgba(255,255,255,0.04)', fg: C.t2 },
  'Clothing':         { bg: 'rgba(236,72,153,0.08)', fg: '#ec4899' },
  'Health & Beauty':  { bg: 'rgba(45,212,168,0.08)', fg: '#2dd4a8' },
  'Small Appliances': { bg: 'rgba(100,116,139,0.08)', fg: '#64748b' },
};

function getCatColor(cat: string) {
  return CAT_COLORS[cat] || { bg: 'rgba(255,255,255,0.04)', fg: C.t2 };
}

/** Generate a fake SKU from item name for mock display */
function fakeSku(name: string, id: number): string {
  const hash = (name.length * 37 + id * 13) % 999;
  const prefix = (name.charCodeAt(0) * 3 + 100) % 900 + 100;
  const mid = (id * 7 + 10) % 100;
  return `${prefix}-${String(mid).padStart(2, '0')}-${String(hash).padStart(4, '0')}`;
}

export function ItemBreakdownTab({ a }: ItemBreakdownTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: C.t3,
          textTransform: 'uppercase' as const, letterSpacing: '0.14em',
        }}>Top Items by Retail Value</div>
        <div style={{ fontSize: 11, color: C.t3 }}>
          {a.ti.toLocaleString()} items total
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
      }}>
        {a.top.map((item, i) => {
          const cc = getCatColor(item.cat);
          return (
            <div key={item.id + '-' + i} style={{
              background: C.card, borderRadius: 12,
              border: `1px solid ${C.border}`, overflow: 'hidden',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Image placeholder */}
              <div style={{
                width: '100%', height: 100,
                background: `linear-gradient(135deg, ${C.surface}, ${C.card})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                  stroke={C.t3} strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
              </div>
              {/* Body */}
              <div style={{ padding: '10px 12px' }}>
                <div style={{
                  display: 'inline-block', fontSize: 9, fontWeight: 700,
                  padding: '2px 8px', borderRadius: 4, marginBottom: 4,
                  textTransform: 'uppercase' as const, letterSpacing: '0.06em',
                  background: cc.bg, color: cc.fg,
                }}>{item.cat}</div>
                <div style={{
                  fontSize: 12, fontWeight: 600, color: C.t1,
                  marginBottom: 4, whiteSpace: 'nowrap',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{item.nm}</div>
                {item.brand && (
                  <div style={{ fontSize: 10, color: C.t2, marginBottom: 2, fontWeight: 600 }}>
                    {item.brand}
                  </div>
                )}
                <div style={{ fontSize: 10, color: C.t3, marginBottom: 2 }}>
                  Qty: {item.qt}
                  {item.condition && item.condition !== 'NEW' && (
                    <span style={{ color: C.consider }}> &middot; {item.condition}</span>
                  )}
                </div>
                <div style={{ fontSize: 9, color: C.t3, marginBottom: 4 }}>
                  {item.tcin ? `TCIN: ${item.tcin}` : `SKU: ${fakeSku(item.nm, item.id)}`}
                  {item.upc && ` &middot; UPC: ${item.upc}`}
                </div>
                <div style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: 18, fontVariantNumeric: 'tabular-nums',
                  color: i < 4 ? C.cyan : i < 8 ? C.buy : C.consider,
                }}>{fd(item.rp)}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        textAlign: 'center' as const, padding: 12,
        fontSize: 11, color: C.t3,
      }}>
        Showing top {a.top.length} of {a.us.toLocaleString()} unique SKUs &middot; Images load via Redsky API
      </div>
    </div>
  );
}
