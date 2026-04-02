import { state } from '../state.js';
import { setStatus, updateSizeInfo, updateBottomBar } from '../ui/status.js';

export async function convertImage(item) {
  setStatus(item, 'loading');
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (state.image.selectedFmt === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setStatus(item, 'error');
            resolve();
            return;
          }
          item.blob = blob;
          item.outputFmt = state.image.selectedFmt;
          setStatus(item, 'done');
          updateSizeInfo(item);
          updateBottomBar();
          resolve();
        },
        state.image.selectedFmt,
        state.image.quality,
      );
    };
    img.onerror = () => {
      setStatus(item, 'error');
      resolve();
    };
    img.src = item.objectUrl;
  });
}
