import { useMemo, useState } from 'react'
import { ref, update } from 'firebase/database'
import { useAuth } from '../../context/AuthContext'
import { ROLES, ROLE_LABELS } from '../../constants'
import { db } from '../../lib/firebase'
import TablePagination from '../../components/TablePagination'
import { usePagination } from '../../hooks/usePagination'
import { useLeads } from '../../hooks/useLeads'
import { assignedUids, toAssignedMap } from '../../lib/leads'
import { useUsers } from '../../hooks/useUsers'
import TypeaheadMultiSelect from '../../components/TypeaheadMultiSelect'

function AdminTransferLeads() {
    const { user, profile } = useAuth()
    const { leads, loading: leadsLoading } = useLeads()
    const isAdmin = String(profile?.role ?? '').trim().toLowerCase() === ROLES.ADMIN
    const { usersById, salesUsers } = useUsers()
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState('')
    const [formError, setFormError] = useState('')
    const [selectedLeadIds, setSelectedLeadIds] = useState([])
    const [salesOwner, setSalesOwner] = useState('')
    const [processUserIds, setProcessUserIds] = useState([])

    const sortedSalesUsers = useMemo(
        () =>
            [...salesUsers].sort((a, b) =>
                String(a.displayName || a.email || '')
                    .toLowerCase()
                    .localeCompare(
                        String(b.displayName || b.email || '').toLowerCase(),
                    ),
            ),
        [salesUsers],
    )

    const users = useMemo(
        () => Object.entries(usersById).map(([uid, user]) => ({ uid, ...user })),
        [usersById],
    )

    const processUsers = useMemo(
        () =>
            users
                .filter((u) => {
                    const role = String(u?.role ?? '').trim().toLowerCase();
                    return role === 'sales' || role === 'process';
                })
                .sort((a, b) =>
                    String(a.displayName || a.email || '')
                        .toLowerCase()
                        .localeCompare(String(b.displayName || b.email || '').toLowerCase()),
                ),
        [users],
    )

    const processOptions = useMemo(
        () =>
            processUsers.map((p) => ({
                id: p.uid,
                label: p.displayName || p.email || p.uid.slice(0, 8),
            })),
        [processUsers],
    )

    const leadsTable = useMemo(() => leads ?? [], [leads])

    const {
        page: tablePage,
        setPage: setTablePage,
        pageSize: tablePageSize,
        setPageSize: setTablePageSize,
        total: tableTotal,
        totalPages: tableTotalPages,
        pageItems: tablePageItems,
    } = usePagination(leadsTable)

    const pageLeadIds = useMemo(
        () => tablePageItems.map((lead) => lead.id),
        [tablePageItems],
    )

    const allPageSelected =
        pageLeadIds.length > 0 &&
        pageLeadIds.every((id) => selectedLeadIds.includes(id))

    function nameFor(uid) {
        if (!uid) return '—'
        const u = usersById[uid]
        return u?.displayName || u?.email || uid.slice(0, 8)
    }

    function processTeamNames(lead) {
        const uids = assignedUids(lead.assignedTo)
        if (!uids.length) return 'Unassigned'
        return uids.map((uid) => nameFor(uid)).join(', ')
    }

    function toggleLead(leadId) {
        setSelectedLeadIds((prev) =>
            prev.includes(leadId)
                ? prev.filter((id) => id !== leadId)
                : [...prev, leadId],
        )
    }

    function toggleAllOnPage() {
        if (allPageSelected) {
            setSelectedLeadIds((prev) =>
                prev.filter((id) => !pageLeadIds.includes(id)),
            )
            return
        }
        setSelectedLeadIds((prev) => [
            ...new Set([...prev, ...pageLeadIds]),
        ])
    }

    async function handleTransfer(e) {
        e.preventDefault()
        setMessage('')
        setFormError('')

        if (!user) {
            setFormError('You must be logged in.')
            return
        }
        if (!isAdmin) {
            setFormError(
                `Current role is "${profile?.role ?? 'missing'}". Only admins can transfer leads.`,
            )
            return
        }
        if (!selectedLeadIds.length) {
            setFormError('Select at least one lead to transfer.')
            return
        }
        if (!salesOwner && !processUserIds.length) {
            setFormError('Select a sales owner and/or process team.')
            return
        }

        const payload = {
            updatedAt: Date.now(),
        }
        if (salesOwner) {
            payload.createdBy = salesOwner
        }
        if (processUserIds.length) {
            payload.assignedTo = toAssignedMap(processUserIds)
        }

        setSubmitting(true)
        try {
            await Promise.all(
                selectedLeadIds.map((leadId) =>
                    update(ref(db, `leads/${leadId}`), payload),
                ),
            )
            const count = selectedLeadIds.length
            setSelectedLeadIds([])
            setMessage(
                `Transferred ${count} lead${count === 1 ? '' : 's'} successfully.`,
            )
        } catch (err) {
            console.error('[CRM] transfer leads failed', err)
            setFormError(err?.message || 'Failed to transfer leads.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-w-0 space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-white">Transfer Leads</h1>
                <p className="mt-1 text-sm text-slate-400">
                    Select leads, choose a sales owner and/or process team, then transfer.
                </p>
            </div>

            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm">
                <p className="text-slate-400">
                    Current UID:{' '}
                    <code className="font-mono text-blue-300">{user?.uid || '—'}</code>
                </p>
                <p className="mt-1 text-slate-400">
                    Current role:{' '}
                    <code className="text-blue-300">
                        {ROLE_LABELS[profile?.role] || profile?.role || 'missing'}
                    </code>
                </p>
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                <form
                    onSubmit={handleTransfer}
                    className="mt-4 grid gap-4 md:grid-cols-4"
                >
                    <div>
                        <label
                            htmlFor="sales-owner"
                            className="block text-sm font-medium text-slate-300"
                        >
                            Transfer to sales owner
                        </label>
                        <select
                            id="sales-owner"
                            value={salesOwner}
                            onChange={(e) => setSalesOwner(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                        >
                            <option value="">Keep current</option>
                            {sortedSalesUsers.map((c) => (
                                <option key={c.uid} value={c.uid}>
                                    {c.displayName || c.email || c.uid}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300">
                            Transfer to process team
                        </label>
                        <div className="mt-1">
                            <TypeaheadMultiSelect
                                id="process-user-transfer"
                                label={null}
                                placeholder="Search process users…"
                                options={processOptions}
                                selectedIds={processUserIds}
                                onChangeSelectedIds={setProcessUserIds}
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2 flex flex-wrap items-center justify-end gap-3">
                        {selectedLeadIds.length > 0 && (
                            <p className="text-sm text-slate-400">
                                {selectedLeadIds.length} selected
                            </p>
                        )}
                        {formError && <p className="text-sm text-red-300">{formError}</p>}
                        {message && (
                            <p className="text-sm text-emerald-300">{message}</p>
                        )}
                        <button
                            type="submit"
                            disabled={submitting || !isAdmin}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 mt-4"
                        >
                            {submitting ? 'Transferring Leads...' : 'Transfer Leads'}
                        </button>
                    </div>
                </form>
            </section>

            <section className="max-w-full min-w-0 rounded-xl border border-slate-800 bg-slate-900/40 [-webkit-overflow-scrolling:touch]">
                <div className="overflow-x-auto">
                    <table className="min-w-max w-full text-left text-xs sm:text-sm">
                        <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="px-4 py-2 font-medium">
                                    <input
                                        type="checkbox"
                                        checked={allPageSelected}
                                        onChange={toggleAllOnPage}
                                        disabled={!pageLeadIds.length}
                                        className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-950"
                                        aria-label="Select all leads on this page"
                                    />
                                </th>
                                <th className="px-4 py-2 font-medium">Company</th>
                                <th className="px-4 py-2 font-medium">Client Name</th>
                                <th className="px-4 py-2 font-medium">Sales owner</th>
                                <th className="px-4 py-2 font-medium">Process team</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {leadsLoading ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-10 text-center text-slate-500"
                                    >
                                        Loading leads…
                                    </td>
                                </tr>
                            ) : tablePageItems.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-10 text-center text-slate-500"
                                    >
                                        No leads
                                    </td>
                                </tr>
                            ) : (
                                tablePageItems.map((lead) => {
                                    const checked = selectedLeadIds.includes(lead.id)
                                    return (
                                        <tr key={lead.id} className="text-slate-300">
                                            <td className="px-4 py-1 text-slate-400">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => toggleLead(lead.id)}
                                                    className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-950"
                                                    aria-label={`Select lead ${lead.company || lead.id}`}
                                                />
                                            </td>
                                            <td className="px-4 py-1 text-slate-400 lowercase first-letter:uppercase">
                                                {lead.company || '—'}
                                            </td>
                                            <td className="px-4 py-1 text-slate-400 lowercase first-letter:uppercase">
                                                {lead.clientName || '—'}
                                            </td>
                                            <td className="px-4 py-1 text-slate-400">
                                                {nameFor(lead.createdBy)}
                                            </td>
                                            <td className="px-4 py-1">
                                                {processTeamNames(lead)}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                <TablePagination
                    page={tablePage}
                    totalPages={tableTotalPages}
                    totalItems={tableTotal}
                    pageSize={tablePageSize}
                    onPageChange={setTablePage}
                    onPageSizeChange={setTablePageSize}
                />
            </section>
        </div>
    )
}

export default AdminTransferLeads
