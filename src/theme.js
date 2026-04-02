const STORAGE_KEY = 'image-converter-theme';

export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved ?? (prefersDark ? 'dark' : 'light');
  applyTheme(theme);
  return theme;
}

export function toggleTheme() {
  const current = document.documentElement.dataset.theme ?? 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem(STORAGE_KEY, next);
  return next;
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}
