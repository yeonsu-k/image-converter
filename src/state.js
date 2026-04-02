export const state = {
  activeTab: 'image',
  items: [],   // 각 item에 tab: 'image' | 'anim' 프로퍼티 포함
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
