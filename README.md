# ImageShrink 

ImageShrink is a modern, client-side web application that resizes, converts, and compresses images into web-ready **1200 × 628 JPEG** files directly in your browser.

>  100% Client-Side Privacy: Your images stay entirely on your device and are never uploaded to any remote server or external API.

---

##  Features

- **Standardized Dimensions**: Automatically resizes/crops to exact **1200 × 628 pixels** (ideal for social cards, banners, and web heroes).
- **Format Conversion**: Converts PNG, WEBP, GIF, BMP, and screenshots to optimized **JPEG** with automatic white background fill for transparency.
- **Three Resize Modes**:
  - **Crop (Default)**: Fills 1200 × 628 while preserving aspect ratio with centered crop.
  - **Fit**: Preserves entire image without cropping, adding a clean white letterbox.
  - **Stretch**: Direct scale to 1200 × 628 without preserving aspect ratio.
- **Smart Iterative Compression**:
  - Binary search algorithm on JPEG quality to reach your target file size without unnecessary degradation.
  - Target presets: **Under 1 MB**, **Under 500 KB (Default)**, **Under 300 KB**, **Under 200 KB**, or **Custom KB**.
- **Live Pre-Optimization Panel**: Shows original dimensions, file size, target size, and fixed 1200 × 628 JPEG output spec.
- **Before / After Comparison**:
  - High-DPI preview cards.
  - Prominent percentage reduction callout (e.g. `78.8% smaller`, `505 KB → 107 KB`).
- **Direct Download**: Triggers genuine `.jpg` file download (`[name]-optimized.jpg`) with valid JPEG headers.
- **Convenient Inputs**: Supports drag-and-drop, native file picker, and clipboard paste (`Ctrl + V`).

---

##  Running Locally

### Development Server
```bash
cd C:\Users\admin\.gemini\antigravity\scratch\imageshrink
npm run dev
