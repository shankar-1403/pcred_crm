import { useEffect, useMemo, useState } from 'react'

const DEFAULT_PAGE_SIZE = 10

/**
 * @param {unknown[]} items Full list to paginate (already filtered/sorted).
 * @param {number} [initialPageSize]
 */
export function usePagination(items, initialPageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(initialPageSize)

  const total = items?.length ?? 0
  const totalPages = useMemo(() => {
    if (total <= 0) return 1
    return Math.max(1, Math.ceil(total / pageSize))
  }, [total, pageSize])

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages))
  }, [totalPages])

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return (items ?? []).slice(start, start + pageSize)
  }, [items, page, pageSize])

  function setPageSize(next) {
    const n = Number(next)
    if (!Number.isFinite(n) || n < 1) return
    setPageSizeState(n)
    setPage(1)
  }

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    total,
    totalPages,
    pageItems,
  }
}
