import { state } from '../state.js';
import { setStatus } from '../ui/status.js';
import { convertGifToWebm } from './gif-to-webm.js';
import { convertGifToAnimatedWebp } from './gif-to-webp.js';
import { convertGifToGif } from './gif-to-gif.js';
import { convertGifToApng } from './gif-to-apng.js';
import { convertImage } from './image.js';

const GIF_ONLY_FMTS = new Set(['video/webm', 'image/gif', 'image/apng']);

function setGifOnlyError(item) {
  setStatus(item, 'error');
  const badge = document.getElementById('badge-' + item.id);
  if (badge) {
    badge.title = 'GIF 파일만 변환할 수 있습니다';
    badge.textContent = 'GIF만 가능';
  }
}

export async function convertItem(item) {
  const fmt = state[state.activeTab].selectedFmt;
  if (GIF_ONLY_FMTS.has(fmt) && item.file.type !== 'image/gif') {
    setGifOnlyError(item);
    return;
  }

  switch (fmt) {
    case 'video/webm':
      return convertGifToWebm(item);
    case 'image/gif':
      return convertGifToGif(item);
    case 'image/apng':
      return convertGifToApng(item);
    case 'image/webp':
      if (item.file.type === 'image/gif') return convertGifToAnimatedWebp(item);
      return convertImage(item);
    default:
      return convertImage(item);
  }
}

export async function convertAll() {
  const activeItems = state.items.filter((i) => i.tab === state.activeTab);
  for (const item of activeItems) {
    await convertItem(item);
  }
}
