import JSZip from 'jszip';
import { state, extMap } from './state.js';

export function downloadSingle(item) {
  if (!item.blob) return;
  const ext = extMap[item.outputFmt] || 'jpg';
  const base = item.file.name.replace(/\.[^.]+$/, '');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(item.blob);
  a.download = `${base}.${ext}`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function downloadZip() {
  const done = state.items.filter((i) => i.status === 'done' && i.blob);
  if (done.length === 0) {
    alert('변환된 이미지가 없습니다. 먼저 변환을 실행하세요.');
    return;
  }
  const btn = document.getElementById('download-zip-btn');
  btn.textContent = '압축 중…';
  btn.disabled = true;
  const zip = new JSZip();
  done.forEach((item) => {
    const ext = extMap[item.outputFmt] || 'jpg';
    const base = item.file.name.replace(/\.[^.]+$/, '');
    zip.file(`${base}.${ext}`, item.blob);
  });
  const content = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(content);
  a.download = 'converted_images.zip';
  a.click();
  URL.revokeObjectURL(a.href);
  btn.textContent = 'ZIP으로 모두 다운로드';
  btn.disabled = false;
}
