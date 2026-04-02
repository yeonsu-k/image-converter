import { GifReader } from 'omggif';
import { setStatus, updateSizeInfo, updateBottomBar } from '../ui/status.js';

export async function convertGifToWebm(item) {
  setStatus(item, 'loading');
  return new Promise(async (resolve) => {
    if (!window.MediaRecorder) {
      setStatus(item, 'error');
      resolve();
      return;
    }

    let gr;
    try {
      const buffer = await item.file.arrayBuffer();
      gr = new GifReader(new Uint8Array(buffer));
    } catch (e) {
      setStatus(item, 'error');
      resolve();
      return;
    }

    const numFrames = gr.numFrames();
    const w = gr.width;
    const h = gr.height;

    // 각 프레임을 합성하여 스냅샷 배열 생성
    const compCanvas = document.createElement('canvas');
    compCanvas.width = w;
    compCanvas.height = h;
    const compCtx = compCanvas.getContext('2d');
    const frames = [];

    for (let i = 0; i < numFrames; i++) {
      const info = gr.frameInfo(i);
      const pixels = new Uint8ClampedArray(w * h * 4);
      gr.decodeAndBlitFrameRGBA(i, pixels);

      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = w;
      tmpCanvas.height = h;
      tmpCanvas.getContext('2d').putImageData(new ImageData(pixels, w, h), 0, 0);

      const prevData = info.disposal === 3 ? compCtx.getImageData(0, 0, w, h) : null;
      compCtx.drawImage(tmpCanvas, 0, 0);
      frames.push({
        delay: Math.max((info.delay || 10) * 10, 20),
        imageData: compCtx.getImageData(0, 0, w, h),
      });
      if (info.disposal === 2) compCtx.clearRect(0, 0, w, h);
      else if (info.disposal === 3 && prevData) compCtx.putImageData(prevData, 0, 0);
    }

    // 추출한 프레임을 순서대로 canvas에 그리며 MediaRecorder로 녹화
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

    let stream, recorder;
    try {
      stream = canvas.captureStream(30);
      recorder = new MediaRecorder(stream, { mimeType });
    } catch (e) {
      setStatus(item, 'error');
      resolve();
      return;
    }

    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      item.blob = new Blob(chunks, { type: 'video/webm' });
      item.outputFmt = 'video/webm';
      setStatus(item, 'done');
      updateSizeInfo(item);
      updateBottomBar();
      resolve();
    };

    recorder.start();
    let fi = 0;
    function next() {
      if (fi >= frames.length) {
        recorder.stop();
        return;
      }
      const f = frames[fi++];
      ctx.putImageData(f.imageData, 0, 0);
      setTimeout(next, f.delay);
    }
    next();
  });
}
