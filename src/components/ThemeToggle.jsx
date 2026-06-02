import { IconMoon, IconSun } from '@tabler/icons-react'
import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      onClick={toggleTheme}
      className={[
        'theme-toggle relative box-border inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border p-0.5 transition-colors',
        isDark
          ? 'border-slate-600 bg-slate-800'
          : 'border-slate-300 bg-slate-200',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0.5 grid grid-cols-2 items-center justify-items-center"
      >
        <IconSun
          size={14}
          stroke={2}
          className={isDark ? 'text-slate-500' : 'text-amber-600/70'}
        />
        <IconMoon
          size={14}
          stroke={2}
          className={isDark ? 'text-slate-300/80' : 'text-slate-400'}
        />
      </span>

      <span
        aria-hidden
        className={[
          'absolute top-1/2 z-[1] flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full shadow-sm transition-[left] duration-200 ease-out',
          isDark
            ? 'left-[calc(100%-0.125rem-1.5rem)] bg-slate-700 text-amber-300'
            : 'left-0.5 bg-white text-amber-500',
        ].join(' ')}
      >
        {isDark ? <IconMoon size={14} stroke={2} /> : <IconSun size={14} stroke={2} />}
      </span>
    </button>
  )
}
