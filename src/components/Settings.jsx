import { useState, useEffect, useRef } from 'react';

const STYLES = [
  { key: 'basic', label: 'Basic', desc: 'hard threshold' },
  { key: 'outline', label: 'Outline Contrast', desc: 'edges only' },
  { key: 'simplified', label: 'Simplified', desc: 'floyd-steinberg' },
  { key: 'nodithering', label: 'No Dithering', desc: 'nearest neighbor' },
];

export default function Settings({ settings, onChange, onAutoThreshold, onCopy, onSavePng }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const modalRef = useRef(null);
  const sheetRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleChange = (key, value) => {
    onChange({ ...settings, [key]: value });
  };

  const currentLabel = STYLES.find((s) => s.key === settings.style)?.label || 'No Dithering';

  const selectStyle = (key) => {
    handleChange('style', key);
    setModalOpen(false);
  };

  useEffect(() => {
    if (!modalOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [modalOpen]);

  useEffect(() => {
    if (!sheetOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setSheetOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [sheetOpen]);

  const precision = settings.precision;
  const pxVal = Math.round((1 - precision) * 255);

  // Desktop: flat bar
  if (!isMobile) {
    return (
      <>
        <div className="settings">
          <div className="setting-group">
            <label htmlFor="precision">Precision</label>
            <input
              id="precision"
              type="range"
              min="0.05"
              max="0.95"
              step="0.05"
              value={precision}
              onChange={(e) => handleChange('precision', parseFloat(e.target.value))}
            />
            <span className="setting-value">{pxVal}px</span>
            <button className="auto-btn" onClick={onAutoThreshold} title="auto threshold (Otsu)">auto</button>
          </div>

          <div className="setting-group">
            <label htmlFor="scale">Scale</label>
            <input
              id="scale"
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={settings.scale}
              onChange={(e) => handleChange('scale', parseFloat(e.target.value))}
            />
            <span className="setting-value">{(settings.scale * 100).toFixed(0)}%</span>
          </div>

          <div className="setting-group toggle-group">
            <label htmlFor="invert">Invert</label>
            <label className="toggle">
              <input
                id="invert"
                type="checkbox"
                checked={settings.invert}
                onChange={(e) => handleChange('invert', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-group toggle-group">
            <label htmlFor="crop">Crop</label>
            <label className="toggle">
              <input
                id="crop"
                type="checkbox"
                checked={settings.crop}
                onChange={(e) => handleChange('crop', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-group">
            <label htmlFor="fontSize">Size</label>
            <input
              id="fontSize"
              type="range"
              min="8"
              max="24"
              step="1"
              value={settings.fontSize}
              onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
            />
            <span className="setting-value">{settings.fontSize}px</span>
          </div>

          <div className="setting-group">
            <button className="style-trigger" onClick={() => setModalOpen(true)}>
              styles · {currentLabel}
            </button>
          </div>

          <div className="setting-group">
            <span className="dimensions-label">
              {settings.dimensions
                ? `${settings.dimensions.cols}×${settings.dimensions.rows}`
                : '—×—'}
            </span>
          </div>
        </div>

        {modalOpen && (
          <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
            <div className="modal-box" ref={modalRef} onClick={(e) => e.stopPropagation()}>
              <div className="modal-title">select style</div>
              {STYLES.map((s) => (
                <div
                  key={s.key}
                  className={`modal-option${settings.style === s.key ? ' selected' : ''}`}
                  onClick={() => selectStyle(s.key)}
                >
                  <span className="modal-option-name">{s.label}</span>
                  <span className="modal-option-desc">{s.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  }

  // Mobile: bottom sheet
  return (
    <>
      {/* Collapsed bar */}
      <div className="sheet-collapsed" onClick={() => setSheetOpen(true)}>
        <span className="sheet-handle" />
        <span className="sheet-preview">
          {settings.dimensions
            ? `${settings.dimensions.cols}×${settings.dimensions.rows}`
            : '—×—'} · {pxVal}px · {(settings.scale * 100).toFixed(0)}%
        </span>
      </div>

      {/* Expanded sheet */}
      <div className={`sheet-backdrop${sheetOpen ? ' open' : ''}`} onClick={() => setSheetOpen(false)} />
      <div className={`sheet-panel${sheetOpen ? ' open' : ''}`} ref={sheetRef}>
        <div className="sheet-header">
          <span className="sheet-handle" />
          <span className="sheet-title">settings</span>
          <button className="sheet-close" onClick={() => setSheetOpen(false)}>✕</button>
        </div>

        <div className="sheet-body">
          {/* Precision */}
          <div className="sheet-row">
            <div className="sheet-row-label">Precision</div>
            <div className="sheet-row-control">
              <input
                id="precision-m"
                type="range"
                min="0.05"
                max="0.95"
                step="0.05"
                value={precision}
                onChange={(e) => handleChange('precision', parseFloat(e.target.value))}
              />
              <span className="setting-value">{pxVal}px</span>
              <button className="auto-btn" onClick={onAutoThreshold}>auto</button>
            </div>
          </div>

          {/* Scale */}
          <div className="sheet-row">
            <div className="sheet-row-label">Scale</div>
            <div className="sheet-row-control">
              <input
                id="scale-m"
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={settings.scale}
                onChange={(e) => handleChange('scale', parseFloat(e.target.value))}
              />
              <span className="setting-value">{(settings.scale * 100).toFixed(0)}%</span>
            </div>
          </div>

          {/* Size */}
          <div className="sheet-row">
            <div className="sheet-row-label">Size</div>
            <div className="sheet-row-control">
              <input
                id="fontSize-m"
                type="range"
                min="8"
                max="24"
                step="1"
                value={settings.fontSize}
                onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
              />
              <span className="setting-value">{settings.fontSize}px</span>
            </div>
          </div>

          {/* Toggles */}
          <div className="sheet-toggles">
            <div className="sheet-toggle-row">
              <span className="sheet-toggle-label">Invert</span>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.invert}
                  onChange={(e) => handleChange('invert', e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
            <div className="sheet-toggle-row">
              <span className="sheet-toggle-label">Crop</span>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.crop}
                  onChange={(e) => handleChange('crop', e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>

          {/* Style trigger */}
          <div className="sheet-row">
            <div className="sheet-row-label">Style</div>
            <div className="sheet-row-control">
              <button className="style-trigger" onClick={() => setModalOpen(true)}>
                {currentLabel}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="sheet-actions">
            <button className="copy-btn" onClick={() => { onCopy && onCopy('mono'); setSheetOpen(false); }}>[ copy ]</button>
            <button className="copy-btn" onClick={() => { onCopy && onCopy('sans'); setSheetOpen(false); }}>[ copy sans ]</button>
            <button className="copy-btn" onClick={() => { onSavePng && onSavePng(); setSheetOpen(false); }}>[ save png ]</button>
          </div>
        </div>
      </div>

      {/* Style modal (same as desktop) */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-box" ref={modalRef} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">select style</div>
            {STYLES.map((s) => (
              <div
                key={s.key}
                className={`modal-option${settings.style === s.key ? ' selected' : ''}`}
                onClick={() => selectStyle(s.key)}
              >
                <span className="modal-option-name">{s.label}</span>
                <span className="modal-option-desc">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
