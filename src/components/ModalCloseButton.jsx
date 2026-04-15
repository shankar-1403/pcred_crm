import { IconX } from '@tabler/icons-react'

export default function ModalCloseButton({ onClick, ariaLabel = 'Close' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
      aria-label={ariaLabel}
    >
      <IconX size={22} stroke={1.5} />
    </button>
  )
}
