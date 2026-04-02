import { state } from '../state.js';

export function fmtSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

const FMT_LABEL = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'image/gif': 'GIF',
  'image/apng': 'APNG',
  'image/bmp': 'BMP',
  'image/svg+xml': 'SVG',
  'video/webm': 'WebM',
};
const fmtLabel = (mime) => FMT_LABEL[mime] ?? mime;

export function setStatus(item, status) {
  item.status = status;
  const badge = document.getElementById('badge-' + item.id);
  const card = document.getElementById('card-' + item.id);
  if (!badge) return;
  badge.className = 'status-badge ' + status;
  const labels = { waiting: '대기 중', loading: '변환 중', done: '완료', error: '오류' };
  badge.textContent = status === 'loading' ? '' : labels[status];
  if (status === 'loading') {
    const sp = document.createElement('span');
    sp.className = 'spinner';
    badge.appendChild(sp);
  }
  card.className =
    'img-card' +
    (status === 'done' ? ' done' : status === 'error' ? ' error' : '');
  const dlBtn = document.getElementById('dl-' + item.id);
  if (dlBtn) dlBtn.classList.toggle('visible', status === 'done');

  if (status === 'done' && item.outputFmt) {
    const fmtRow = document.getElementById('fmt-row-' + item.id);
    if (fmtRow) {
      const from = fmtLabel(item.file.type);
      const to = fmtLabel(item.outputFmt);
      fmtRow.innerHTML =
        `<span class="fmt-from">${from}</span>` +
        `<span class="fmt-arrow">→</span>` +
        `<span class="fmt-to">${to}</span>`;
    }
  }

  if (status === 'done' && item.tab === 'anim' && item.blob) {
    // 썸네일을 변환된 결과물로 교체
    const blobUrl = URL.createObjectURL(item.blob);
    if (item.outputFmt === 'video/webm') {
      const thumb = document.getElementById('thumb-' + item.id);
      if (thumb) {
        const video = document.createElement('video');
        video.src = blobUrl;
        video.autoplay = true;
        video.loop = item.loop;
        video.muted = true;
        video.playsInline = true;
        thumb.replaceWith(video);
      }
    } else {
      const thumb = document.getElementById('thumb-' + item.id);
      if (thumb) thumb.src = blobUrl;
    }

    // 루프 태그 표시
    const loopTag = document.getElementById('loop-tag-' + item.id);
    if (loopTag) {
      loopTag.textContent = item.loop ? '∞ 무한루프' : '1회 재생';
      loopTag.className = 'loop-tag' + (item.loop ? ' loop' : ' once');
    }
  }
}

export function updateSizeInfo(item) {
  const afterEl = document.getElementById('size-after-' + item.id);
  const redEl = document.getElementById('reduction-' + item.id);
  if (!afterEl || !item.blob) return;
  const before = item.file.size;
  const after = item.blob.size;
  const diff = Math.round((1 - after / before) * 100);
  afterEl.textContent = fmtSize(after);
  afterEl.className = 'size-after ' + (after < before ? 'smaller' : 'larger');
  redEl.style.display = '';
  redEl.className = 'reduction' + (diff >= 0 ? '' : ' up');
  redEl.textContent = diff >= 0 ? `-${diff}%` : `+${Math.abs(diff)}%`;
}

export function updateUI() {
  const tab = state.activeTab;
  const activeItems = state.items.filter((i) => i.tab === tab);
  const hasItems = activeItems.length > 0;

  document.getElementById('settings-image').style.display = tab === 'image' ? '' : 'none';
  document.getElementById('settings-anim').style.display = tab === 'anim' ? '' : 'none';
  document.getElementById('settings-panel').classList.toggle('visible', hasItems);
  document.getElementById('bottom-bar').classList.toggle('visible', hasItems);
  document.getElementById(`empty-tip-${tab}`).style.display = !hasItems ? 'block' : 'none';
  updateBottomBar();
}

export function updateBottomBar() {
  const tab = state.activeTab;
  const activeItems = state.items.filter((i) => i.tab === tab);
  document.getElementById('bar-count').textContent = activeItems.length;
  document.getElementById('bar-done').textContent = activeItems.filter((i) => i.status === 'done').length;
}
