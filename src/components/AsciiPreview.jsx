import { useRef, useState, useCallback, useEffect } from 'react';
import { ClipboardDocumentIcon, ArrowDownTrayIcon, ShareIcon } from '@heroicons/react/20/solid';
import { copyText, downloadBlob } from '../utils/clipboard';

const BG = '#14120b';
const FG = '#f7f7f4';

function drawAscii(canvas, ascii, cols, rows, fontSize, scale = 1) {
  const cellW = fontSize * 0.5 * scale;
  const cellH = fontSize * scale;
  canvas.width = Math.max(1, Math.round(cols * cellW));
  canvas.height = Math.max(1, Math.round(rows * cellH));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = FG;
  ctx.font = `${fontSize * scale}px monospace`;
  ctx.textBaseline = 'top';
  const lines = ascii.split('\n');
  for (let row = 0; row < lines.length; row++) {
    const line = lines[row];
    for (let col = 0; col < line.length; col++) {
      ctx.fillText(line[col], col * cellW, row * cellH);
    }
  }
}

const toSans = (text) => text.split('\n').map((l) => l.split('').join('\u200B')).join('\n');

const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

export default function AsciiPreview({ ascii, dimensions, fontSize = 14, history, onHistorySelect, onCopy, onStatus }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const urlRef = useRef(null);
  const thumbRefs = useRef([]);
  const dialogRef = useRef(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportMode, setExportMode] = useState('mono');
  const [exportDest, setExportDest] = useState('clipboard');

  // Render to a detached canvas and show it as an <img>: the browser then
  // gives native long-press "save image" on phones and drag-out on desktop.
  useEffect(() => {
    if (!ascii || !dimensions) return;
    if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
    const canvas = canvasRef.current;
    drawAscii(canvas, ascii, dimensions.cols, dimensions.rows, fontSize);
    let cancelled = false;
    canvas.toBlob((blob) => {
      if (cancelled || !blob || !imgRef.current) return;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(blob);
      imgRef.current.src = urlRef.current;
      imgRef.current.width = canvas.width;
      imgRef.current.height = canvas.height;
    }, 'image/png');
    return () => { cancelled = true; };
  }, [ascii, dimensions, fontSize]);

  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  useEffect(() => {
    history.forEach((entry, idx) => {
      const canvas = thumbRefs.current[idx];
      if (!canvas || !entry.ascii || !entry.dimensions) return;
      const { cols, rows } = entry.dimensions;
      const scale = 64 / (cols * fontSize * 0.5);
      if (rows * fontSize * scale < 1) return;
      drawAscii(canvas, entry.ascii, cols, rows, fontSize, scale);
    });
  }, [history, fontSize]);

  const getPngBlob = useCallback(() => new Promise((resolve) => {
    const canvas = canvasRef.current;
    if (!canvas) return resolve(null);
    canvas.toBlob(resolve, 'image/png');
  }), []);

  const handleSavePng = useCallback(async () => {
    const blob = await getPngBlob();
    if (!blob) return;
    downloadBlob(blob, 'asciidot-output.png');
    onStatus?.('png saved');
  }, [getPngBlob, onStatus]);

  const handleSharePng = useCallback(async () => {
    const blob = await getPngBlob();
    if (!blob) return;
    const file = new File([blob], 'asciidot-output.png', { type: 'image/png' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'asciidot' });
      } else {
        await navigator.share({ text: ascii, title: 'asciidot' });
      }
    } catch {
      // user cancelled the share sheet
    }
  }, [getPngBlob, ascii]);

  const handleExport = useCallback(async () => {
    const text = exportMode === 'sans' ? toSans(ascii) : ascii;
    if (!text) return;
    if (exportDest === 'file') {
      downloadBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }),
        exportMode === 'sans' ? 'asciidot-sans.txt' : 'asciidot-mono.txt');
      onStatus?.('txt saved');
    } else if (exportDest === 'share') {
      try { await navigator.share({ text }); } catch { /* cancelled */ }
    } else {
      const ok = await copyText(text);
      onStatus?.(ok ? `copied ${exportMode}` : 'copy failed');
    }
    setExportOpen(false);
  }, [ascii, exportMode, exportDest, onStatus]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (exportOpen && !d.open) d.showModal();
    if (!exportOpen && d.open) d.close();
  }, [exportOpen]);

  if (!ascii) {
    return (
      <div className="output-panel">
        <div className="output-screen output-empty">
          <span className="empty-dots" aria-hidden="true">⠁⠃⠇⡇⣇⣧⣷⣿</span>
          <span>output appears here</span>
        </div>
      </div>
    );
  }

  const destinations = [
    { key: 'clipboard', label: 'clipboard' },
    { key: 'file', label: '.txt file' },
    ...(canShare ? [{ key: 'share', label: 'share' }] : []),
  ];

  return (
    <div className="output-panel">
      <div className="output-toolbar">
        <span className="output-dims">{dimensions ? `${dimensions.cols}×${dimensions.rows}` : ''}</span>
        <div className="output-actions">
          <button type="button" className="btn btn-primary" onClick={() => setExportOpen(true)}>
            <ClipboardDocumentIcon className="btn-icon" aria-hidden="true" />
            copy
          </button>
          <button type="button" className="btn" onClick={handleSavePng}>
            <ArrowDownTrayIcon className="btn-icon" aria-hidden="true" />
            png
          </button>
          {canShare && (
            <button type="button" className="btn btn-share" onClick={handleSharePng} aria-label="share png">
              <ShareIcon className="btn-icon" aria-hidden="true" />
              <span className="btn-share-label">share</span>
            </button>
          )}
        </div>
      </div>

      <div className="output-screen">
        <img
          ref={imgRef}
          className="ascii-image"
          alt="braille dot art output"
          title="drag or long-press to save"
          onDoubleClick={() => onCopy('mono')}
        />
      </div>

      {history.length > 1 && (
        <div className="history-strip" aria-label="recent outputs">
          {history.map((entry, idx) => (
            <button
              key={idx}
              type="button"
              className={`history-thumb${entry.ascii === ascii ? ' current' : ''}`}
              onClick={() => onHistorySelect(entry)}
              aria-label={`restore output ${idx + 1}`}
            >
              <canvas ref={(el) => { thumbRefs.current[idx] = el; }} />
            </button>
          ))}
        </div>
      )}

      <dialog
        ref={dialogRef}
        className="dialog"
        onClose={() => setExportOpen(false)}
        onClick={(e) => { if (e.target === dialogRef.current) setExportOpen(false); }}
      >
        <div className="dialog-inner">
          <div className="dialog-title">export</div>

          <div className="dialog-sub">style</div>
          <div className="choice-list" role="radiogroup" aria-label="style">
            {['mono', 'sans'].map((mode) => (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={exportMode === mode}
                className={`choice${exportMode === mode ? ' selected' : ''}`}
                onClick={() => setExportMode(mode)}
              >
                <span className="style-mark" aria-hidden="true">{exportMode === mode ? '⣿' : '⠀'}</span>
                <span>{mode}</span>
                <span className="choice-desc">{mode === 'mono' ? 'default' : 'zero-width spaces'}</span>
              </button>
            ))}
          </div>

          <div className="dialog-sub">destination</div>
          <div className="seg" role="radiogroup" aria-label="destination">
            {destinations.map((d) => (
              <button
                key={d.key}
                type="button"
                role="radio"
                aria-checked={exportDest === d.key}
                className={`seg-item${exportDest === d.key ? ' selected' : ''}`}
                onClick={() => setExportDest(d.key)}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="dialog-actions">
            <button type="button" className="btn" onClick={() => setExportOpen(false)}>cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleExport}>
              {exportDest === 'clipboard' ? 'copy' : exportDest === 'file' ? 'download' : 'share'}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
