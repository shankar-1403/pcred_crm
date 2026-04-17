const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

/**
 * Footer bar for data tables: range text, page size, prev/next.
 */
export default function TablePagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className = '',
}) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  return (
    <div
      className={[
        'flex flex-col gap-3 border-t border-slate-800 bg-slate-900/60 px-3 py-3 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <p className="tabular-nums">
        Showing{' '}
        <span className="font-medium text-slate-200">{start}</span>
        {'–'}
        <span className="font-medium text-slate-200">{end}</span>
        {' of '}
        <span className="font-medium text-slate-200">{totalItems}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {onPageSizeChange ? (
          <label className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="text-slate-500">Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-lg border border-slate-600 bg-slate-950 px-2 py-1.5 text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
          >
            Previous
          </button>
          <span className="min-w-[7rem] px-2 text-center text-xs tabular-nums text-slate-300 sm:text-sm">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
