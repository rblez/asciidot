# asciidot

Convert images to braille-dot ASCII art in the browser.

Upload an image (PNG, JPEG, WebP, SVG) and get a braille character representation rendered on canvas. Supports multiple rendering styles, export to clipboard or `.txt` file, and fully responsive mobile layout.

## Features

- **4 rendering styles**: Basic (hard threshold), Outline Contrast (Sobel 3×3), Simplified (Floyd-Steinberg dithering), No Dithering (nearest neighbor)
- **Image upload**: drag & drop, paste, or file picker. Max 2048×2048px
- **Canvas rendering**: braille output on pixelated canvas with scanline overlay
- **Export**: mono or sans-serif spacing, to clipboard or `.txt` download
- **Controls**: precision, scale, invert toggle, and style selector
- **Responsive**: mobile-optimized layout at ≤768px

## Stack

- React 19 + Vite
- OffscreenCanvas for image processing and braille rendering
- Self-hosted Geist Pixel Square font
- Plain CSS (no Tailwind, no CSS-in-JS)

## Getting started

```bash
bun install
bun run dev
```

Build for production:

```bash
bun run build
```

Serve the `dist/` folder.

## License

MIT
