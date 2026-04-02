import { state } from '../state.js';
import { fmtSize, updateUI } from './status.js';
import { downloadSingle } from '../download.js';

export function renderCard(item) {
  const grid = document.getElementById(`grid-${item.tab}`);
  const card = document.createElement('div');
  card.className = 'img-card';
  card.id = 'card-' + item.id;
  card.innerHTML = `
    <button class="remove-btn" data-id="${item.id}" title="제거">✕</button>
    <div class="thumb-wrap">
      <img id="thumb-${item.id}" alt="" />
    </div>
    <div class="card-body">
      <div class="filename" title="${item.file.name}">${item.file.name}</div>
      <div class="size-row">
        <span id="size-before-${item.id}">${fmtSize(item.file.size)}</span>
        <span class="size-arrow">→</span>
        <span class="size-after" id="size-after-${item.id}">—</span>
        <span class="reduction" id="reduction-${item.id}" style="display:none"></span>
      </div>
    </div>
    <div class="card-footer">
      <span class="status-badge waiting" id="badge-${item.id}">대기 중</span>
      <button class="dl-btn" id="dl-${item.id}">다운로드</button>
    </div>
  `;
  grid.appendChild(card);

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = document.getElementById('thumb-' + item.id);
    if (img) img.src = e.target.result;
    item.objectUrl = e.target.result;
  };
  reader.readAsDataURL(item.file);

  card.querySelector('.dl-btn').addEventListener('click', () => downloadSingle(item));
  card.querySelector('.remove-btn').addEventListener('click', () => removeItem(item.id));
}

export function removeItem(id) {
  const idx = state.items.findIndex(i => i.id === id);
  if (idx !== -1) state.items.splice(idx, 1);
  const card = document.getElementById('card-' + id);
  if (card) card.remove();
  updateUI();
}
