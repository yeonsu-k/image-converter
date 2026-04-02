import { state } from '../state.js';

export function fmtSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

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

  document.getElementById('settings-panel').classList.toggle('visible', hasItems);
  document.getElementById('bottom-bar').classList.toggle('visible', hasItems);
  document.getElementById(`empty-tip-${tab}`).style.display = !hasItems ? 'block' : 'none';

  const hasGif = state.items.some((i) => i.tab === 'anim');
  document.getElementById('loop-group').style.display = hasGif ? '' : 'none';

  updateBottomBar();
}

export function updateBottomBar() {
  const tab = state.activeTab;
  const activeItems = state.items.filter((i) => i.tab === tab);
  document.getElementById('bar-count').textContent = activeItems.length;
  document.getElementById('bar-done').textContent = activeItems.filter((i) => i.status === 'done').length;
}
