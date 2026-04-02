import { GifReader } from 'omggif';
import { state } from '../state.js';
import { setStatus, updateSizeInfo, updateBottomBar } from '../ui/status.js';

function extractWebpFrameData(bytes) {
  if (bytes.length < 20) return null;
  const tag = (s) => String.fromCharCode(bytes[s], bytes[s + 1], bytes[s + 2], bytes[s + 3]);
  if (tag(0) !== 'RIFF' || tag(8) !== 'WEBP') return null;
  const view = new DataView(bytes.buffer);
  const firstChunk = tag(12);

  if (firstChunk === 'VP8 ' || firstChunk === 'VP8L') {
    const size = view.getUint32(16, true);
    return bytes.slice(12, 20 + size + (size % 2));
  } else if (firstChunk === 'VP8X') {
    const vp8xSize = view.getUint32(16, true);
    let offset = 20 + vp8xSize + (vp8xSize % 2);
    const parts = [];
    while (offset + 8 <= bytes.length) {
      const cid = tag(offset);
      const csz = view.getUint32(offset + 4, true);
      const padded = csz + (csz % 2);
      if (cid === 'ALPH' || cid === 'VP8 ' || cid === 'VP8L') {
        parts.push(bytes.slice(offset, offset + 8 + padded));
      }
      offset += 8 + padded;
      if (cid === 'VP8 ' || cid === 'VP8L') break;
    }
    if (parts.length === 0) return null;
    const total = parts.reduce((s, p) => s + p.length, 0);
    const out = new Uint8Array(total);
    let pos = 0;
    for (const p of parts) {
      out.set(p, pos);
      pos += p.length;
    }
    return out;
  }
  return null;
}

function buildAnimatedWebp(width, height, frames, loopCount) {
  const u32 = (n) => new Uint8Array([(n >>> 0) & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff]);
  const u24 = (n) => new Uint8Array([n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff]);
  const cat = (arrs) => {
    const t = arrs.reduce((s, a) => s + a.length, 0);
    const o = new Uint8Array(t);
    let p = 0;
    for (const a of arrs) { o.set(a, p); p += a.length; }
    return o;
  };
  const fc = (s) => new Uint8Array([s.charCodeAt(0), s.charCodeAt(1), s.charCodeAt(2), s.charCodeAt(3)]);
  const ck = (id, data) => {
    const pad = data.length % 2 ? new Uint8Array([0]) : new Uint8Array(0);
    return cat([fc(id), u32(data.length), data, pad]);
  };

  const vp8x = ck('VP8X', cat([new Uint8Array([0x12, 0, 0, 0]), u24(width - 1), u24(height - 1)]));
  // ANIM: background=transparent, loop count (0=무한, 1=1회)
  const anim = ck('ANIM', new Uint8Array([0, 0, 0, 0, loopCount & 0xff, (loopCount >> 8) & 0xff]));
  const anmfs = frames.map(({ frameData, delay }) =>
    ck('ANMF', cat([
      u24(0), u24(0),
      u24(width - 1), u24(height - 1),
      u24(delay),
      new Uint8Array([0x02]),
      frameData,
    ]))
  );
  const body = cat([vp8x, anim, ...anmfs]);
  return cat([fc('RIFF'), u32(4 + body.length), fc('WEBP'), body]);
}

export async function convertGifToAnimatedWebp(item) {
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
    const gifFrames = [];

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
      gifFrames.push({
        delay: Math.max((info.delay || 10) * 10, 20),
        imageData: compCtx.getImageData(0, 0, w, h),
      });
      if (info.disposal === 2) compCtx.clearRect(0, 0, w, h);
      else if (info.disposal === 3 && prev) compCtx.putImageData(prev, 0, 0);
    }

    const fCanvas = document.createElement('canvas');
    fCanvas.width = w;
    fCanvas.height = h;
    const fCtx = fCanvas.getContext('2d');
    const webpFrames = [];
    for (const frame of gifFrames) {
      fCtx.putImageData(frame.imageData, 0, 0);
      const blob = await new Promise((res) => fCanvas.toBlob(res, 'image/webp', state.anim.quality));
      const frameData = extractWebpFrameData(new Uint8Array(await blob.arrayBuffer()));
      if (!frameData) {
        setStatus(item, 'error');
        resolve();
        return;
      }
      webpFrames.push({ frameData, delay: frame.delay });
    }

    const loopCount = state.anim.loop ? 0 : 1;
    item.blob = new Blob([buildAnimatedWebp(w, h, webpFrames, loopCount)], { type: 'image/webp' });
    item.outputFmt = 'image/webp';
    item.loop = state.anim.loop;
    setStatus(item, 'done');
    updateSizeInfo(item);
    updateBottomBar();
    resolve();
  });
}
