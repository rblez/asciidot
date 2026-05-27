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

export function applyContrastBrightness(data, width, height, contrast, brightness) {
  if (contrast === 0 && brightness === 0) return;
  const factor = contrast / 100 + 1;
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    data[idx] = Math.max(0, Math.min(255, Math.round(data[idx] * factor + brightness)));
    data[idx + 1] = Math.max(0, Math.min(255, Math.round(data[idx + 1] * factor + brightness)));
    data[idx + 2] = Math.max(0, Math.min(255, Math.round(data[idx + 2] * factor + brightness)));
  }
}

export function otsuThreshold(gray) {
  const hist = new Uint32Array(256);
  for (let i = 0; i < gray.length; i++) {
    hist[gray[i]]++;
  }
  const total = gray.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0, wB = 0, maxVariance = 0, threshold = 0;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const meanB = sumB / wB;
    const meanF = (sum - sumB) / wF;
    const variance = wB * wF * (meanB - meanF) * (meanB - meanF);
    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = t;
    }
  }
  return threshold;
}

export function cropWhitespace(ascii, originalCols) {
  const rows = ascii.split('\n');
  if (rows.length === 0) return { ascii, cols: originalCols, rows: rows.length };
  const cols = rows[0].length;
  let top = 0, bottom = rows.length - 1;
  let left = 0, right = cols - 1;

  while (top <= bottom && rows[top].split('').every(ch => ch === '\u2800')) top++;
  while (bottom >= top && rows[bottom].split('').every(ch => ch === '\u2800')) bottom--;
  if (top > bottom) return { ascii: '', cols: 0, rows: 0 };

  while (left <= right) {
    let allEmpty = true;
    for (let r = top; r <= bottom; r++) {
      if (rows[r][left] !== '\u2800') { allEmpty = false; break; }
    }
    if (allEmpty) left++; else break;
  }
  while (right >= left) {
    let allEmpty = true;
    for (let r = top; r <= bottom; r++) {
      if (rows[r][right] !== '\u2800') { allEmpty = false; break; }
    }
    if (allEmpty) right--; else break;
  }

  const croppedRows = [];
  for (let r = top; r <= bottom; r++) {
    croppedRows.push(rows[r].slice(left, right + 1));
  }
  return { ascii: croppedRows.join('\n'), cols: right - left + 1, rows: bottom - top + 1 };
}

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
