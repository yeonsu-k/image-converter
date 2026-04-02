import { state } from './state.js';
import { renderCard } from './ui/card.js';
import { updateUI } from './ui/status.js';
import { convertAll } from './converters/index.js';
import { downloadZip } from './download.js';
import './style.css';

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');
const qualitySlider = document.getElementById('quality-slider');
const qualityVal = document.getElementById('quality-val');
const grid = document.getElementById('image-grid');

// ── 드래그&드롭 ──
browseBtn.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('click', (e) => {
  if (e.target === browseBtn || browseBtn.contains(e.target)) return;
  fileInput.click();
});
fileInput.addEventListener('change', () => addFiles(fileInput.files));
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  addFiles(e.dataTransfer.files);
});

// ── 포맷 버튼 ──
document.querySelectorAll('.fmt-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.fmt-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.selectedFmt = btn.dataset.fmt;
  });
});

// ── 품질 슬라이더 ──
qualitySlider.addEventListener('input', () => {
  state.quality = qualitySlider.value / 100;
  qualityVal.textContent = qualitySlider.value;
});

// ── 전체 삭제 ──
document.getElementById('clear-btn').addEventListener('click', () => {
  state.items.length = 0;
  grid.innerHTML = '';
  updateUI();
});

// ── 전체 변환 ──
document.getElementById('convert-all-btn').addEventListener('click', convertAll);
document.getElementById('convert-all-btn2').addEventListener('click', convertAll);

// ── ZIP 다운로드 ──
document.getElementById('download-zip-btn').addEventListener('click', downloadZip);

// ── 파일 추가 ──
function addFiles(files) {
  Array.from(files).forEach((file) => {
    if (!file.type.startsWith('image/')) return;
    const item = { id: state.nextId++, file, blob: null, status: 'waiting' };
    state.items.push(item);
    renderCard(item);
  });
  updateUI();
}
