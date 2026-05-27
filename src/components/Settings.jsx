import { useState, useEffect, useRef } from 'react';

const STYLES = [
  { key: 'basic', label: 'Basic', desc: 'hard threshold' },
  { key: 'outline', label: 'Outline Contrast', desc: 'edges only' },
  { key: 'simplified', label: 'Simplified', desc: 'floyd-steinberg' },
  { key: 'nodithering', label: 'No Dithering', desc: 'nearest neighbor' },
];

export default function Settings({ settings, onChange, onAutoThreshold, onCopy, onSavePng }) {
  const [modalOpen, setModalOpen] = useState(false);
  const modalRef = useRef(null);

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

  const precision = settings.precision;
  const pxVal = Math.round((1 - precision) * 255);

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

        <button className="auto-btn mobile-auto" onClick={onAutoThreshold}>auto</button>

        <div className="setting-group">
          <span className="dimensions-label">
            {settings.dimensions
              ? `${settings.dimensions.cols}×${settings.dimensions.rows}`
              : '—×—'}
          </span>
        </div>

        <div className="mobile-actions">
          <button className="copy-btn" onClick={() => onCopy && onCopy('mono')}>[ copy ]</button>
          <button className="copy-btn save-png-btn" onClick={onSavePng}>[ save png ]</button>
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
