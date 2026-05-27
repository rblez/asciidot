import { useRef, useState, useCallback } from 'react';

const MAX_DIM = 2048;

export default function ImageUploader({ onImageLoad }) {
  const inputRef = useRef(null);
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

  const clear = useCallback(() => {
    revokeUrl();
    setPreview(null);
    setFileName('');
    setError('');
  }, [revokeUrl]);

  const processFile = useCallback((file) => {
    clear();
    if (!file || !file.type.startsWith('image/')) return;

    const url = URL.createObjectURL(file);
    urlRef.current = url;
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || 512;
      const h = img.naturalHeight || 512;
      if (w > MAX_DIM || h > MAX_DIM) {
        revokeUrl();
        setError('image too large — max 2048×2048px');
        return;
      }
      setFileName(file.name);
      setPreview(url);
      onImageLoad(img);
    };
    img.onerror = () => {
      revokeUrl();
      setError('image too large — max 2048×2048px');
    };
    img.src = url;
  }, [clear, revokeUrl, onImageLoad]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  }, [processFile]);

  const handleDragOver = useCallback((e) => e.preventDefault(), []);
  const handleDragEnter = useCallback(() => setDragging(true), []);
  const handleDragLeave = useCallback(() => setDragging(false), []);
  const handleClick = () => inputRef.current?.click();

  const handleChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
    e.target.value = '';
  };

  return (
    <div
      className={`uploader${dragging ? ' dragging' : ''}`}
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleChange}
        hidden
      />
      {error ? (
        <div className="upload-placeholder">
          <p>{error}</p>
        </div>
      ) : preview ? (
        <>
          <img src={preview} alt="preview" className="preview" />
          {fileName && (
            <span className="file-name">
              {fileName.length > 20 ? fileName.slice(0, 17) + '...' : fileName}
            </span>
          )}
        </>
      ) : (
        <div className="upload-placeholder">
          <p className="desktop-text">drop</p>
          <p className="desktop-text">/ paste</p>
          <p className="desktop-text">/ click</p>
          <p className="mobile-text">tap to upload</p>
        </div>
      )}
      {!preview && !error && (
        <p className="upload-hint">
          best results with high contrast images — black &amp; white, monochrome, bold two-tone colors, or svg
        </p>
      )}
    </div>
  );
}
