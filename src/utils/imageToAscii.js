const CHAR_SETS = {
  braille: {
    name: 'Braille (dots)',
    render: (imageData, width, height, threshold, invert) => {
      const cellsX = Math.floor(width / 2);
      const cellsY = Math.floor(height / 4);
      let output = '';
      for (let cy = 0; cy < cellsY; cy++) {
        for (let cx = 0; cx < cellsX; cx++) {
          let code = 0x2800;
          const offsets = [
            [0, 0], [1, 0], [2, 0],
            [0, 1], [1, 1], [2, 1],
            [3, 0], [3, 1],
          ];
          for (let i = 0; i < 8; i++) {
            const px = cx * 2 + offsets[i][1];
            const py = cy * 4 + offsets[i][0];
            const idx = (py * width + px) * 4;
            const r = imageData[idx];
            const g = imageData[idx + 1];
            const b = imageData[idx + 2];
            const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
            const active = invert ? brightness > threshold : brightness < threshold;
            if (active) code |= (1 << i);
          }
          output += String.fromCodePoint(code);
        }
        if (cy < cellsY - 1) output += '\n';
      }
      return output;
    }
  },
  block: {
    name: 'Block',
    render: (imageData, width, height, threshold, invert) => {
      const chars = [' ', '░', '▒', '▓', '█'];
      let output = '';
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const r = imageData[idx];
          const g = imageData[idx + 1];
          const b = imageData[idx + 2];
          const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
          const normalized = invert ? 255 - brightness : brightness;
          const level = Math.min(4, Math.floor((normalized / 255) * 5));
          output += chars[level];
        }
        output += '\n';
      }
      return output;
    }
  },
  ascii: {
    name: 'ASCII',
    render: (imageData, width, height, threshold, invert) => {
      const chars = ['@', '%', '#', '*', '+', '=', '-', ':', '.', ' '];
      let output = '';
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const r = imageData[idx];
          const g = imageData[idx + 1];
          const b = imageData[idx + 2];
          const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
          const normalized = invert ? 255 - brightness : brightness;
          const level = Math.min(9, Math.floor((normalized / 255) * 10));
          output += chars[level];
        }
        output += '\n';
      }
      return output;
    }
  }
};

function scaleImageData(imageData, srcWidth, srcHeight, targetWidth, targetHeight) {
  const canvas = new OffscreenCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');
  const tempCanvas = new OffscreenCanvas(srcWidth, srcHeight);
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.putImageData(imageData, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);
  return ctx.getImageData(0, 0, targetWidth, targetHeight);
}

export function imageToAscii(imageData, { charSet, precision, invert, scale }) {
  const { width, height } = imageData;
  const threshold = Math.round((1 - precision) * 255);
  const scaleFactor = scale || 1;
  const targetW = Math.round(width * scaleFactor);
  const targetH = Math.round(height * scaleFactor);
  const scaled = (scaleFactor !== 1)
    ? scaleImageData(imageData, width, height, targetW, targetH)
    : imageData;
  const set = CHAR_SETS[charSet] || CHAR_SETS.braille;
  return set.render(scaled.data, scaled.width, scaled.height, threshold, invert);
}

export function estimateBrailleDimensions(width, height, scale) {
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  return { cols: Math.floor(w / 2), rows: Math.floor(h / 4) };
}
