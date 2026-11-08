import { useState, useCallback, useEffect, useRef, useSyncExternalStore } from 'react'
import ImageUploader from './components/ImageUploader'
import AsciiPreview from './components/AsciiPreview'
import Settings from './components/Settings'
import { STYLES } from './utils/styles'
import Corners from './components/Corners'
import { imageToAscii, calculateBrailleGrid, cropWhitespace, otsuThreshold } from './utils/imageToAscii'
import { copyText } from './utils/clipboard'
import './App.css'

const DEFAULT_SETTINGS = {
  style: 'nodithering',
  precision: 0.5,
  scale: 0.5,
  invert: false,
  fontSize: 14,
  crop: false,
}

const MOBILE_QUERY = '(max-width: 639.98px)'

function subscribeMobile(cb) {
  const mq = window.matchMedia(MOBILE_QUERY)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}
const getMobile = () => window.matchMedia(MOBILE_QUERY).matches
const getMobileServer = () => false

function GitHubIcon() {
  return (
    <svg role="img" aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg role="img" aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
    </svg>
  )
}

function TelegramIcon() {
  return (
    <svg role="img" aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  )
}

function sampleImage(img, scale) {
  const charCols = Math.max(4, Math.round(80 * scale))
  const grid = calculateBrailleGrid(img.naturalWidth, img.naturalHeight, charCols)
  const canvas = document.createElement('canvas')
  canvas.width = grid.srcW
  canvas.height = grid.srcH
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(img, 0, 0, grid.srcW, grid.srcH)
  return { grid, imageData: ctx.getImageData(0, 0, grid.srcW, grid.srcH) }
}

function convert(img, s) {
  const { grid, imageData } = sampleImage(img, s.scale)
  let ascii = imageToAscii(imageData, s)
  let dimensions = grid
  if (s.crop) {
    const cropped = cropWhitespace(ascii, grid.cols)
    ascii = cropped.ascii
    dimensions = { ...grid, cols: cropped.cols, rows: cropped.rows }
  }
  return { ascii, dimensions }
}

function App() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [image, setImage] = useState(null)
  const [result, setResult] = useState({ ascii: '', dimensions: null })
  const [history, setHistory] = useState([])
  const [status, setStatus] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const isMobile = useSyncExternalStore(subscribeMobile, getMobile, getMobileServer)
  const statusTimer = useRef(null)
  const lastPush = useRef(0)

  const flash = useCallback((msg) => {
    setStatus(msg)
    if (statusTimer.current) clearTimeout(statusTimer.current)
    statusTimer.current = setTimeout(() => setStatus(''), 1600)
  }, [])

  useEffect(() => () => { if (statusTimer.current) clearTimeout(statusTimer.current) }, [])

  // Run the conversion from event handlers (not effects) and keep a short
  // history. Rapid changes (slider drags) replace the newest entry instead
  // of flooding the strip.
  const run = useCallback((img, s, { fresh = false } = {}) => {
    if (!img) return
    const next = convert(img, s)
    setResult(next)
    const now = Date.now()
    const merge = !fresh && now - lastPush.current < 700
    lastPush.current = now
    setHistory((prev) => {
      const list = fresh ? [] : prev
      const rest = merge ? list.slice(1) : list
      return [next, ...rest].slice(0, 5)
    })
  }, [])

  const handleImageLoad = useCallback((img) => {
    setImage(img)
    lastPush.current = 0
    run(img, settings, { fresh: true })
  }, [run, settings])

  const handleClear = useCallback(() => {
    setImage(null)
    setResult({ ascii: '', dimensions: null })
    setHistory([])
  }, [])

  const handleSettingsChange = useCallback((updated) => {
    setSettings(updated)
    run(image, updated)
  }, [image, run])

  const handleAutoThreshold = useCallback(() => {
    if (!image) return
    const { imageData } = sampleImage(image, settings.scale)
    const { width, height, data } = imageData
    const gray = new Uint8Array(width * height)
    for (let i = 0; i < width * height; i++) {
      const idx = i * 4
      gray[i] = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2])
    }
    const threshold = otsuThreshold(gray)
    const precision = 1 - threshold / 255
    const updated = { ...settings, precision: Math.max(0.05, Math.min(0.95, parseFloat(precision.toFixed(2)))) }
    setSettings(updated)
    run(image, updated)
  }, [image, settings, run])

  const handleHistorySelect = useCallback((entry) => {
    setResult(entry)
  }, [])

  const handleCopy = useCallback(async (mode) => {
    if (!result.ascii) return
    const text = mode === 'sans'
      ? result.ascii.split('\n').map((l) => l.split('').join('\u200B')).join('\n')
      : result.ascii
    const ok = await copyText(text)
    flash(ok ? `copied ${mode}` : 'copy failed')
  }, [result.ascii, flash])

  useEffect(() => {
    const handleKey = (e) => {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'c' || e.key === 'C') handleCopy(e.shiftKey ? 'sans' : 'mono')
      if (e.key === 'Escape') setSheetOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [handleCopy])

  const sheetClosed = isMobile && !sheetOpen
  const styleLabel = STYLES.find((s) => s.key === settings.style)?.label ?? ''
  const dims = result.dimensions

  return (
    <div className={`app${sheetOpen && isMobile ? ' sheet-open' : ''}`}>
      <header className="app-header">
        <div className="brand">
          <h1>ASCIIdot</h1>
          <span className="brand-sub">dot art converter</span>
        </div>
        <dl className="meta">
          <div><dt>cell</dt><dd>braille 2×4</dd></div>
          <div><dt>runs</dt><dd>in your browser</dd></div>
        </dl>
        <nav className="links" aria-label="links">
          <a href="https://github.com/rblez" target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label="GitHub">
            <GitHubIcon />
          </a>
          <a href="https://x.com/rblez_" target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label="X">
            <XIcon />
          </a>
          <a href="https://t.me/rblez" target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label="Telegram">
            <TelegramIcon />
          </a>
        </nav>
      </header>

      <main className="grid">
        <section className="cell cell-input" aria-labelledby="lbl-input">
          <Corners />
          <h2 className="cell-label" id="lbl-input"><span>01</span> input</h2>
          <ImageUploader onImageLoad={handleImageLoad} onClear={handleClear} />
          <p className="tip">
            best results with high contrast images — black &amp; white, monochrome, bold two-tone colors, or svg
          </p>
        </section>

        <section className="cell cell-output" aria-labelledby="lbl-output">
          <Corners />
          <h2 className="cell-label" id="lbl-output"><span>02</span> output</h2>
          <AsciiPreview
            ascii={result.ascii}
            dimensions={dims}
            fontSize={settings.fontSize}
            history={history}
            onHistorySelect={handleHistorySelect}
            onCopy={handleCopy}
            onStatus={flash}
          />
        </section>

        {isMobile && sheetOpen && (
          <div className="scrim" onClick={() => setSheetOpen(false)} aria-hidden="true" />
        )}

        <section className={`cell cell-controls${sheetOpen ? ' open' : ''}`} aria-labelledby="lbl-controls">
          <Corners />
          <button
            type="button"
            className="sheet-handle"
            aria-expanded={sheetOpen}
            aria-controls="controls-body"
            onClick={() => setSheetOpen((o) => !o)}
          >
            <span className="sheet-grip" aria-hidden="true" />
            <span className="sheet-title"><span>03</span> controls</span>
            <span className="sheet-summary">
              {styleLabel.toLowerCase()}{dims ? ` · ${dims.cols}×${dims.rows}` : ''}
            </span>
            <span className="sheet-chevron" aria-hidden="true">{sheetOpen ? '▾' : '▴'}</span>
          </button>
          <h2 className="cell-label cell-label-controls" id="lbl-controls"><span>03</span> controls</h2>
          <div className="controls-body" id="controls-body" inert={sheetClosed}>
            <Settings
              settings={settings}
              dimensions={dims}
              hasImage={!!image}
              onChange={handleSettingsChange}
              onAutoThreshold={handleAutoThreshold}
            />
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <span>asciidot · open source</span>
        <span className="kbd-hint">press <kbd>c</kbd> to copy · <kbd>shift</kbd>+<kbd>c</kbd> sans</span>
        <a href="https://github.com/rblez/asciidot" target="_blank" rel="noopener noreferrer">github.com/rblez/asciidot</a>
      </footer>

      <div className={`toast${status ? ' show' : ''}`} role="status" aria-live="polite">{status}</div>
    </div>
  )
}

export default App
