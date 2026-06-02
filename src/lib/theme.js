export const THEME_KEY = 'crm_theme'

export function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark'
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('theme-light', theme === 'light')
  document.documentElement.classList.toggle('theme-dark', theme === 'dark')
}
