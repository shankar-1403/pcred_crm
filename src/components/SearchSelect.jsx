import { useMemo, useRef, useState } from 'react'
import { IconChevronDown } from '@tabler/icons-react'

function normalize(text) {
  return String(text ?? '').trim().toLowerCase()
}

export default function SearchableDropdown({
  options = [],
  value,
  handleChange,
  placeholder = '-- Select --',
  searchPlaceholder = 'Search...',
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef(null)

  const filteredOptions = useMemo(() => {
    const q = normalize(search)

    if (!q) return options

    return options.filter((option) =>
      normalize(option.label).includes(q),
    )
  }, [options, search])

  const selectedOption = options.find(
    (option) => option.value === value,
  )

  function onSelect(optionValue) {
    handleChange({
      target: {
        value: optionValue,
      },
    })

    setOpen(false)
    setSearch('')
  }

  return (
    <div
      className={`relative ${className}`}
      ref={dropdownRef}
      onBlur={(e) => {
        if (!dropdownRef.current?.contains(e.relatedTarget)) {
          setOpen(false)
        }
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="mt-1 flex w-full items-center justify-between rounded-lg border border-gray-400 bg-white px-3 py-2 text-white"
      >
        <span
          className={
            selectedOption
              ? 'text-[#172742]'
              : 'text-slate-500'
          }
        >
          {selectedOption?.label || placeholder}
        </span>

        <IconChevronDown size={16} color='gray'/>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-slate-400 bg-white shadow-xl">
          <div className="border-b border-gray-400 p-2">
            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-slate-400 bg-white px-3 py-2 text-sm text-[#172742] outline-none"
            />
          </div>

          <div className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-400">
                No results found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    onSelect(option.value)
                  }
                  className={`flex w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#172742] hover:text-white ${
                    value === option.value
                      ? 'bg-white text-[#172742]'
                      : 'text-[#172742]'
                  }`}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}