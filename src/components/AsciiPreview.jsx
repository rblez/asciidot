import { useRef, useState, useCallback, useEffect } from 'react';

export default function AsciiPreview({ ascii, dimensions }) {
  const canvasRef = useRef(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportMode, setExportMode] = useState('mono');
  const [exportDest, setExportDest] = useState('clipboard');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ascii || !dimensions) return;

    const { dispW, dispH } = dimensions;
    canvas.width = dispW;
    canvas.height = dispH;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = `16px monospace`;
    ctx.textBaseline = 'top';

    const lines = ascii.split('\n');
    for (let row = 0; row < lines.length; row++) {
      const line = lines[row];
      for (let col = 0; col < line.length; col++) {
        ctx.fillText(line[col], col * 8, row * 16);
      }
    }
  }, [ascii, dimensions]);

  const getExportText = useCallback((mode) => {
    if (!ascii) return '';
    if (mode === 'sans') {
      return ascii.split('\n').map(l => l.split('').join('\u200B')).join('\n');
    }
    return ascii;
  }, [ascii]);

  const handleExport = useCallback(async () => {
    const text = getExportText(exportMode);
    if (!text) return;

    if (exportDest === 'file') {
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportMode === 'sans' ? 'asciidot-sans.txt' : 'asciidot-mono.txt';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      try {
        await navigator.clipboard.writeText(text);
      } catch {}
    }
    setExportOpen(false);
  }, [exportMode, exportDest, getExportText]);

  useEffect(() => {
    if (!exportOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setExportOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [exportOpen]);

  if (!ascii) {
    return (
      <div className="ascii-preview empty">
        <p className="placeholder-text">output appears here</p>
      </div>
    );
  }

  return (
    <>
      <div className="ascii-preview has-output">
        <div className="output-toolbar">
          {dimensions && (
            <span className="output-dims">{dimensions.cols}×{dimensions.rows}</span>
          )}
          <button className="copy-btn" onClick={() => setExportOpen(true)}>
            [ copy ]
          </button>
        </div>
        <canvas ref={canvasRef} className="ascii-canvas" />
      </div>

      {exportOpen && (
        <div className="modal-backdrop" onClick={() => setExportOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">export</div>

            <div className="modal-section-label">style</div>
            <div className="export-pills" role="radiogroup">
              {['mono', 'sans'].map((mode) => (
                <button
                  key={mode}
                  className={`export-pill${exportMode === mode ? ' active' : ''}`}
                  onClick={() => setExportMode(mode)}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="modal-section-label">destination</div>
            <div className="export-pills" role="radiogroup">
              {[
                { key: 'clipboard', label: 'clipboard' },
                { key: 'file', label: '.txt file' },
              ].map((d) => (
                <button
                  key={d.key}
                  className={`export-pill${exportDest === d.key ? ' active' : ''}`}
                  onClick={() => setExportDest(d.key)}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <button className="export-btn" onClick={handleExport}>
              {exportDest === 'clipboard' ? 'copy →' : 'download →'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
