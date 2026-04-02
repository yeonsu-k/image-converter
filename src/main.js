import { state } from './state.js';
import { renderCard } from './ui/card.js';
import { updateUI } from './ui/status.js';
import { convertAll } from './converters/index.js';
import { downloadZip } from './download.js';
import { initTheme, toggleTheme } from './theme.js';
import './style.css';

// ── 테마 초기화 ──
const themeToggle = document.getElementById('theme-toggle');

function updateToggleIcon(theme) {
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

const initialTheme = initTheme();
updateToggleIcon(initialTheme);

themeToggle.addEventListener('click', () => {
  const next = toggleTheme();
  updateToggleIcon(next);
});

// ── 탭 전환 ──
function switchTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  document.querySelectorAll('.tab-panel').forEach((p) => {
    p.classList.toggle('active', p.id === `tab-${tab}`);
  });
  updateUI();
}

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// ── 드래그&드롭 (탭별 드롭존) ──
function setupDropZone(tabName) {
  const dropZone = document.getElementById(`drop-zone-${tabName}`);
  const fileInput = document.getElementById(`file-input-${tabName}`);
  const browseBtn = document.getElementById(`browse-btn-${tabName}`);

  browseBtn.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('click', (e) => {
    if (e.target === browseBtn || browseBtn.contains(e.target)) return;
    fileInput.click();
  });
  fileInput.addEventListener('change', () => addFiles(fileInput.files, tabName));
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    addFiles(e.dataTransfer.files, tabName);
  });
}

setupDropZone('image');
setupDropZone('anim');

// ── 포맷 버튼 ──
document.querySelectorAll('.fmt-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.fmt-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.selectedFmt = btn.dataset.fmt;
  });
});

// ── 품질 슬라이더 ──
const qualitySlider = document.getElementById('quality-slider');
const qualityVal = document.getElementById('quality-val');
qualitySlider.addEventListener('input', () => {
  state.quality = qualitySlider.value / 100;
  qualityVal.textContent = qualitySlider.value;
});

// ── 전체 삭제 ──
document.getElementById('clear-btn').addEventListener('click', () => {
  const tab = state.activeTab;
  state.items = state.items.filter((i) => i.tab !== tab);
  document.getElementById(`grid-${tab}`).innerHTML = '';
  updateUI();
});

// ── 전체 변환 ──
document.getElementById('convert-all-btn').addEventListener('click', convertAll);
document.getElementById('convert-all-btn2').addEventListener('click', convertAll);

// ── ZIP 다운로드 ──
document.getElementById('download-zip-btn').addEventListener('click', downloadZip);

// ── 루프 토글 ──
document.getElementById('loop-toggle').addEventListener('change', (e) => {
  state.loop = e.target.checked;
});

// ── 파일 추가 ──
function addFiles(files, fromTab) {
  Array.from(files).forEach((file) => {
    if (!file.type.startsWith('image/')) return;
    // GIF는 항상 anim 탭, 그 외는 image 탭으로 자동 분류
    const tab = file.type === 'image/gif' ? 'anim' : 'image';
    const item = { id: state.nextId++, file, blob: null, status: 'waiting', tab };
    state.items.push(item);
    renderCard(item);
    // 파일의 탭이 현재 활성 탭과 다르면 해당 탭으로 전환
    if (tab !== state.activeTab) switchTab(tab);
  });
  updateUI();
}
