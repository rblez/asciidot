import { useState, useCallback, useEffect, useRef } from 'react'
import { ArrowUpTrayIcon } from '@heroicons/react/20/solid'
import ImageUploader from './components/ImageUploader'
import AsciiPreview from './components/AsciiPreview'
import Settings from './components/Settings'
import { imageToAscii, calculateBrailleGrid, cropWhitespace, otsuThreshold } from './utils/imageToAscii'
import './App.css'

const DEFAULT_SETTINGS = {
  style: 'nodithering',
  precision: 0.5,
  scale: 0.5,
  invert: false,
  fontSize: 14,
  crop: false,
}

function GitHubIcon() {
  return (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
    </svg>
  )
}

function TelegramIcon() {
  return (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  )
}

function App() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [image, setImage] = useState(null)
  const [ascii, setAscii] = useState('')
  const [dimensions, setDimensions] = useState(null)
  const [history, setHistory] = useState([])
  const [copiedStyle, setCopiedStyle] = useState(null)
  const [isDesktop, setIsDesktop] = useState(true)
  const copyTimer = useRef(null)

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)')
    setIsDesktop(mq.matches)
    const handler = (e) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  if (!isDesktop) {
    return (
      <div className="desktop-only">
        <div className="desktop-only-icon">🖥</div>
        <p className="desktop-only-text">desktop only</p>
      </div>
    )
  }

  const handleImageLoad = useCallback((img) => {
    setImage(img)
  }, [])

  const processImage = useCallback((img, currentSettings) => {
    const charCols = Math.max(4, Math.round(80 * currentSettings.scale))
    const grid = calculateBrailleGrid(img.naturalWidth, img.naturalHeight, charCols)
    setDimensions(grid)

    const canvas = new OffscreenCanvas(grid.srcW, grid.srcH)
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(img, 0, 0, grid.srcW, grid.srcH)
    const imageData = ctx.getImageData(0, 0, grid.srcW, grid.srcH)

    let result = imageToAscii(imageData, currentSettings)

    if (currentSettings.crop) {
      const cropped = cropWhitespace(result, grid.cols)
      result = cropped.ascii
      setDimensions({ ...grid, cols: cropped.cols, rows: cropped.rows })
    }

    setAscii(result)
    setHistory(prev => {
      const dims = currentSettings.crop
        ? { cols: grid.cols, rows: grid.rows, srcW: grid.srcW, srcH: grid.srcH, dispW: grid.dispW, dispH: grid.dispH }
        : grid
      const entry = { ascii: result, dimensions: dims }
      const next = [entry, ...prev].slice(0, 5)
      return next
    })
  }, [])

  useEffect(() => {
    if (!image) {
      setAscii('')
      setDimensions(null)
      setHistory([])
      return
    }
    processImage(image, settings)
  }, [image, settings, processImage])

  const handleSettingsChange = useCallback((updated) => {
    setSettings(updated)
    if (image) processImage(image, updated)
  }, [image, processImage])

  const handleAutoThreshold = useCallback(() => {
    if (!image) return
    const charCols = Math.max(4, Math.round(80 * settings.scale))
    const grid = calculateBrailleGrid(image.naturalWidth, image.naturalHeight, charCols)
    const canvas = new OffscreenCanvas(grid.srcW, grid.srcH)
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(image, 0, 0, grid.srcW, grid.srcH)
    const imageData = ctx.getImageData(0, 0, grid.srcW, grid.srcH)
    const { width, height, data } = imageData
    const gray = new Uint8Array(width * height)
    for (let i = 0; i < width * height; i++) {
      const idx = i * 4
      gray[i] = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2])
    }
    const threshold = otsuThreshold(gray)
    const precision = 1 - threshold / 255
    const newSettings = { ...settings, precision: Math.max(0.05, Math.min(0.95, parseFloat(precision.toFixed(2)))) }
    setSettings(newSettings)
    if (image) processImage(image, newSettings)
  }, [image, settings, processImage])

  const handleHistorySelect = useCallback((entry) => {
    setAscii(entry.ascii)
    setDimensions(entry.dimensions)
  }, [])

  const handleSavePng = useCallback(() => {
    const canvas = document.querySelector('.ascii-canvas')
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'asciidot-output.png'
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }, [])

  const handleCopy = useCallback((mode) => {
    if (!ascii) return
    const text = mode === 'sans'
      ? ascii.split('\n').map(l => l.split('').join('\u200B')).join('\n')
      : ascii

    const blob = new Blob([text], { type: 'text/plain' })
    const item = new ClipboardItem({ 'text/plain': blob })
    navigator.clipboard.write([item]).catch(() => {})
    setCopiedStyle(mode)
    if (copyTimer.current) clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopiedStyle(null), 300)
  }, [ascii])

  useEffect(() => {
    return () => { if (copyTimer.current) clearTimeout(copyTimer.current) }
  }, [])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'c' || e.key === 'C') {
        if (e.shiftKey) {
          handleCopy('sans')
        } else {
          handleCopy('mono')
        }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [handleCopy])

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-left">
          <h1>asciidot</h1>
          <span className="subtitle">dot art converter</span>
        </div>
        <div className="app-header-right">
          <a href="https://github.com/rblez" target="_blank" rel="noopener noreferrer" className="social-link" title="GitHub">
            <GitHubIcon />
          </a>
          <a href="https://x.com/rblez_" target="_blank" rel="noopener noreferrer" className="social-link" title="X">
            <XIcon />
          </a>
          <a href="https://t.me/rblez" target="_blank" rel="noopener noreferrer" className="social-link" title="Telegram">
            <TelegramIcon />
          </a>
        </div>
      </header>

      <div className="preview-area">
        <div className="box">
          <ImageUploader onImageLoad={handleImageLoad} />
        </div>
        <div className="box">
          <AsciiPreview
            ascii={ascii}
            dimensions={dimensions}
            fontSize={settings.fontSize}
            history={history}
            onHistorySelect={handleHistorySelect}
            onCopy={handleCopy}
            copiedStyle={copiedStyle}
          />
        </div>
      </div>

      <Settings
        settings={{ ...settings, dimensions }}
        onChange={handleSettingsChange}
        onAutoThreshold={handleAutoThreshold}
        onCopy={handleCopy}
        onSavePng={handleSavePng}
      />
    </div>
  )
}

export default App
