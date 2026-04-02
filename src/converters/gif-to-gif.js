import { state } from '../state.js';
import { setStatus, updateSizeInfo, updateBottomBar } from '../ui/status.js';

// "NETSCAPE2.0" in bytes
const NETSCAPE_MARKER = new Uint8Array([
  0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2e, 0x30,
]);

function findNetscapeBlock(bytes) {
  for (let i = 6; i < bytes.length - 19; i++) {
    if (bytes[i] === 0x21 && bytes[i + 1] === 0xff && bytes[i + 2] === 0x0b) {
      let match = true;
      for (let j = 0; j < 11; j++) {
        if (bytes[i + 3 + j] !== NETSCAPE_MARKER[j]) {
          match = false;
          break;
        }
      }
      if (match) return i;
    }
  }
  return -1;
}

function getGifHeaderSize(bytes) {
  // 6 bytes (signature) + 7 bytes (logical screen descriptor)
  const hasGCT = (bytes[10] >> 7) & 1;
  if (!hasGCT) return 13;
  const n = bytes[10] & 0x07;
  return 13 + 3 * (1 << (n + 1));
}

function modifyGifLoop(bytes, loopCount) {
  const copy = bytes.slice();
  const idx = findNetscapeBlock(copy);

  if (idx !== -1) {
    // Netscape 블록 존재 → 루프 카운트 바이트만 교체
    copy[idx + 16] = loopCount & 0xff;
    copy[idx + 17] = (loopCount >> 8) & 0xff;
    return copy;
  }

  // Netscape 블록 없음 → 헤더 직후에 삽입
  const headerEnd = getGifHeaderSize(copy);
  const block = new Uint8Array([
    0x21, 0xff, 0x0b,
    0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2e, 0x30, // NETSCAPE2.0
    0x03, 0x01,
    loopCount & 0xff, (loopCount >> 8) & 0xff,
    0x00,
  ]);
  const result = new Uint8Array(copy.length + block.length);
  result.set(copy.slice(0, headerEnd));
  result.set(block, headerEnd);
  result.set(copy.slice(headerEnd), headerEnd + block.length);
  return result;
}

export async function convertGifToGif(item) {
  setStatus(item, 'loading');
  try {
    const buffer = await item.file.arrayBuffer();
    const loopCount = state.loop ? 0 : 1; // 0 = 무한루프, 1 = 1회 재생
    const result = modifyGifLoop(new Uint8Array(buffer), loopCount);
    item.blob = new Blob([result], { type: 'image/gif' });
    item.outputFmt = 'image/gif';
    setStatus(item, 'done');
    updateSizeInfo(item);
    updateBottomBar();
  } catch (e) {
    setStatus(item, 'error');
  }
}
