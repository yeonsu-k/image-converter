export const state = {
  items: [],
  nextId: 0,
  selectedFmt: 'image/jpeg',
  quality: 0.85,
  loop: true,
};

export const extMap = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/webm': 'webm',
  'image/gif': 'gif',
  'image/apng': 'apng',
};
