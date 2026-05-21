import { useEffect, useMemo, useRef, useState } from 'react'
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
  const [openUpward, setOpenUpward] = useState(false)

  const dropdownRef = useRef(null)
  const buttonRef = useRef(null)
  const searchInputRef = useRef(null)

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

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect =
        buttonRef.current.getBoundingClientRect()

      const dropdownHeight = 260
      const spaceBelow =
        window.innerHeight - rect.bottom

      setOpenUpward(spaceBelow < dropdownHeight)
    }
  }, [open])

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener(
      'click',
      handleClickOutside,
    )

    return () => {
      document.removeEventListener(
        'click',
        handleClickOutside,
      )
    }
  }, [])

  // Mobile autofocus fix
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        searchInputRef.current?.focus()
      })
    }
  }, [open])

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
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          const next = !open
          setOpen(next)

          // Direct mobile focus trigger
          if (!open) {
            setTimeout(() => {
              searchInputRef.current?.focus()
            }, 50)
          }
        }}
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

        <IconChevronDown size={16} color="gray" />
      </button>

      {open && (
        <div
          className={`absolute z-50 w-full rounded-lg border border-slate-400 bg-white shadow-xl ${
            openUpward
              ? 'bottom-full mb-2'
              : 'top-full mt-2'
          }`}
        >
          <div className="border-b border-gray-400 p-2">
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              autoComplete="off"
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-slate-400 bg-white px-3 py-2 text-sm text-[#172742] outline-none"
            />
          </div>

          <div
            className="max-h-60 overflow-y-auto p-1"
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y',
              overscrollBehavior: 'contain',
            }}
          >
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