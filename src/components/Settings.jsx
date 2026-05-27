import { useState, useEffect, useRef } from 'react';

const STYLES = [
  { key: 'basic', label: 'Basic', desc: 'hard threshold' },
  { key: 'outline', label: 'Outline Contrast', desc: 'edges only' },
  { key: 'simplified', label: 'Simplified', desc: 'floyd-steinberg' },
  { key: 'nodithering', label: 'No Dithering', desc: 'nearest neighbor' },
];

export default function Settings({ settings, onChange, onAutoThreshold, onCopy, onSavePng }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isTouch, setIsTouch] = useState(false);
  const [isLandscape, setIsLandscape] = useState(true);
  const modalRef = useRef(null);

  useEffect(() => {
    const touchMq = window.matchMedia('(pointer: coarse)');
    setIsTouch(touchMq.matches);
    const touchHandler = (e) => setIsTouch(e.matches);
    touchMq.addEventListener('change', touchHandler);

    const orientMq = window.matchMedia('(orientation: landscape)');
    setIsLandscape(orientMq.matches);
    const orientHandler = (e) => setIsLandscape(e.matches);
    orientMq.addEventListener('change', orientHandler);

    return () => {
      touchMq.removeEventListener('change', touchHandler);
      orientMq.removeEventListener('change', orientHandler);
    };
  }, []);

  const isMobileLandscape = isTouch && isLandscape;
  const isMobilePortrait = isTouch && !isLandscape;

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

  const controls = (
    <div className="sidebar-controls">
      <div className="sidebar-section">
        <div className="sidebar-row">
          <span className="sidebar-label">Precision</span>
          <div className="sidebar-slider-row">
            <input
              id="precision-s"
              type="range"
              min="0.05"
              max="0.95"
              step="0.05"
              value={precision}
              onChange={(e) => handleChange('precision', parseFloat(e.target.value))}
            />
            <span className="sidebar-value">{pxVal}px</span>
            <button className="auto-btn" onClick={onAutoThreshold}>auto</button>
          </div>
        </div>

        <div className="sidebar-row">
          <span className="sidebar-label">Scale</span>
          <div className="sidebar-slider-row">
            <input
              id="scale-s"
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={settings.scale}
              onChange={(e) => handleChange('scale', parseFloat(e.target.value))}
            />
            <span className="sidebar-value">{(settings.scale * 100).toFixed(0)}%</span>
          </div>
        </div>

        <div className="sidebar-row">
          <span className="sidebar-label">Size</span>
          <div className="sidebar-slider-row">
            <input
              id="fontSize-s"
              type="range"
              min="8"
              max="24"
              step="1"
              value={settings.fontSize}
              onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
            />
            <span className="sidebar-value">{settings.fontSize}px</span>
          </div>
        </div>
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <div className="sidebar-toggle-row">
          <span className="sidebar-label">Invert</span>
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.invert}
              onChange={(e) => handleChange('invert', e.target.checked)}
            />
            <span className="toggle-slider" />
          </label>
        </div>
        <div className="sidebar-toggle-row">
          <span className="sidebar-label">Crop</span>
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

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <button className="sidebar-style-btn" onClick={() => setModalOpen(true)}>
          {currentLabel} ▸
        </button>
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <div className="sidebar-actions">
          <button className="sidebar-action-btn" onClick={() => onCopy && onCopy('mono')}>copy</button>
          <button className="sidebar-action-btn" onClick={() => onCopy && onCopy('sans')}>sans</button>
          <button className="sidebar-action-btn" onClick={() => onSavePng && onSavePng()}>png</button>
        </div>
      </div>

      {settings.dimensions && (
        <div className="sidebar-dims">
          {settings.dimensions.cols}×{settings.dimensions.rows}
        </div>
      )}
    </div>
  );

  // Portrait overlay
  if (isMobilePortrait) {
    return (
      <div className="rotate-overlay">
        <div className="rotate-icon">↻</div>
        <p className="rotate-text">rotate to landscape</p>
      </div>
    );
  }

  // Desktop: flat bar
  if (!isTouch) {
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

  // Mobile landscape: sidebar
  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-title">settings</span>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)}>
            {sidebarOpen ? '▸' : '◂'}
          </button>
        </div>
        {sidebarOpen && controls}
      </aside>

      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
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
