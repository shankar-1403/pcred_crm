import { useMemo, useState } from 'react'
import { push, ref, remove, set } from 'firebase/database'
import { useAuth } from '../context/AuthContext'
import { useCategory } from '../hooks/useCategory'
import { ROLES, ROLE_LABELS } from '../constants'
import { db } from '../lib/firebase'
import TablePagination from '../components/TablePagination'
import { usePagination } from '../hooks/usePagination'

export default function AdminCategory() {
  const { user, profile } = useAuth()
  const { category, loading, error } = useCategory()

  const isAdmin = String(profile?.role ?? '').trim().toLowerCase() === ROLES.ADMIN

  const [categoryName, setCategoryName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState('')
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState('')

  const categoryTable = useMemo(() => category ?? [], [category])

  const {
    page: tablePage,
    setPage: setTablePage,
    pageSize: tablePageSize,
    setPageSize: setTablePageSize,
    total: tableTotal,
    totalPages: tableTotalPages,
    pageItems: tablePageItems,
  } = usePagination(categoryTable)

  async function handleCreate(e) {
    e.preventDefault()
    setMessage('')
    setFormError('')

    if (!user) {
      setFormError('You must be logged in.')
      return
    }
    if (!isAdmin) {
      setFormError(
        `Current role is "${profile?.role ?? 'missing'}". Set users/${user.uid}/role to "admin" and sign out/in.`,
      )
      return
    }

    const name = categoryName.trim()
    if (!name) {
      setFormError('Category is required.')
      return
    }

    setSubmitting(true)
    try {
      const newRef = push(ref(db, 'category'))
      await set(newRef, {
        name,
        createdAt: Date.now(),
        createdByAdminUid: user.uid,
      })
      setCategoryName('')
      setMessage('Category added.')
    } catch (err) {
      setFormError(err?.message ?? 'Could not add category.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(categoryId, categoryLabel) {
    setMessage('')
    setFormError('')
    if (!isAdmin) {
      setFormError('Only admin can delete categories.')
      return
    }
    const ok = window.confirm(
      `Delete category "${categoryLabel || categoryId}"? This cannot be undone.`,
    )
    if (!ok) return

    setDeletingCategoryId(categoryId)
    try {
      await remove(ref(db, `category/${categoryId}`))
      setMessage('Category deleted.')
    } catch (err) {
      setFormError(err?.message ?? 'Could not delete category.')
    } finally {
      setDeletingCategoryId('')
    }
  }

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Category master</h1>
        <p className="mt-1 text-sm text-slate-400">
          Admin adds category here
        </p>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm">
        <p className="text-slate-400">
          Current UID:{' '}
          <code className="font-mono text-blue-300">{user?.uid || '—'}</code>
        </p>
        <p className="mt-1 text-slate-400">
          Current role:{' '}
          <code className="text-blue-300">{profile?.role || 'missing'}</code>
        </p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <h2 className="text-lg font-medium text-white">Add category</h2>

        <form onSubmit={handleCreate} className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300">
              Category name
            </label>
            <input
              type="text"
              required
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Credit Ratings"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              disabled={!isAdmin || submitting}
            />
          </div>

          <div className="md:col-span-2 flex flex-wrap items-center justify-end gap-3">
            {formError && (
              <p className="text-sm text-red-300">{formError}</p>
            )}
            {message && (
              <p className="text-sm text-emerald-300">{message}</p>
            )}
            <button
              type="submit"
              disabled={!isAdmin || submitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add category'}
            </button>
          </div>
        </form>
      </section>

      <section className="max-w-full min-w-0 rounded-xl border border-slate-800 bg-slate-900/40 [-webkit-overflow-scrolling:touch]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-180 table-auto text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Category</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">UID</th>
                <th className="px-4 py-3 font-medium text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                    Loading categories...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                    Could not read categories.
                  </td>
                </tr>
              ) : categoryTable.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                    No categories yet.
                  </td>
                </tr>
              ) : (
                tablePageItems.map((c) => (
                  <tr key={c.id} className="text-slate-300">
                    <td className="px-4 py-3 text-white">
                      {c.name || '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {c.id}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id, c.name)}
                        disabled={!isAdmin || deletingCategoryId === c.id}
                        className="rounded-lg border border-red-800/60 px-3 py-1 text-xs text-red-300 hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingCategoryId === c.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && !error && categoryTable.length > 0 ? (
          <TablePagination
            page={tablePage}
            totalPages={tableTotalPages}
            totalItems={tableTotal}
            pageSize={tablePageSize}
            onPageChange={setTablePage}
            onPageSizeChange={setTablePageSize}
          />
        ) : null}
      </section>
    </div>
  )
}