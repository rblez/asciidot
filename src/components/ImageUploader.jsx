import { useRef, useState, useCallback, useEffect } from 'react';
import { ArrowUpTrayIcon, CameraIcon, XMarkIcon } from '@heroicons/react/20/solid';

// Large phone photos are fine: they are downsampled to the braille grid
// before conversion. This only guards against absurd inputs.
const MAX_DIM = 12000;

export default function ImageUploader({ onImageLoad, onClear }) {
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const urlRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  const revokeUrl = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  useEffect(() => revokeUrl, [revokeUrl]);

  const processFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('not an image — try png, jpg, webp or svg');
      return;
    }
    setError('');
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || 512;
      const h = img.naturalHeight || 512;
      if (w > MAX_DIM || h > MAX_DIM) {
        URL.revokeObjectURL(url);
        setError(`image too large — max ${MAX_DIM}px per side`);
        return;
      }
      revokeUrl();
      urlRef.current = url;
      setFileName(file.name || 'pasted image');
      setPreview(url);
      onImageLoad(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError('could not read this image');
    };
    img.src = url;
  }, [revokeUrl, onImageLoad]);

  // Paste anywhere on the page (desktop ⌘V / ctrl+V, mobile long-press paste).
  useEffect(() => {
    const onPaste = (e) => {
      const items = e.clipboardData?.items || [];
      for (const item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          e.preventDefault();
          processFile(item.getAsFile());
          return;
        }
      }
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [processFile]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  }, [processFile]);

  const handleChange = (e) => {
    processFile(e.target.files[0]);
    e.target.value = '';
  };

  const clear = (e) => {
    e.stopPropagation();
    revokeUrl();
    setPreview(null);
    setFileName('');
    setError('');
    onClear?.();
  };

  return (
    <div className="uploader-wrap">
      <div
        className={`uploader${dragging ? ' dragging' : ''}${preview ? ' has-image' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="upload image: drop, paste or choose a file"
        onClick={() => fileRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileRef.current?.click();
          }
        }}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
      >
        {preview ? (
          <img src={preview} alt="source" className="uploader-preview" />
        ) : (
          <div className="uploader-empty">
            <ArrowUpTrayIcon className="uploader-icon" aria-hidden="true" />
            <span className="uploader-hint">
              <span className="hint-fine">drop / paste / click</span>
              <span className="hint-coarse">tap to choose an image</span>
            </span>
            <span className="uploader-formats">png · jpg · webp · svg</span>
          </div>
        )}
      </div>

      {error && <p className="uploader-error" role="alert">{error}</p>}

      <div className="uploader-actions">
        <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
          <ArrowUpTrayIcon className="btn-icon" aria-hidden="true" />
          {preview ? 'replace' : 'choose file'}
        </button>
        <button type="button" className="btn btn-camera" onClick={() => cameraRef.current?.click()}>
          <CameraIcon className="btn-icon" aria-hidden="true" />
          camera
        </button>
        {preview && (
          <button type="button" className="btn btn-ghost" onClick={clear} aria-label="remove image">
            <XMarkIcon className="btn-icon" aria-hidden="true" />
            <span className="file-name">{fileName}</span>
          </button>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" onChange={handleChange} hidden />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleChange} hidden />
    </div>
  );
}
