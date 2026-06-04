import { useMemo, useState } from 'react'
import { push, ref, remove, set, update } from 'firebase/database'
import { useAuth } from '../context/AuthContext'
import { useLeads } from '../hooks/useLeads'
import { useEliteAmbassador } from '../hooks/useEliteAmbassador'
import { useAmbassador } from '../hooks/useAmbassador'
import { useProducts } from '../hooks/useProducts'
import { useStatuses } from '../hooks/useStatuses'
import { useUsers } from '../hooks/useUsers'
import { useServices } from '../hooks/useServices'
import { useCategory } from '../hooks/useCategory'
import { assignedUids, toAssignedMap } from '../lib/leads'
import {assignableProcessUsers,assignableSalesUsers,labelAssignableProcessUser,processUserFilterOptions,assignableManagementUsers} from '../lib/assignees'
import { downloadCsv, formatAmountForCsv, inDateRange } from '../lib/csv'
import {resolveAmbassadorName,resolveEliteAmbassadorName,} from '../lib/partnerOrg'
import {labelForLeadStatus,statusLabelMapFromStatuses,} from '../lib/statusLabels'
import { db } from '../lib/firebase'
import LeadDetailsModal from '../components/LeadDetailsModal'
import ModalCloseButton from '../components/ModalCloseButton'
import AmountInWordsHint from '../components/AmountInWordsHint'
import TypeaheadMultiSelect from '../components/TypeaheadMultiSelect'
import TablePagination from '../components/TablePagination'
import { usePagination } from '../hooks/usePagination'

export default function OtherLeads() {
  const { user,profile } = useAuth()
  const { leads, loading } = useLeads()
  const { eliteAmbassador } = useEliteAmbassador()
  const { ambassador: ambassadorRows } = useAmbassador()
  const { products } = useProducts()
  const { services } = useServices()
  const { category } = useCategory()
  const { statuses } = useStatuses()
  const { usersById, processUsers, managementUsers } = useUsers()
  const [statusFilter, setStatusFilter] = useState('')
  const [leadSearch, setLeadSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [sortOrder, setSortOrder] = useState('')
  const [leadModalOpen, setLeadModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [savingLead, setSavingLead] = useState(false)
  const [formError, setFormError] = useState('')
  const [message, setMessage] = useState('')
  const [leadForm, setLeadForm] = useState({
    description: '',
    status: '',
  })

  const users = useMemo(
    () => Object.entries(usersById).map(([uid, user]) => ({ uid, ...user })),
    [usersById],
  )

  const isManagement =
    String(profile?.role ?? '').trim().toLowerCase() === 'management'

  const statusOptions = useMemo(() => {
    return [
      ...statuses
        .filter((s) => (s.label == 'Not Moving Forward' || s.label === 'Inhouse' || s.label === 'Outsourced'))
        .map((s) => ({ value: String(s.id).trim(), label: String(s.label).trim() })),
    ]
  }, [statuses])

  const statusLabelByValue = useMemo(
    () => statusLabelMapFromStatuses(statuses),
    [statuses],
  )

  const filtered = useMemo(() => {
    const term = leadSearch.trim().toLowerCase()
    let list = leads
    
    if (term) {
      list = list.filter((l) => {
        const company = String(l.company ?? '').toLowerCase()
        const clientName = String(l.clientName ?? '').toLowerCase()
        return company.includes(term) || clientName.includes(term)
      })
    }
    
    if (categoryFilter) {
      list = list.filter((l) => l.categoryId === categoryFilter)
    }
    
    if (statusFilter) {
      list = list.filter((l) => l.status === statusFilter)
    }
    list = list.filter((l) => inDateRange(l.leadDate || '', fromDate, toDate))
    list = list.filter((l) =>
      l.categoryId !== '-Os1EruiNYLx2XjzRUdF' &&
      (
        profile?.role === 'management'
          ? true
          : profile?.role === 'sales'
            ? l?.createdBy === profile?.uid
            : profile?.role === 'process'
              ? l?.createdBy === profile?.uid
              : profile?.role === 'employees'
              ? l?.createdBy === profile?.uid
              : profile?.role === 'elite_ambassador'
                ? l?.eliteAmbassadorId === profile?.uid
                : l?.ambassadorId === profile?.uid
      )
    );
    const sorted = [...list]
    return sorted
  }, [
    leads,
    leadSearch,
    categoryFilter,
    statusFilter,
    fromDate,
    toDate,
    sortBy,
    sortOrder,
  ])

  const {
    page: tablePage,
    setPage: setTablePage,
    pageSize: tablePageSize,
    setPageSize: setTablePageSize,
    total: tableTotal,
    totalPages: tableTotalPages,
    pageItems: tablePageItems,
  } = usePagination(filtered)

  function nameFor(uid) {
    const u = usersById[uid]
    return u?.displayName || u?.email || uid?.slice(0, 8)
  }

  function productNameFor(productId) {
    if (!productId) return '-'
    const p = products.find((item) => item.id === productId)
    return p?.name || productId
  }

  function serviceNameFor(serviceId) {
    if (!serviceId) return '-'
    const p = services.find((item) => item.id === serviceId)
    return p?.name || serviceId
  }

  function categoryNameFor(categoryId) {
    if (!categoryId) return '-'
    const p = category.find((item) => item.id === categoryId)
    return p?.name || categoryId
  }

  function formatCurrencyINR(value) {
    if (value === '' || value == null) return '-'
    const amount = Number(value)
    if (!Number.isFinite(amount)) return '-'
    return `₹ ${amount.toLocaleString('en-IN')}`
  }

  function toggleSort(field) {
    if (sortBy !== field) {
      setSortBy(field)
      setSortOrder('asc')
      return
    }
    if (sortOrder === 'asc') {
      setSortOrder('desc')
      return
    }
    if (sortOrder === 'desc') {
      setSortBy('')
      setSortOrder('')
      return
    }
    setSortOrder('asc')
  }

  function sortIndicator(field) {
    if (sortBy !== field || !sortOrder) return '↕'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  function openEdit(lead) {
    setFormError('')
    setEditingId(lead.id)
    setLeadForm({
      description: lead.description ?? '',
      status: lead.status ?? '',
    })
    setLeadModalOpen(true)
  }

  async function saveLeadByManagement(e) {
    e.preventDefault()
    if (!user) return
    setSavingLead(true)
    setFormError('')
    try {
      const eliteAmbassadorLabel = eliteAmbassadorNameFor(
        leadForm.eliteAmbassadorId,
        '',
      )
      const baseAmount = Number.parseFloat(leadForm.totalAmount || 0) || 0
      const bankPercent = Number.parseFloat(leadForm.bankPayoutPercent || 0) || 0
      const mandatePercent =
        Number.parseFloat(leadForm.mandatePayoutPercent || 0) || 0
      const bankPayoutAmount = (baseAmount * bankPercent) / 100
      const mandatePayoutAmount = leadForm.mandateSigned
        ? (baseAmount * mandatePercent) / 100
        : 0

      const payload = {
        description: leadForm.description.trim(),
        status: leadForm.status || '',
        updatedAt: Date.now(),
      }
      await update(ref(db, `leads/${editingId}`), payload)
      closeLeadModal()
    } catch (err) {
      setFormError(err?.message || 'Could not save lead.')
    } finally {
      setSavingLead(false)
    }
  }

  const baseAmount = Number.parseFloat(leadForm.totalAmount || 0) || 0
  const bankPercent = Number.parseFloat(leadForm.bankPayoutPercent || 0) || 0
  const mandatePercent = Number.parseFloat(leadForm.mandatePayoutPercent || 0) || 0
  const bankAmount = (baseAmount * bankPercent) / 100
  const mandateAmount = leadForm.mandateSigned
    ? (baseAmount * mandatePercent) / 100
    : 0
  const totalRevenue = bankAmount + mandateAmount

  function exportCsv() {
    const rows = filtered
      .filter((lead) => inDateRange(lead.leadDate || '', fromDate, toDate))
      .map((lead) => [
        eliteAmbassadorNameFor(lead.eliteAmbassadorId, lead.eliteAmbassadorName),
        ambassadorNameFor(lead.ambassadorId, lead.ambassadorName),
        lead.viaName,
        lead.company || '',
        lead.clientPhoneNo || '',
        labelForLeadStatus(statusLabelByValue, lead.status),
        productNameFor(lead.productId),
        lead.bankName,
        nameFor(lead.createdBy),
        formatAmountForCsv(lead.totalAmount),
        formatAmountForCsv(
          (Number(lead.bankPayoutAmount) || 0) +
            (Number(lead.mandatePayoutAmount) || 0),
        ),
        lead.leadDate || '',
      ])

    downloadCsv(
      'management-leads.csv',
      [
        'Elite ambassador',
        'Ambassador',
        'Connector Name',
        'Company',
        'Phone No.',
        'Status',
        'Product',
        'Bank Name',
        'Sales Owner',
        'Process Team',
        'Required Amount',
        'Total Revenue',
        'Lead Date',
      ],
      rows,
    )
  }

  function closeLeadModal() {
    setLeadModalOpen(false)
    setEditingId(null)
    setLeadForm({
      description: '',
      status: '',
    })
  }

  if (loading) {
    return <p className="text-slate-400">Loading leads…</p>
  }
  
  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Other leads</h1>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div>
                <label
                htmlFor="category-filter"
                className="block text-xs font-medium uppercase tracking-wide text-slate-500"
                >Category</label>
                <select
                id="category-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                >
                <option value="">All categories</option>
                {category.map((c) => (
                    <option key={c.id} value={c.id}>
                    {c.name || c.id}
                    </option>
                ))}
                </select>
            </div>
            <div>
              <label htmlFor="service-filter" className="block text-xs font-medium uppercase tracking-wide text-slate-500">Services</label>
              <select
              id="service-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
              >
              <option value="">All status</option>
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                {s.label || s.id}
                </option>
              ))}
              </select>
            </div>
            <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                From
                </label>
                <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                />
            </div>
            <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                To
                </label>
                <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                />
            </div>
            <div>
                <label
                htmlFor="search-company-management"
                className="block text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                Search company
                </label>
                <input
                id="search-company-management"
                type="text"
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
                placeholder="Type company name..."
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                />
            </div>
            <div className="flex items-end">
              <button
              type="button"
              onClick={exportCsv}
              className="w-full rounded-lg border border-green-600/30 cursor-pointer px-4 py-2 text-sm font-semibold text-slate-200 bg-green-500/20 hover:bg-green-500/30"
              >
              Export CSV
              </button>
            </div>
        </div>
      </div>

      <div className="max-w-full min-w-0 rounded-xl border border-slate-800 bg-slate-900/40 [-webkit-overflow-scrolling:touch]">
        <div className="overflow-x-auto">
          <table className="min-w-max w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Sr No.</th>
                <th className="px-4 py-2 font-medium">Full Name</th>
                <th className="px-4 py-2 font-medium">Company Name</th>
                <th className="px-4 py-2 font-medium">Mobile No</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Category</th>
                <th className="px-4 py-2 font-medium">Services</th>
                <th className="px-4 py-2 font-medium">Location</th>
                <th className="px-4 py-2 font-medium">Referred By</th>
                <th className="px-4 py-2 font-medium">Lead Date</th>
                <th className="px-4 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={12}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    No leads match this filter.
                  </td>
                </tr>
              ) : (
                tablePageItems.map((lead,index) => {
                  const assignees = assignedUids(lead.assignedTo)
                  return (
                    <tr key={lead.id} className="text-slate-300">
                      <td className="px-4 py-1 text-slate-400">{index+1}</td>
                      <td className="px-4 py-1">{lead.clientName}</td>
                      <td className="px-4 py-1 text-slate-400">{lead.company}</td>
                      <td className="px-4 py-1 text-slate-400">{lead.clientPhoneNo || '-'}</td>
                      <td className="px-4 py-1">
                        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-blue-300">
                          {labelForLeadStatus(statusLabelByValue, lead.status) ||
                            'New'}
                        </span>
                      </td>
                      <td className="px-4 py-1 text-slate-400">{categoryNameFor(lead?.categoryId)}</td>
                      <td className="px-4 py-1 text-slate-400">{serviceNameFor(lead?.serviceId)}</td>
                      <td className="px-4 py-1">{lead.location}</td>
                      <td className="px-4 py-1 text-slate-400 text-right">{lead?.referred_by}</td>
                      <td className="px-4 py-1 text-xs text-slate-500">{lead?.leadDate || '-'}</td>
                      <td className="px-4 py-1">
                        <div className="flex flex-wrap items-center gap-2 justify-end">
                          <div>
                            <button
                              type="button"
                              onClick={() => openEdit(lead)}
                              className="rounded-lg border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 sm:px-3"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
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
      </div>

      {leadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">
                {editingId ? 'Edit lead' : 'New lead'}
              </h2>
              <ModalCloseButton onClick={closeLeadModal} />
            </div>
            <form onSubmit={saveLeadByManagement} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">Description</label>
                <textarea
                  rows={3}
                  value={leadForm.description}
                  onChange={(e) =>
                    setLeadForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Status</label>
                <select
                  value={leadForm.status}
                  onChange={(e) =>
                    setLeadForm((f) => ({ ...f, status: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                >
                  {statusOptions.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              {formError && <p className="text-sm text-red-300">{formError}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeLeadModal}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLead}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {savingLead
                    ? 'Saving...'
                    : editingId
                      ? 'Update lead'
                      : 'Save lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
