function toGrayscale(data, width, height) {
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    gray[i] = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
  }
  return gray;
}

function applyBasic(gray) {
  return gray;
}

function applyOutlineContrast(gray, width, height) {
  const result = new Uint8Array(width * height);
  const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
  const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const val = gray[(y + ky) * width + (x + kx)];
          gx += val * sobelX[ky + 1][kx + 1];
          gy += val * sobelY[ky + 1][kx + 1];
        }
      }
      const mag = Math.round(Math.sqrt(gx * gx + gy * gy));
      result[y * width + x] = Math.min(255, mag);
    }
  }
  return result;
}

function applyFloydSteinberg(gray, width, height, threshold) {
  const copy = new Uint8ClampedArray(gray);
  const result = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const oldVal = copy[idx];
      const newVal = oldVal < threshold ? 0 : 255;
      result[idx] = newVal;
      const err = oldVal - newVal;
      if (x + 1 < width)
        copy[idx + 1] = Math.min(255, Math.max(0, copy[idx + 1] + ((err * 7) / 16) | 0));
      if (y + 1 < height) {
        if (x > 0)
          copy[(y + 1) * width + (x - 1)] = Math.min(255, Math.max(0, copy[(y + 1) * width + (x - 1)] + ((err * 3) / 16) | 0));
        copy[(y + 1) * width + x] = Math.min(255, Math.max(0, copy[(y + 1) * width + x] + ((err * 5) / 16) | 0));
        if (x + 1 < width)
          copy[(y + 1) * width + (x + 1)] = Math.min(255, Math.max(0, copy[(y + 1) * width + (x + 1)] + ((err * 1) / 16) | 0));
      }
    }
  }
  return result;
}

function renderBraille(gray, width, height, threshold, invert) {
  const cellsX = Math.floor(width / 2);
  const cellsY = Math.floor(height / 4);
  let output = '';
  const offsets = [
    [0, 0], [1, 0], [2, 0],
    [0, 1], [1, 1], [2, 1],
    [3, 0], [3, 1],
  ];
  for (let cy = 0; cy < cellsY; cy++) {
    for (let cx = 0; cx < cellsX; cx++) {
      let code = 0x2800;
      for (let i = 0; i < 8; i++) {
        const px = cx * 2 + offsets[i][1];
        const py = cy * 4 + offsets[i][0];
        const brightness = gray[py * width + px];
        const active = invert ? brightness > threshold : brightness < threshold;
        if (active) code |= (1 << i);
      }
      output += String.fromCodePoint(code);
    }
    if (cy < cellsY - 1) output += '\n';
  }
  return output;
}

const STYLE_FUNCS = {
  basic: { name: 'Basic', apply: applyBasic },
  outline: { name: 'Outline Contrast', apply: applyOutlineContrast },
  simplified: { name: 'Simplified', apply: applyFloydSteinberg },
  nodithering: { name: 'No Dithering', apply: applyBasic },
};

export function imageToAscii(imageData, { style, precision, invert }) {
  const { width, height, data } = imageData;
  const threshold = Math.round((1 - precision) * 255);
  const gray = toGrayscale(data, width, height);
  const mode = STYLE_FUNCS[style] || STYLE_FUNCS.nodithering;
  let processed;
  if (style === 'simplified') {
    processed = mode.apply(gray, width, height, threshold);
  } else {
    processed = mode.apply(gray, width, height);
  }
  return renderBraille(processed, width, height, threshold, invert);
}

export function calculateBrailleGrid(imgW, imgH, charCols) {
  const aspectRatio = imgH / imgW;
  const charRows = Math.max(1, Math.round(charCols * aspectRatio * 0.5));
  return {
    cols: charCols,
    rows: charRows,
    srcW: charCols * 2,
    srcH: charRows * 4,
    dispW: charCols * 8,
    dispH: charRows * 16,
  };
}
