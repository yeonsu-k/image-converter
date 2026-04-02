import { state } from '../state.js';
import { setStatus } from '../ui/status.js';
import { convertGifToWebm } from './gif-to-webm.js';
import { convertGifToAnimatedWebp } from './gif-to-webp.js';
import { convertImage } from './image.js';

export async function convertItem(item) {
  if (state.selectedFmt === 'video/webm') {
    if (item.file.type !== 'image/gif') {
      setStatus(item, 'error');
      const badge = document.getElementById('badge-' + item.id);
      if (badge) {
        badge.title = 'GIF 파일만 WebM으로 변환할 수 있습니다';
        badge.textContent = 'GIF만 가능';
      }
      return;
    }
    return convertGifToWebm(item);
  }
  if (state.selectedFmt === 'image/webp' && item.file.type === 'image/gif') {
    return convertGifToAnimatedWebp(item);
  }
  return convertImage(item);
}

export async function convertAll() {
  for (const item of state.items) {
    await convertItem(item);
  }
}
