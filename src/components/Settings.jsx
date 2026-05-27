export default function Settings({ settings, onChange }) {
  const handleChange = (key, value) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="settings">
      <div className="setting-group">
        <label htmlFor="charSet">Characters</label>
        <select
          id="charSet"
          value={settings.charSet}
          onChange={(e) => handleChange('charSet', e.target.value)}
        >
          <option value="braille">Braille (dots)</option>
          <option value="block">Block</option>
          <option value="ascii">ASCII</option>
        </select>
      </div>

      <div className="setting-group">
        <label htmlFor="precision">
          Precision: {(settings.precision * 100).toFixed(0)}%
        </label>
        <input
          id="precision"
          type="range"
          min="0.05"
          max="0.95"
          step="0.05"
          value={settings.precision}
          onChange={(e) => handleChange('precision', parseFloat(e.target.value))}
        />
      </div>

      <div className="setting-group">
        <label htmlFor="scale">
          Scale: {(settings.scale * 100).toFixed(0)}%
        </label>
        <input
          id="scale"
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={settings.scale}
          onChange={(e) => handleChange('scale', parseFloat(e.target.value))}
        />
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

      <div className="setting-group info">
        <span className="dimensions-label">
          {settings.dimensions
            ? `${settings.dimensions.cols}×${settings.dimensions.rows}`
            : '—×—'}
        </span>
      </div>
    </div>
  );
}
