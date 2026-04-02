import UPNG from 'upng-js';
import { GifReader } from 'omggif';
import { state } from '../state.js';
import { setStatus, updateSizeInfo, updateBottomBar } from '../ui/status.js';

// CRC32 (APNG acTL 청크 재계산용)
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ byte) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

// APNG의 acTL 청크에서 num_plays 값 수정
function setApngNumPlays(buffer, numPlays) {
  const u8 = new Uint8Array(buffer.slice(0));
  const view = new DataView(u8.buffer);
  let offset = 8; // PNG 시그니처(8바이트) 다음부터 탐색
  while (offset < u8.length - 12) {
    const len = view.getUint32(offset, false);
    const type = String.fromCharCode(u8[offset + 4], u8[offset + 5], u8[offset + 6], u8[offset + 7]);
    if (type === 'acTL') {
      // acTL 데이터: num_frames(4) + num_plays(4)
      view.setUint32(offset + 8 + 4, numPlays, false);
      // CRC32 재계산: type(4) + data(len) 영역
      const crcInput = u8.slice(offset + 4, offset + 4 + 4 + len);
      view.setUint32(offset + 4 + 4 + len, crc32(crcInput), false);
      break;
    }
    offset += 12 + len; // 4(len) + 4(type) + len(data) + 4(crc)
  }
  return u8;
}

export async function convertGifToApng(item) {
  setStatus(item, 'loading');
  return new Promise(async (resolve) => {
    let gr;
    try {
      gr = new GifReader(new Uint8Array(await item.file.arrayBuffer()));
    } catch (e) {
      setStatus(item, 'error');
      resolve();
      return;
    }

    const w = gr.width;
    const h = gr.height;
    const compCanvas = document.createElement('canvas');
    compCanvas.width = w;
    compCanvas.height = h;
    const compCtx = compCanvas.getContext('2d');
    const rgbaFrames = [];
    const delays = [];

    for (let i = 0; i < gr.numFrames(); i++) {
      const info = gr.frameInfo(i);
      const pixels = new Uint8ClampedArray(w * h * 4);
      gr.decodeAndBlitFrameRGBA(i, pixels);
      const tmp = document.createElement('canvas');
      tmp.width = w;
      tmp.height = h;
      tmp.getContext('2d').putImageData(new ImageData(pixels, w, h), 0, 0);
      const prev = info.disposal === 3 ? compCtx.getImageData(0, 0, w, h) : null;
      compCtx.drawImage(tmp, 0, 0);
      rgbaFrames.push(compCtx.getImageData(0, 0, w, h).data.buffer);
      delays.push(Math.max((info.delay || 10) * 10, 20));
      if (info.disposal === 2) compCtx.clearRect(0, 0, w, h);
      else if (info.disposal === 3 && prev) compCtx.putImageData(prev, 0, 0);
    }

    const encoded = UPNG.encode(rgbaFrames, w, h, 0, delays);
    const numPlays = state.loop ? 0 : 1; // 0 = 무한루프, 1 = 1회 재생
    const result = setApngNumPlays(encoded, numPlays);

    item.blob = new Blob([result], { type: 'image/apng' });
    item.outputFmt = 'image/apng';
    setStatus(item, 'done');
    updateSizeInfo(item);
    updateBottomBar();
    resolve();
  });
}
