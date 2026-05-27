import { useState, useCallback, useEffect, useRef } from 'react'
import ImageUploader from './components/ImageUploader'
import AsciiPreview from './components/AsciiPreview'
import Settings from './components/Settings'
import { imageToAscii, estimateBrailleDimensions } from './utils/imageToAscii'
import './App.css'

const DEFAULT_SETTINGS = {
  charSet: 'braille',
  precision: 0.5,
  scale: 0.5,
  invert: false,
}

function App() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [image, setImage] = useState(null)
  const [ascii, setAscii] = useState('')
  const [dimensions, setDimensions] = useState(null)
  const workerRef = useRef(null)

  const handleImageLoad = useCallback((img) => {
    setImage(img)
  }, [])

  useEffect(() => {
    if (!image) {
      setAscii('')
      setDimensions(null)
      return
    }
    const canvas = new OffscreenCanvas(image.width, image.height)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0)
    const imageData = ctx.getImageData(0, 0, image.width, image.height)

    const dims = estimateBrailleDimensions(image.width, image.height, settings.scale)
    setDimensions(dims)

    const result = imageToAscii(imageData, settings)
    setAscii(result)
  }, [image, settings])

  return (
    <div className="app">
      <header className="app-header">
        <h1>ascii</h1>
        <span className="subtitle">dot art converter</span>
      </header>

      <div className="preview-area">
        <div className="box">
          <div className="box-label">Input</div>
          <ImageUploader onImageLoad={handleImageLoad} />
        </div>
        <div className="box">
          <div className="box-label">Output</div>
          <AsciiPreview ascii={ascii} charSet={settings.charSet} />
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
