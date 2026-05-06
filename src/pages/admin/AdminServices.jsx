import { useMemo, useState } from 'react'
import { push, ref, remove, set } from 'firebase/database'
import { useAuth } from '../../context/AuthContext'
import { useServices } from '../../hooks/useServices'
import { ROLES, ROLE_LABELS } from '../../constants'
import { db } from '../../lib/firebase'
import TablePagination from '../../components/TablePagination'
import { usePagination } from '../../hooks/usePagination'
import { useCategory } from '../../hooks/useCategory'

export default function AdminServices() {
    const { user, profile } = useAuth()
    const { services, loading, error } = useServices()
    const {category} = useCategory();
    const isAdmin = String(profile?.role ?? '').trim().toLowerCase() === ROLES.ADMIN

    const [serviceName, setServiceName] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [deletingCategoryId, setDeletingServiceId] = useState('')
    const [message, setMessage] = useState('')
    const [formError, setFormError] = useState('')

    const serviceTable = useMemo(() => services ?? [], [services])

    function categoryName(id) {
        const categoryData = category.find((data)=> data.id === id)
        return categoryData?.name; 
    }

    const {
        page: tablePage,
        setPage: setTablePage,
        pageSize: tablePageSize,
        setPageSize: setTablePageSize,
        total: tableTotal,
        totalPages: tableTotalPages,
        pageItems: tablePageItems,
    } = usePagination(serviceTable)

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

        const name = serviceName.trim()
        const category = categoryId
        if (!name) {
            setFormError('Service is required.')
            return
        }

        setSubmitting(true)
        try {
        const newRef = push(ref(db, 'services'))
        await set(newRef, {
            name,
            category,
            createdAt: Date.now(),
            createdByAdminUid: user.uid,
        })
        setServiceName('')
        setCategoryId('')
        setMessage('Service added.')
        } catch (err) {
        setFormError(err?.message ?? 'Could not add service.')
        } finally {
        setSubmitting(false)
        }
    }

    async function handleDelete(serviceId, serviceLabel) {
        setMessage('')
        setFormError('')
        if (!isAdmin) {
        setFormError('Only admin can delete services.')
        return
        }
        const ok = window.confirm(
        `Delete service "${serviceLabel || serviceId}"? This cannot be undone.`,
        )
        if (!ok) return

        setDeletingServiceId(serviceId)
        try {
        await remove(ref(db, `services/${serviceId}`))
        setMessage('Service deleted.')
        } catch (err) {
        setFormError(err?.message ?? 'Could not delete category.')
        } finally {
        setDeletingServiceId('')
        }
    }

  return (
    <div className="min-w-0 space-y-6">
        <div>
            <h1 className="text-2xl font-semibold text-white">Service master</h1>
            <p className="mt-1 text-sm text-slate-400">
            Admin adds service here
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
            <h2 className="text-lg font-medium text-white">Add Service</h2>

            <form onSubmit={handleCreate} className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="min-w-0">
                    <label className="block text-sm font-medium text-slate-300">Service name</label>
                    <input
                        type="text"
                        required
                        value={serviceName}
                        onChange={(e) => setServiceName(e.target.value)}
                        placeholder="e.g. Business Credit Rating"
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                        disabled={!isAdmin || submitting}
                    />
                </div>

                <div className="min-w-0">
                    <label className="block text-sm font-medium text-slate-300">Category</label>
                    <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                    >
                    <option value="">-- select --</option>
                        {category.map((u) => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>
                </div>

                <div className="md:col-span-2 flex flex-wrap items-center justify-end gap-3">
                    {formError && (
                        <p className="text-sm text-red-300">{formError}</p>
                    )}
                    {message && (
                        <p className="text-sm text-emerald-300">{message}</p>
                    )}
                    <button type="submit" disabled={!isAdmin || submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
                        {submitting ? 'Adding...' : 'Add service'}
                    </button>
                </div>
            </form>
        </section>

        <section className="max-w-full min-w-0 rounded-xl border border-slate-800 bg-slate-900/40 [-webkit-overflow-scrolling:touch]">
            <div className="overflow-x-auto">
            <table className="w-full min-w-180 table-auto text-left text-xs sm:text-sm">
                <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-slate-500">
                <tr>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Service</th>
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
                ) : serviceTable.length === 0 ? (
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
                        <td className="px-4 py-3 text-white">
                        {categoryName(c.category) || '—'}
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
            {!loading && !error && serviceTable.length > 0 ? (
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