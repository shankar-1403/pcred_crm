import { useMemo, useState } from 'react'
import { push, ref, remove, set } from 'firebase/database'
import { useAuth } from '../../context/AuthContext'
import { useBanks } from '../../hooks/useBanks'
import { ROLES, ROLE_LABELS } from '../../constants'
import { db } from '../../lib/firebase'
import TablePagination from '../../components/TablePagination'
import { usePagination } from '../../hooks/usePagination'

function AdminBank() {
  const { user, profile } = useAuth()
  const { banks, loading, error } = useBanks()

  const isAdmin = String(profile?.role ?? '').trim().toLowerCase() === ROLES.ADMIN

  const [bankName, setBankName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingBankId, setDeletingBankId] = useState('')
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState('')

  const banksTable = useMemo(() => banks ?? [], [banks])

  const {
    page: tablePage,
    setPage: setTablePage,
    pageSize: tablePageSize,
    setPageSize: setTablePageSize,
    total: tableTotal,
    totalPages: tableTotalPages,
    pageItems: tablePageItems,
  } = usePagination(banksTable)

  async function handleCreate(e) {
    e.preventDefault()
    setMessage('')
    setFormError('')

    if (!user) {
      setFormError('You must be logged in.')
      return
    }

    const name = bankName.trim()
    if (!name) {
      setFormError('Bank name is required.')
      return
    }

    setSubmitting(true)
    try {
      const newRef = push(ref(db, 'banks'))
      await set(newRef, {
        name,
        createdAt: Date.now(),
        createdByAdminUid: user.uid,
      })
      setBankName('')
      setMessage('Bank added.')
    } catch (err) {
      setFormError(err?.message ?? 'Could not add bank.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(bankId, bankLabel) {
    setMessage('')
    setFormError('')
    if (!isAdmin) {
      setFormError('Only admin can delete banks.')
      return
    }
    const ok = window.confirm(
      `Delete bank "${bankLabel || bankId}"? This cannot be undone.`,
    )
    if (!ok) return

    setDeletingBankId(bankId)
    try {
      await remove(ref(db, `banks/${bankId}`))
      setMessage('Bank deleted.')
    } catch (err) {
      setFormError(err?.message ?? 'Could not delete bank.')
    } finally {
      setDeletingBankId('')
    }
  }

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Bank master</h1>
        <p className="mt-1 text-sm text-slate-400">
          Admin adds banks here.
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
        <h2 className="text-lg font-medium text-white">Add Bank</h2>

        <form onSubmit={handleCreate} className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300">
              Bank name
            </label>
            <input
              type="text"
              required
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. ICICI Bank"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              disabled={submitting}
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
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add bank'}
            </button>
          </div>
        </form>
      </section>

      <section className="max-w-full min-w-0 rounded-xl border border-slate-800 bg-slate-900/40 [-webkit-overflow-scrolling:touch]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] table-auto text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Bank</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">UID</th>
                <th className="px-4 py-3 font-medium text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                    Loading banks...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                    Could not read banks.
                  </td>
                </tr>
              ) : banksTable.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                    No banks yet.
                  </td>
                </tr>
              ) : (
                tablePageItems.map((p) => (
                  <tr key={p.id} className="text-slate-300">
                    <td className="px-4 py-3 text-white">
                      {p.name || '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {p.id}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id, p.name)}
                        disabled={!isAdmin || deletingBankId === p.id}
                        className="rounded-lg border border-red-800/60 px-3 py-1 text-xs text-red-300 hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingBankId === p.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && !error && banksTable.length > 0 ? (
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

export default AdminBank