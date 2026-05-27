import { useState, useCallback, useEffect } from 'react'
import ImageUploader from './components/ImageUploader'
import AsciiPreview from './components/AsciiPreview'
import Settings from './components/Settings'
import { imageToAscii, calculateBrailleGrid } from './utils/imageToAscii'
import './App.css'

const DEFAULT_SETTINGS = {
  style: 'nodithering',
  precision: 0.5,
  scale: 0.5,
  invert: false,
}

function App() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [image, setImage] = useState(null)
  const [ascii, setAscii] = useState('')
  const [dimensions, setDimensions] = useState(null)

  const handleImageLoad = useCallback((img) => {
    setImage(img)
  }, [])

  useEffect(() => {
    if (!image) {
      setAscii('')
      setDimensions(null)
      return
    }
    const charCols = Math.max(4, Math.round(80 * settings.scale))
    const grid = calculateBrailleGrid(image.naturalWidth, image.naturalHeight, charCols)
    setDimensions(grid)

    const canvas = new OffscreenCanvas(grid.srcW, grid.srcH)
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(image, 0, 0, grid.srcW, grid.srcH)
    const imageData = ctx.getImageData(0, 0, grid.srcW, grid.srcH)

    const result = imageToAscii(imageData, settings)
    setAscii(result)
  }, [image, settings])

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
          <AsciiPreview ascii={ascii} dimensions={dimensions} />
        </div>
      </div>

      <Settings
        settings={{ ...settings, dimensions }}
        onChange={setSettings}
      />
    </div>
  )
}

export default App
