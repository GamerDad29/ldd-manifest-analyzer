import { useState } from 'react';
import { C } from '../tokens';
import { fm, pc } from '../utils';
import type { AnalysisResult } from '../types';

interface OverviewTabProps {
  a: AnalysisResult;
}

export function OverviewTab({ a }: OverviewTabProps) {
  const [scoreOpen, setScoreOpen] = useState(false);

  const sellable = Math.max(0, 1 - a.ww - a.shp);
  const barSegs = [
    { p: sellable, c: C.buy, l: 'Sellable' },
    { p: a.shp, c: C.consider, l: 'Seasonal Hold' },
    { p: a.ww, c: C.pass, l: 'Projected Waste' },
  ];

  const valBars = [
    { l: '<$10', v: a.vb.u10, c: C.pass },
    { l: '$10-25', v: a.vb.t25, c: C.orange },
    { l: '$25-50', v: a.vb.t50, c: C.consider },
    { l: '$50-100', v: a.vb.f100, c: C.buy },
    { l: '$100+', v: a.vb.o100, c: C.cyan },
  ];
  const maxVal = Math.max(...valBars.map(x => x.v));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { l: 'Total Retail', v: fm(a.tr), c: C.t1 },
          { l: 'Max Bid (20%)', v: fm(a.mb), c: C.buy, s: `incl. ${fm(a.fr)} freight` },
          { l: 'Items', v: a.ti.toLocaleString(), c: C.t1, s: `${a.us.toLocaleString()} SKUs` },
          { l: 'Avg Value', v: `$${a.ar.toFixed(2)}`, c: a.o50 >= 0.5 ? C.buy : a.o50 >= 0.35 ? C.consider : C.pass, s: `${pc(a.o50)} over $50` },
        ].map(m => (
          <div key={m.l} style={{
            background: C.card, borderRadius: 12,
            border: `1px solid ${C.border}`, padding: '16px 18px',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: C.t3,
              textTransform: 'uppercase' as const, letterSpacing: '0.14em', marginBottom: 10,
            }}>{m.l}</div>
            <div style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 32, letterSpacing: '-0.02em', lineHeight: 1,
              color: m.c, fontVariantNumeric: 'tabular-nums',
            }}>{m.v}</div>
            {m.s && <div style={{ fontSize: 10, color: C.t3, marginTop: 4 }}>{m.s}</div>}
          </div>
        ))}
      </div>

      {/* Real load bar */}
      <div style={{
        background: C.card, borderRadius: 14,
        border: `1px solid ${C.border}`, padding: '18px 20px',
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: C.t3,
          textTransform: 'uppercase' as const, letterSpacing: '0.14em', marginBottom: 10,
        }}>Real Load Breakdown</div>
        <div style={{
          height: 28, borderRadius: 6, overflow: 'hidden',
          display: 'flex', background: 'rgba(255,255,255,0.02)', marginBottom: 10,
        }}>
          {barSegs.map(s => (
            <div key={s.l} style={{
              width: pc(s.p), height: '100%', background: s.c,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
              color: s.l === 'Projected Waste' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.5)',
              transition: 'width 0.6s ease',
            }}>
              {s.p > 0.06 ? Math.round(s.p * 100) + '%' : ''}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 16 }}>
            {barSegs.map(s => (
              <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.t2 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: s.c }} />
                {s.l}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 18, fontSize: 13, fontWeight: 700 }}>
            <span style={{ color: C.buy }}>Sellable {fm(a.sr)}</span>
            <span style={{ color: C.gold }}>Revenue {fm(a.er)}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Score breakdown (collapsible) */}
        <div style={{
          background: C.card, borderRadius: 14,
          border: `1px solid ${C.border}`, padding: '18px 20px',
        }}>
          <div
            onClick={() => setScoreOpen(!scoreOpen)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', userSelect: 'none' as const,
            }}
          >
            <div style={{
              fontSize: 10, fontWeight: 700, color: C.t3,
              textTransform: 'uppercase' as const, letterSpacing: '0.14em',
            }}>Score Breakdown</div>
            <button
              aria-label="Toggle score breakdown"
              style={{
                width: 28, height: 28, borderRadius: 6,
                background: 'rgba(255,255,255,0.03)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: C.t3, transition: 'transform 0.3s ease',
                transform: scoreOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4.5L6 8.5L10 4.5" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <div style={{
            overflow: 'hidden',
            maxHeight: scoreOpen ? 400 : 0,
            opacity: scoreOpen ? 1 : 0,
            marginTop: scoreOpen ? 12 : 0,
            transition: 'max-height 0.35s ease, opacity 0.25s ease, margin-top 0.35s ease',
          }}>
            {a.rr.map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 8, marginBottom: 4,
                borderLeft: `3px solid ${r.g === 1 ? C.buy : r.g === -1 ? C.pass : C.consider}`,
                background: r.g === 1 ? C.buyDim : r.g === -1 ? C.passDim : C.considerDim,
              }}>
                <span style={{ fontSize: 12, color: C.t2 }}>{r.t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Value distribution (large) */}
        <div style={{
          background: C.card, borderRadius: 14,
          border: `1px solid ${C.border}`, padding: '18px 20px',
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: C.t3,
            textTransform: 'uppercase' as const, letterSpacing: '0.14em', marginBottom: 12,
          }}>Value Distribution</div>
          {valBars.map(x => (
            <div key={x.l} style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10,
            }}>
              <div style={{
                fontSize: 13, color: C.t2, fontWeight: 600,
                width: 54, textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums',
              }}>{x.l}</div>
              <div style={{
                flex: 1, height: 22, borderRadius: 6,
                background: 'rgba(255,255,255,0.02)', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: 6,
                  width: maxVal > 0 ? (x.v / maxVal * 100) + '%' : '0%',
                  background: x.c,
                  display: 'flex', alignItems: 'center', paddingLeft: 8,
                  fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,0.5)',
                  transition: 'width 0.5s ease',
                }}>
                  {x.v > maxVal * 0.15 ? x.v : ''}
                </div>
              </div>
              <div style={{
                fontSize: 13, color: C.t1, fontWeight: 700,
                width: 44, fontVariantNumeric: 'tabular-nums',
              }}>{x.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Confidence + SKU Alert: compact side-by-side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{
          background: C.card, borderRadius: 14,
          border: `1px solid ${C.border}`, padding: '18px 20px',
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: C.t3,
            textTransform: 'uppercase' as const, letterSpacing: '0.14em', marginBottom: 10,
          }}>Price Confidence</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
            <span style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 32, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
              color: a.cs >= 80 ? C.buy : a.cs >= 60 ? C.consider : C.pass,
            }}>{a.cs}</span>
            <span style={{ fontSize: 14, color: C.t3 }}>%</span>
          </div>
          <div style={{ fontSize: 12, color: C.t2 }}>{a.sc} items flagged</div>
          <div style={{ fontSize: 10, color: C.t3 }}>suspect retail pricing</div>
          <button style={{
            width: '100%', marginTop: 10, padding: 8,
            borderRadius: 8, border: `1px solid ${C.borderGold}`,
            background: 'transparent', color: C.gold,
            fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
            cursor: 'pointer', transition: 'background 0.2s',
            letterSpacing: '0.02em',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = C.goldDim; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >Validate Pricing</button>
        </div>

        {a.ds.length > 0 && (
          <div style={{
            background: C.card, borderRadius: 14,
            border: `1px solid ${C.border}`, padding: '18px 20px',
            borderLeft: `3px solid ${C.pass}`,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.pass, marginBottom: 8 }}>
              Deep SKU Alert
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {a.ds.slice(0, 4).map(([name, count]) => (
                <div key={name} style={{
                  fontSize: 11, color: C.t2,
                  background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: 6,
                }}>
                  {name} <span style={{ color: C.pass, fontWeight: 700 }}>x{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
