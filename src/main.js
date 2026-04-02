import { state } from './state.js';
import { renderCard } from './ui/card.js';
import { updateUI } from './ui/status.js';
import { convertAll } from './converters/index.js';
import { downloadZip } from './download.js';
import { initTheme, toggleTheme } from './theme.js';
import './styles/main.scss';

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
  // 설정 패널을 활성 탭의 드롭존 바로 아래(그리드 앞)로 이동
  const panel = document.getElementById('settings-panel');
  const grid = document.getElementById(`grid-${tab}`);
  grid.parentElement.insertBefore(panel, grid);
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
}

setupDropZone('image');
setupDropZone('anim');

// ── 애니메이션 탭 품질 슬라이더 표시 여부 ──
function updateAnimQualityVisibility() {
  const fmt = state.anim.selectedFmt;
  const show = fmt === 'image/webp' || fmt === 'image/apng';
  document.getElementById('anim-quality-group').style.display = show ? '' : 'none';
}

// ── 포맷 버튼 (탭별 독립) ──
document.querySelectorAll('.fmt-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    btn.closest('.format-btns').querySelectorAll('.fmt-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state[state.activeTab].selectedFmt = btn.dataset.fmt;
    if (state.activeTab === 'anim') updateAnimQualityVisibility();
  });
});

// ── 품질 슬라이더 (이미지 탭) ──
const qualitySlider = document.getElementById('quality-slider');
const qualityVal = document.getElementById('quality-val');
qualitySlider.addEventListener('input', () => {
  state.image.quality = qualitySlider.value / 100;
  qualityVal.textContent = qualitySlider.value;
});

// ── 품질 슬라이더 (애니메이션 탭) ──
const qualitySliderAnim = document.getElementById('quality-slider-anim');
const qualityValAnim = document.getElementById('quality-val-anim');
qualitySliderAnim.addEventListener('input', () => {
  state.anim.quality = qualitySliderAnim.value / 100;
  qualityValAnim.textContent = qualitySliderAnim.value;
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

// ── 루프 토글 (애니메이션 탭) ──
document.getElementById('loop-toggle').addEventListener('change', (e) => {
  state.anim.loop = e.target.checked;
});

// ── 파일 추가 ──
function addFiles(files) {
  Array.from(files).forEach((file) => {
    if (!file.type.startsWith('image/')) return;
    const tab = file.type === 'image/gif' ? 'anim' : 'image';
    const item = { id: state.nextId++, file, blob: null, status: 'waiting', tab };
    state.items.push(item);
    renderCard(item);
    if (tab !== state.activeTab) switchTab(tab);
  });
  updateUI();
}
