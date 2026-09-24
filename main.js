/**
 * ImageShrink - Main Application Controller
 */

import {
  TARGET_WIDTH,
  TARGET_HEIGHT,
  formatBytes,
  loadImage,
  renderToCanvas,
  compressCanvasToJpeg,
  getOptimizedFilename
} from './compressor.js';

// Application State
const state = {
  file: null,
  loadedImage: null,
  originalWidth: 0,
  originalHeight: 0,
  originalSize: 0,
  originalType: 'Unknown',
  originalFilename: 'image',
  originalPreviewUrl: null,

  resizeMode: 'crop', // 'crop' (default) | 'fit' | 'stretch'
  targetSizeKb: 500,  // default 500 KB

  optimizedBlob: null,
  optimizedUrl: null,
  optimizedFilename: '',
  isProcessing: false
};

// DOM Elements
const elements = {
  dropZone: document.getElementById('dropZone'),
  fileInput: document.getElementById('fileInput'),
  errorBanner: document.getElementById('errorBanner'),
  errorMessage: document.getElementById('errorMessage'),
  errorCloseBtn: document.getElementById('errorCloseBtn'),

  // Live Info Panel
  liveInfoPanel: document.getElementById('liveInfoPanel'),
  liveFilenameChip: document.getElementById('liveFilenameChip'),
  liveOriginalSize: document.getElementById('liveOriginalSize'),
  liveOriginalDims: document.getElementById('liveOriginalDims'),
  liveTargetSize: document.getElementById('liveTargetSize'),

  // Settings Panel
  settingsPanel: document.getElementById('settingsPanel'),
  modeCrop: document.getElementById('modeCrop'),
  modeFit: document.getElementById('modeFit'),
  modeStretch: document.getElementById('modeStretch'),
  presetBtns: document.querySelectorAll('.preset-btn'),
  customPresetBtn: document.getElementById('customPresetBtn'),
  customSizeContainer: document.getElementById('customSizeContainer'),
  customSizeInput: document.getElementById('customSizeInput'),
  applyCustomSizeBtn: document.getElementById('applyCustomSizeBtn'),
  optimizeBtn: document.getElementById('optimizeBtn'),
  btnContent: document.querySelector('.btn-content'),
  btnLoading: document.querySelector('.btn-loading'),

  // Results Section
  resultsSection: document.getElementById('resultsSection'),
  savingsPercentage: document.getElementById('savingsPercentage'),
  savingsTransition: document.getElementById('savingsTransition'),
  closestAchievedNotice: document.getElementById('closestAchievedNotice'),
  originalPreviewImg: document.getElementById('originalPreviewImg'),
  originalTypeBadge: document.getElementById('originalTypeBadge'),
  originalFilenameText: document.getElementById('originalFilenameText'),
  originalDimsText: document.getElementById('originalDimsText'),
  originalSizeText: document.getElementById('originalSizeText'),
  optimizedPreviewImg: document.getElementById('optimizedPreviewImg'),
  optimizedFilenameText: document.getElementById('optimizedFilenameText'),
  optimizedDimsText: document.getElementById('optimizedDimsText'),
  optimizedSizeText: document.getElementById('optimizedSizeText'),
  downloadBtn: document.getElementById('downloadBtn'),
  resetBtn: document.getElementById('resetBtn')
};

// Initialization
function init() {
  bindDropZoneEvents();
  bindSettingsEvents();
  bindActionEvents();
  bindClipboardPaste();
}

/**
 * Show a user-friendly error message
 */
function showError(msg = "We couldn't process this image. Please try another file.") {
  elements.errorMessage.textContent = msg;
  elements.errorBanner.classList.remove('hidden');
}

/**
 * Dismiss error banner
 */
function clearError() {
  elements.errorBanner.classList.add('hidden');
}

/**
 * Map MIME type to friendly uppercase format tag
 */
function getFormatName(type, filename) {
  if (type === 'image/png') return 'PNG';
  if (type === 'image/jpeg' || type === 'image/jpg') return 'JPEG';
  if (type === 'image/webp') return 'WEBP';
  if (type === 'image/gif') return 'GIF';
  if (type === 'image/bmp') return 'BMP';
  if (type === 'image/svg+xml') return 'SVG';

  const extMatch = filename.match(/\.([0-9a-z]+)$/i);
  return extMatch ? extMatch[1].toUpperCase() : 'IMAGE';
}

/**
 * Handle incoming file from drag-and-drop, file picker, or paste
 */
async function handleSelectedFile(file) {
  if (!file) return;
  clearError();

  if (!file.type || !file.type.startsWith('image/')) {
    showError("We couldn't process this file. Please select a valid JPG, PNG, or WEBP image.");
    return;
  }

  try {
    // Clean up previous preview URL
    if (state.originalPreviewUrl) {
      URL.revokeObjectURL(state.originalPreviewUrl);
      state.originalPreviewUrl = null;
    }

    const { image, width, height } = await loadImage(file);

    state.file = file;
    state.loadedImage = image;
    state.originalWidth = width;
    state.originalHeight = height;
    state.originalSize = file.size;
    state.originalFilename = file.name || 'screenshot.png';
    state.originalType = getFormatName(file.type, state.originalFilename);
    state.originalPreviewUrl = URL.createObjectURL(file);

    // Update Live Information Panel
    elements.liveFilenameChip.textContent = state.originalFilename;
    elements.liveOriginalSize.textContent = formatBytes(state.originalSize);
    elements.liveOriginalDims.textContent = `${state.originalWidth} × ${state.originalHeight}`;
    updateLiveTargetDisplay();

    // Show Panels
    elements.liveInfoPanel.classList.remove('hidden');
    elements.settingsPanel.classList.remove('hidden');

    // Scroll slightly so the user sees the settings panel
    elements.liveInfoPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (err) {
    console.error('Image load error:', err);
    showError("We couldn't process this image. Please try another file.");
  }
}

/**
 * Updates the Target readout in the live info panel
 */
function updateLiveTargetDisplay() {
  if (state.targetSizeKb >= 1000) {
    elements.liveTargetSize.textContent = `${(state.targetSizeKb / 1000).toFixed(state.targetSizeKb % 1000 === 0 ? 0 : 1)} MB`;
  } else {
    elements.liveTargetSize.textContent = `${state.targetSizeKb} KB`;
  }
}

/**
 * Bind Drag & Drop and File Picker Events
 */
function bindDropZoneEvents() {
  const { dropZone, fileInput, errorCloseBtn } = elements;

  errorCloseBtn.addEventListener('click', clearError);

  // Click on dropzone triggers hidden file input
  dropZone.addEventListener('click', () => fileInput.click());

  // Keyboard accessibility: Enter or Space activates file input
  dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleSelectedFile(e.target.files[0]);
    }
  });

  // Drag over animations
  ['dragenter', 'dragover'].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('dragover');
    });
  });

  ['dragleave', 'dragend', 'drop'].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('dragover');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  });
}

/**
 * Bind Clipboard Paste (Ctrl+V) for easy screenshots
 */
function bindClipboardPaste() {
  window.addEventListener('paste', (e) => {
    if (!e.clipboardData || !e.clipboardData.items) return;

    for (const item of e.clipboardData.items) {
      if (item.type && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          handleSelectedFile(file);
          break;
        }
      }
    }
  });
}

/**
 * Bind Settings controls (Resize mode & Target file size)
 */
function bindSettingsEvents() {
  // Resize Mode Radio Group
  document.querySelectorAll('input[name="resizeMode"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      state.resizeMode = e.target.value;
    });
  });

  // Target File Size Presets
  elements.presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn === elements.customPresetBtn) {
        // Toggle custom input container
        elements.presetBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        elements.customSizeContainer.classList.remove('hidden');
        elements.customSizeInput.focus();
      } else {
        elements.presetBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        elements.customSizeContainer.classList.add('hidden');

        const size = parseInt(btn.dataset.size, 10);
        if (size && !isNaN(size)) {
          state.targetSizeKb = size;
          updateLiveTargetDisplay();
        }
      }
    });
  });

  // Custom Size Apply
  elements.applyCustomSizeBtn.addEventListener('click', applyCustomTargetSize);
  elements.customSizeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyCustomTargetSize();
    }
  });
}

function applyCustomTargetSize() {
  const val = parseInt(elements.customSizeInput.value, 10);
  if (val && !isNaN(val) && val > 0) {
    state.targetSizeKb = val;
    updateLiveTargetDisplay();
  } else {
    showError('Please enter a valid target file size in KB (e.g. 350).');
  }
}

/**
 * Bind Main Actions: Optimize, Download, Reset
 */
function bindActionEvents() {
  elements.optimizeBtn.addEventListener('click', runOptimization);
  elements.downloadBtn.addEventListener('click', triggerDownload);
  elements.resetBtn.addEventListener('click', resetApp);
}

/**
 * Optimize Image Execution
 */
async function runOptimization() {
  if (!state.loadedImage || state.isProcessing) return;
  clearError();

  state.isProcessing = true;
  elements.optimizeBtn.disabled = true;
  elements.btnContent.classList.add('hidden');
  elements.btnLoading.classList.remove('hidden');

  // Yield to browser to render loading spinner before heavy canvas/compression
  await new Promise((resolve) => setTimeout(resolve, 60));

  try {
    // 1. Render to Canvas with selected mode (Crop, Fit, Stretch)
    const canvas = renderToCanvas(state.loadedImage, state.resizeMode);

    // 2. Compress Canvas to JPEG targeting the selected file size
    const targetBytes = state.targetSizeKb * 1024;
    const { blob, quality, isClosestAchieved } = await compressCanvasToJpeg(canvas, targetBytes);

    // 3. Store results
    if (state.optimizedUrl) {
      URL.revokeObjectURL(state.optimizedUrl);
    }
    state.optimizedBlob = blob;
    state.optimizedUrl = URL.createObjectURL(blob);
    state.optimizedFilename = getOptimizedFilename(state.originalFilename);

    // 4. Update Results Section
    renderResults({ isClosestAchieved, quality });

    // 5. Reveal Results and scroll smoothly
    elements.resultsSection.classList.remove('hidden');
    elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    console.error('Optimization error:', err);
    showError("We couldn't process this image. Please try another file.");
  } finally {
    state.isProcessing = false;
    elements.optimizeBtn.disabled = false;
    elements.btnContent.classList.remove('hidden');
    elements.btnLoading.classList.add('hidden');
  }
}

/**
 * Display Before / After Comparison Results
 */
function renderResults({ isClosestAchieved }) {
  // Savings calculation
  const originalBytes = state.originalSize;
  const optimizedBytes = state.optimizedBlob.size;
  const diff = originalBytes - optimizedBytes;

  if (diff > 0) {
    const pct = ((diff / originalBytes) * 100).toFixed(1);
    elements.savingsPercentage.textContent = `${pct}% smaller`;
  } else {
    // Edge case if original was extremely small
    elements.savingsPercentage.textContent = 'Optimized for web';
  }

  elements.savingsTransition.textContent = `${formatBytes(originalBytes)} → ${formatBytes(optimizedBytes)}`;

  // Closest achieved notice
  if (isClosestAchieved) {
    elements.closestAchievedNotice.classList.remove('hidden');
  } else {
    elements.closestAchievedNotice.classList.add('hidden');
  }

  // Original Card
  elements.originalPreviewImg.src = state.originalPreviewUrl;
  elements.originalTypeBadge.textContent = state.originalType;
  elements.originalFilenameText.textContent = state.originalFilename;
  elements.originalFilenameText.title = state.originalFilename;
  elements.originalDimsText.textContent = `${state.originalWidth} × ${state.originalHeight}`;
  elements.originalSizeText.textContent = formatBytes(state.originalSize);

  // Optimized Card
  elements.optimizedPreviewImg.src = state.optimizedUrl;
  elements.optimizedFilenameText.textContent = state.optimizedFilename;
  elements.optimizedFilenameText.title = state.optimizedFilename;
  elements.optimizedDimsText.textContent = `${TARGET_WIDTH} × ${TARGET_HEIGHT}`;
  elements.optimizedSizeText.textContent = formatBytes(optimizedBytes);
}

/**
 * Trigger real browser download with <a download>
 */
function triggerDownload() {
  if (!state.optimizedBlob || !state.optimizedUrl) return;

  const link = document.createElement('a');
  link.href = state.optimizedUrl;
  link.download = state.optimizedFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Reset App State
 */
function resetApp() {
  clearError();

  // Revoke object URLs to avoid memory leaks
  if (state.originalPreviewUrl) {
    URL.revokeObjectURL(state.originalPreviewUrl);
  }
  if (state.optimizedUrl) {
    URL.revokeObjectURL(state.optimizedUrl);
  }

  // Clear state
  state.file = null;
  state.loadedImage = null;
  state.originalWidth = 0;
  state.originalHeight = 0;
  state.originalSize = 0;
  state.originalPreviewUrl = null;
  state.optimizedBlob = null;
  state.optimizedUrl = null;
  state.optimizedFilename = '';
  state.targetSizeKb = 500;
  state.resizeMode = 'crop';

  // Reset inputs
  elements.fileInput.value = '';
  elements.modeCrop.checked = true;
  elements.customSizeContainer.classList.add('hidden');
  elements.customSizeInput.value = '';

  // Reset preset buttons to 500 KB default
  elements.presetBtns.forEach((btn) => {
    if (btn.dataset.size === '500') {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Hide conditional sections
  elements.liveInfoPanel.classList.add('hidden');
  elements.settingsPanel.classList.add('hidden');
  elements.resultsSection.classList.add('hidden');

  // Scroll back to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Boot up
document.addEventListener('DOMContentLoaded', init);