import { useState, useCallback, useEffect, useRef } from 'react'
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

function App() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [image, setImage] = useState(null)
  const [ascii, setAscii] = useState('')
  const [dimensions, setDimensions] = useState(null)
  const [history, setHistory] = useState([])
  const [copiedStyle, setCopiedStyle] = useState(null)
  const copyTimer = useRef(null)

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
        <h1>asciidot</h1>
        <span className="subtitle">dot art converter</span>
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
