export const state = {
  activeTab: 'image',
  items: [],
  nextId: 0,
  image: {
    selectedFmt: 'image/jpeg',
    quality: 0.85,
  },
  anim: {
    selectedFmt: 'image/gif',
    quality: 0.85,
    loop: true,
  },
};

export const extMap = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/webm': 'webm',
  'image/gif': 'gif',
  'image/apng': 'apng',
};
