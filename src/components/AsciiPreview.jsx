import { useRef, useState, useCallback, useEffect } from 'react';

export default function AsciiPreview({ ascii, dimensions, fontSize = 14, history, onHistorySelect, onCopy, copiedStyle }) {
  const canvasRef = useRef(null);
  const thumbRefs = useRef([]);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportMode, setExportMode] = useState('mono');
  const [exportDest, setExportDest] = useState('clipboard');

  const cellW = fontSize * 0.5;
  const cellH = fontSize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ascii || !dimensions) return;

    const { cols, rows } = dimensions;
    const w = Math.round(cols * cellW);
    const h = Math.round(rows * cellH);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = 'top';

    const lines = ascii.split('\n');
    for (let row = 0; row < lines.length; row++) {
      const line = lines[row];
      for (let col = 0; col < line.length; col++) {
        ctx.fillText(line[col], col * cellW, row * cellH);
      }
    }
  }, [ascii, dimensions, fontSize, cellW, cellH]);

  // Render thumbnails
  useEffect(() => {
    history.forEach((entry, idx) => {
      const canvas = thumbRefs.current[idx];
      if (!canvas || !entry.ascii) return;
      const { cols, rows } = entry.dimensions;
      const thumbW = 60;
      const scale = thumbW / (cols * cellW);
      const thumbH = Math.round(rows * cellH * scale);
      if (thumbH < 1) return;
      canvas.width = thumbW;
      canvas.height = thumbH;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, thumbW, thumbH);
      ctx.fillStyle = '#ffffff';
      ctx.font = `${Math.round(fontSize * scale)}px monospace`;
      ctx.textBaseline = 'top';
      const lines = entry.ascii.split('\n');
      for (let row = 0; row < lines.length; row++) {
        const line = lines[row];
        for (let col = 0; col < line.length; col++) {
          ctx.fillText(line[col], col * cellW * scale, row * cellH * scale);
        }
      }
    });
  }, [history, fontSize, cellW, cellH]);

  const handleSavePng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'asciidot-output.png';
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }, []);

  const handleDragStart = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      e.dataTransfer.setData('image/png', blob);
      e.dataTransfer.effectAllowed = 'copy';
    }, 'image/png');
  }, []);

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
        {history.length > 0 && (
          <div className="history-strip">
            {history.map((entry, idx) => (
              <button
                key={idx}
                className="history-thumb"
                onClick={() => onHistorySelect(entry)}
                title="restore output"
              >
                <canvas
                  ref={(el) => { thumbRefs.current[idx] = el; }}
                  className="history-canvas"
                />
              </button>
            ))}
          </div>
        )}
        <div className="output-toolbar">
          {dimensions && (
            <span className="output-dims">{dimensions.cols}×{dimensions.rows}</span>
          )}
          <button className={`copy-btn${copiedStyle ? ' flash' : ''}`} onClick={() => setExportOpen(true)}>
            [ copy ]
          </button>
          <button className="copy-btn save-png-btn" onClick={handleSavePng}>
            [ save png ]
          </button>
        </div>
        <canvas
          ref={canvasRef}
          className="ascii-canvas"
          draggable="true"
          onDragStart={handleDragStart}
        />
        <span className="drag-hint">drag to save</span>
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
