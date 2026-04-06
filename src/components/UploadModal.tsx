import { useState, useMemo } from 'react';
import { C } from '../tokens';
import { parseManifestCsv } from '../data/csv-parser';
import { fm } from '../utils';
import type { Load } from '../types';

interface UploadModalProps {
  csvText: string;
  filename: string;
  onConfirm: (load: Load) => void;
  onCancel: () => void;
}

export function UploadModal({ csvText, filename, onConfirm, onCancel }: UploadModalProps) {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [freight, setFreight] = useState('');
  const [condition, setCondition] = useState('');
  const [shipmentSize, setShipmentSize] = useState('');

  // Parse on mount to show preview
  const parsed = useMemo(() => {
    return parseManifestCsv(csvText, filename);
  }, [csvText, filename]);

  const itemCount = parsed.load.items.reduce((a, i) => a + i.qt, 0);
  const totalRetail = parsed.load.items.reduce((a, i) => a + i.rp * i.qt, 0);
  const uniqueSkus = parsed.load.items.length;
  const brands = new Set(parsed.load.items.map(i => i.brand).filter(Boolean));
  const categories = new Set(parsed.load.items.map(i => i.cat));

  const handleConfirm = () => {
    const result = parseManifestCsv(csvText, filename, {
      title: title || undefined,
      location: location || undefined,
      freight: freight ? parseFloat(freight) : undefined,
      condition: condition || undefined,
      shipmentSize: shipmentSize || undefined,
    });
    onConfirm(result.load);
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    background: C.card,
    color: C.t1,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: 13,
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    fontSize: 10,
    fontWeight: 700 as const,
    color: C.t3,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    marginBottom: 4,
    display: 'block' as const,
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', zIndex: 210,
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 560, maxHeight: '85vh',
        background: C.surface,
        borderRadius: 18,
        border: `1px solid ${C.borderGold}`,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 20, color: C.t1,
            }}>Import Manifest</div>
            <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{filename}</div>
          </div>
          <button
            onClick={onCancel}
            aria-label="Close"
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              border: 'none', cursor: 'pointer',
              color: C.t2, fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'inherit',
            }}
          >&#x2715;</button>
        </div>

        {/* Content */}
        <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
          {/* Parse preview */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
            marginBottom: 20,
          }}>
            {[
              { l: 'Items', v: itemCount.toLocaleString() },
              { l: 'Retail', v: fm(totalRetail) },
              { l: 'SKUs', v: uniqueSkus.toLocaleString() },
              { l: 'Pallets', v: String(parsed.load.palletCount || '?') },
            ].map(m => (
              <div key={m.l} style={{
                background: C.card, borderRadius: 10, padding: '12px 14px',
                border: `1px solid ${C.border}`,
              }}>
                <div style={labelStyle}>{m.l}</div>
                <div style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: 22, color: C.t1, fontVariantNumeric: 'tabular-nums',
                }}>{m.v}</div>
              </div>
            ))}
          </div>

          {/* Detected info */}
          <div style={{
            display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16,
          }}>
            {[...categories].map(cat => (
              <span key={cat} style={{
                fontSize: 10, padding: '3px 10px', borderRadius: 12,
                background: C.cyanDim, color: C.cyan, fontWeight: 600,
              }}>{cat}</span>
            ))}
          </div>
          {brands.size > 0 && (
            <div style={{ fontSize: 11, color: C.t2, marginBottom: 16 }}>
              Brands: {[...brands].slice(0, 8).join(', ')}
              {brands.size > 8 ? ` +${brands.size - 8} more` : ''}
            </div>
          )}

          {/* Warnings */}
          {parsed.warnings.length > 0 && (
            <div style={{
              background: C.passDim, borderRadius: 10, padding: '10px 14px',
              marginBottom: 16, border: `1px solid ${C.passBorder}`,
            }}>
              {parsed.warnings.map((w, i) => (
                <div key={i} style={{ fontSize: 11, color: C.pass, marginBottom: 2 }}>{w}</div>
              ))}
            </div>
          )}

          {/* Metadata form */}
          <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, marginBottom: 12 }}>
            Load Details
            <span style={{ fontSize: 11, fontWeight: 400, color: C.t3, marginLeft: 8 }}>
              (optional, auto-detected if blank)
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={parsed.load.t}
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = C.gold; }}
                onBlur={e => { e.currentTarget.style.borderColor = C.border; }}
              />
            </div>
            <div>
              <label style={labelStyle}>Location / DC</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder={parsed.load.sub}
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = C.gold; }}
                onBlur={e => { e.currentTarget.style.borderColor = C.border; }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Freight ($)</label>
              <input
                type="number"
                value={freight}
                onChange={e => setFreight(e.target.value)}
                placeholder={String(parsed.load.fr)}
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = C.gold; }}
                onBlur={e => { e.currentTarget.style.borderColor = C.border; }}
              />
            </div>
            <div>
              <label style={labelStyle}>Condition</label>
              <input
                type="text"
                value={condition}
                onChange={e => setCondition(e.target.value)}
                placeholder={parsed.load.condition || 'New'}
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = C.gold; }}
                onBlur={e => { e.currentTarget.style.borderColor = C.border; }}
              />
            </div>
            <div>
              <label style={labelStyle}>Shipment Size</label>
              <input
                type="text"
                value={shipmentSize}
                onChange={e => setShipmentSize(e.target.value)}
                placeholder={parsed.load.shipmentSize || ''}
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = C.gold; }}
                onBlur={e => { e.currentTarget.style.borderColor = C.border; }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 24px', borderRadius: 10,
              background: 'transparent', border: `1px solid ${C.border}`,
              color: C.t2, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >Cancel</button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '10px 28px', borderRadius: 10,
              background: C.gold, border: 'none',
              color: C.bg, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(232,176,58,0.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >Analyze Load</button>
        </div>
      </div>
    </>
  );
}
