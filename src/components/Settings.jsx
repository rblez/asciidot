import { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

const STYLES = [
  { key: 'basic', label: 'Basic', desc: 'hard threshold' },
  { key: 'outline', label: 'Outline Contrast', desc: 'edges only' },
  { key: 'simplified', label: 'Simplified', desc: 'floyd-steinberg' },
  { key: 'nodithering', label: 'No Dithering', desc: 'nearest neighbor' },
];

export default function Settings({ settings, onChange, onAutoThreshold }) {
  const [modalOpen, setModalOpen] = useState(false);

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
      <div className="controls-strip">
        <div className="control-group">
          <span className="control-label">Precision</span>
          <div className="slider-wrap">
            <input
              type="range"
              min="0.05"
              max="0.95"
              step="0.05"
              value={precision}
              onChange={(e) => handleChange('precision', parseFloat(e.target.value))}
            />
            <span className="control-value">{pxVal}px</span>
          </div>
          <button className="auto-btn" onClick={onAutoThreshold} title="auto threshold (Otsu)">auto</button>
        </div>

        <div className="control-group">
          <span className="control-label">Scale</span>
          <div className="slider-wrap">
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={settings.scale}
              onChange={(e) => handleChange('scale', parseFloat(e.target.value))}
            />
            <span className="control-value">{(settings.scale * 100).toFixed(0)}%</span>
          </div>
        </div>

        <div className="control-group">
          <div
            className={`toggle${settings.invert ? ' active' : ''}`}
            onClick={() => handleChange('invert', !settings.invert)}
          >
            <div className="toggle-track">
              <div className="toggle-knob" />
            </div>
            Invert
          </div>
        </div>

        <div className="control-group">
          <div
            className={`toggle${settings.crop ? ' active' : ''}`}
            onClick={() => handleChange('crop', !settings.crop)}
          >
            <div className="toggle-track">
              <div className="toggle-knob" />
            </div>
            Crop
          </div>
        </div>

        <div className="control-group">
          <span className="control-label">Size</span>
          <div className="slider-wrap">
            <input
              type="range"
              min="8"
              max="24"
              step="1"
              value={settings.fontSize}
              onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
            />
            <span className="control-value">{settings.fontSize}px</span>
          </div>
        </div>

        <div className="control-group">
          <button className="styles-trigger-btn" onClick={() => setModalOpen(true)}>
            styles
            <ChevronDownIcon className={`chevron${modalOpen ? ' open' : ''}`} />
          </button>
        </div>

        <div className="control-group">
          <span className="control-label output-dims">
            {settings.dimensions
              ? `${settings.dimensions.cols}×${settings.dimensions.rows}`
              : '—×—'}
          </span>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">select style</div>
            <div className="modal-options">
              {STYLES.map((s) => (
                <button
                  key={s.key}
                  className={`modal-option${settings.style === s.key ? ' selected' : ''}`}
                  onClick={() => selectStyle(s.key)}
                >
                  <div className="modal-radio">
                    {settings.style === s.key && <div className="modal-radio-inner" />}
                  </div>
                  <span>{s.label}</span>
                  <span className="modal-option-label">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
