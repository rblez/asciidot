import { STYLES } from '../utils/styles';

function Slider({ id, label, min, max, step, value, display, onChange, children }) {
  return (
    <div className="control">
      <div className="control-head">
        <label className="control-label" htmlFor={id}>{label}</label>
        <output className="control-value" htmlFor={id}>{display}</output>
      </div>
      <div className="control-row">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{ '--fill': `${((value - min) / (max - min)) * 100}%` }}
        />
        {children}
      </div>
    </div>
  );
}

function Switch({ label, checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`switch${checked ? ' on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="switch-box" aria-hidden="true"><span className="switch-dot" /></span>
      <span>{label}</span>
      <span className="switch-state" aria-hidden="true">{checked ? 'on' : 'off'}</span>
    </button>
  );
}

export default function Settings({ settings, dimensions, hasImage, onChange, onAutoThreshold }) {
  const set = (key, value) => onChange({ ...settings, [key]: value });
  const pxVal = Math.round((1 - settings.precision) * 255);

  return (
    <div className="settings">
      <Slider
        id="ctl-precision"
        label="Precision"
        min={0.05}
        max={0.95}
        step={0.05}
        value={settings.precision}
        display={`${pxVal}px`}
        onChange={(v) => set('precision', v)}
      >
        <button
          type="button"
          className="btn btn-small"
          onClick={onAutoThreshold}
          disabled={!hasImage}
          title="auto threshold (Otsu)"
        >
          auto
        </button>
      </Slider>

      <Slider
        id="ctl-scale"
        label="Scale"
        min={0.1}
        max={1}
        step={0.05}
        value={settings.scale}
        display={`${(settings.scale * 100).toFixed(0)}%`}
        onChange={(v) => set('scale', v)}
      />

      <Slider
        id="ctl-size"
        label="Size"
        min={8}
        max={24}
        step={1}
        value={settings.fontSize}
        display={`${settings.fontSize}px`}
        onChange={(v) => set('fontSize', Math.round(v))}
      />

      <div className="switches">
        <Switch label="Invert" checked={settings.invert} onChange={(v) => set('invert', v)} />
        <Switch label="Crop" checked={settings.crop} onChange={(v) => set('crop', v)} />
      </div>

      <fieldset className="styles">
        <legend className="control-label">Styles</legend>
        <div className="style-list" role="radiogroup" aria-label="styles">
          {STYLES.map((s) => (
            <button
              key={s.key}
              type="button"
              role="radio"
              aria-checked={settings.style === s.key}
              className={`style-option${settings.style === s.key ? ' selected' : ''}`}
              onClick={() => set('style', s.key)}
            >
              <span className="style-mark" aria-hidden="true">{settings.style === s.key ? '⣿' : '⠀'}</span>
              <span className="style-name">{s.label}</span>
              <span className="style-desc">{s.desc}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="settings-foot">
        <span className="control-label">grid</span>
        <span className="control-value">{dimensions ? `${dimensions.cols}×${dimensions.rows}` : '—'}</span>
      </div>
    </div>
  );
}
