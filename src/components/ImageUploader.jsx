import { useRef, useState, useCallback } from 'react';

export default function ImageUploader({ onImageLoad }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target.result;
      setPreview(url);
      const img = new Image();
      img.onload = () => {
        onImageLoad(img);
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  }, [onImageLoad]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleClick = () => inputRef.current?.click();

  const handleChange = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  return (
    <div
      className="uploader"
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        hidden
      />
      {preview ? (
        <img src={preview} alt="preview" className="preview" />
      ) : (
        <div className="upload-placeholder">
          <span className="upload-icon">+</span>
          <p>Drop image or click to upload</p>
        </div>
      )}
    </div>
  );
}
