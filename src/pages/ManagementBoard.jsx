import { useMemo, useState } from 'react'
import { push, ref, remove, set, update } from 'firebase/database'
import { useAuth } from '../context/AuthContext'
import { useLeads } from '../hooks/useLeads'
import { useEliteAmbassador } from '../hooks/useEliteAmbassador'
import { useAmbassador } from '../hooks/useAmbassador'
import { useProducts } from '../hooks/useProducts'
import { useStatuses } from '../hooks/useStatuses'
import { useUsers } from '../hooks/useUsers'
import { assignedUids, toAssignedMap } from '../lib/leads'
import {assignableProcessUsers,assignableSalesUsers,labelAssignableProcessUser,processUserFilterOptions,} from '../lib/assignees'
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

export default function ManagementBoard() {
  const { user,profile } = useAuth()
  const { leads, loading } = useLeads()
  const { eliteAmbassador } = useEliteAmbassador()
  const { ambassador: ambassadorRows } = useAmbassador()
  const { products } = useProducts()
  const { statuses } = useStatuses()
  const { usersById, processUsers } = useUsers()
  const [statusFilter, setStatusFilter] = useState('')
  const [leadSearch, setLeadSearch] = useState('')
  const [salesOwnerFilter, setSalesOwnerFilter] = useState([])
  const [processUserFilter, setProcessUserFilter] = useState([])
  const [productFilter, setProductFilter] = useState('')
  const [eliteAmbassadorFilter, setEliteAmbassadorFilter] = useState([])
  const [ambassadorFilter, setAmbassadorFilter] = useState([])
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [sortOrder, setSortOrder] = useState('')
  const [viewLead, setViewLead] = useState(null)
  const [leadModalOpen, setLeadModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [assignmentMode, setAssignmentMode] = useState('process')
  const [selectedAssignees, setSelectedAssignees] = useState([])
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false)
  const [selectedSalesAssignees, setSelectedSalesAssignees] = useState([])
  const [salesAssigneeDropdownOpen, setSalesAssigneeDropdownOpen] =
    useState(false)
  const [savingLead, setSavingLead] = useState(false)
  const [formError, setFormError] = useState('')
  const [deletingLeadId, setDeletingLeadId] = useState('')
  const [message, setMessage] = useState('')
  const [leadForm, setLeadForm] = useState({
    eliteAmbassadorId: '',
    company: '',
    clientName: '',
    clientPhoneNo:'',
    location: '',
    bankName: '',
    onePagerLink: '',
    description: '',
    status: '',
    updatedStatusDate: '',
    productId: '',
    leadDate: '',
    totalAmount: '',
    bankPayoutPercent: '',
    mandateSigned: false,
    mandatePayoutPercent: '',
  })

  const users = useMemo(
    () => Object.entries(usersById).map(([uid, user]) => ({ uid, ...user })),
    [usersById],
  )

  const isManagement =
    String(profile?.role ?? '').trim().toLowerCase() === 'management'

  const salesUsers = useMemo(
    () =>
      users
        .filter((u) => String(u?.role ?? '').trim().toLowerCase() === 'sales')
        .sort((a, b) =>
          String(a.displayName || a.email || '')
            .toLowerCase()
            .localeCompare(String(b.displayName || b.email || '').toLowerCase()),
        ),
    [users],
  )

  const salesOwnerOptions = useMemo(
    () =>
      salesUsers.map((u) => ({
        id: u.uid,
        label: u.displayName || u.email || u.uid.slice(0, 8),
      })),
    [salesUsers],
  )

  const processUserOptions = useMemo(
    () => processUserFilterOptions(processUsers, user?.uid, usersById),
    [processUsers, user?.uid, usersById],
  )

  const processAssignees = useMemo(
    () => assignableProcessUsers(processUsers, user?.uid, usersById),
    [processUsers, user?.uid, usersById],
  )

  const salesAssignees = useMemo(
    () => assignableSalesUsers(salesUsers, user?.uid, usersById),
    [salesUsers, user?.uid, usersById],
  )

  const eliteAmbassadorOptions = useMemo(
    () =>
      eliteAmbassador.map((p) => ({
        id: p.id,
        label: p.name || p.id,
      })),
    [eliteAmbassador],
  )

  const ambassadorOptions = useMemo(
    () =>
      ambassadorRows.map((a) => ({
        id: a.id,
        label: a.name || a.id,
      })),
    [ambassadorRows],
  )

  const statusOptions = useMemo(() => {
    return [
      { value: '', label: 'Select Status' },
      ...statuses
        .filter((s) => String(s?.id ?? '').trim() && String(s?.label ?? '').trim())
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
    if (statusFilter) {
      list = list.filter((l) => l.status === statusFilter)
    }
    if (term) {
      list = list.filter((l) => {
        const company = String(l.company ?? '').toLowerCase()
        const clientName = String(l.clientName ?? '').toLowerCase()
        return company.includes(term) || clientName.includes(term)
      })
    }
    if (salesOwnerFilter.length) {
      list = list.filter((l) => salesOwnerFilter.includes(l.createdBy))
    }
    if (processUserFilter.length) {
      list = list.filter((l) => {
        const assigned = assignedUids(l.assignedTo)
        return processUserFilter.some((uid) => assigned.includes(uid))
      })
    }
    if (productFilter) {
      list = list.filter((l) => l.productId === productFilter)
    }
    if (eliteAmbassadorFilter.length) {
      list = list.filter((l) =>
        eliteAmbassadorFilter.includes(
          String(l.eliteAmbassadorId ?? '').trim(),
        ),
      )
    }
    if (ambassadorFilter.length) {
      list = list.filter((l) =>
        ambassadorFilter.includes(String(l.ambassadorId ?? '').trim()),
      )
    }
    list = list.filter((l) => inDateRange(l.leadDate || '', fromDate, toDate))
    const sorted = [...list]
    if (sortBy && sortOrder) {
      sorted.sort((a, b) => {
        const aValue =
          sortBy === 'requiredAmount'
            ? Number(a?.totalAmount) || 0
            : (Number(a?.bankPayoutAmount) || 0) + (Number(a?.mandatePayoutAmount) || 0)
        const bValue =
          sortBy === 'requiredAmount'
            ? Number(b?.totalAmount) || 0
            : (Number(b?.bankPayoutAmount) || 0) + (Number(b?.mandatePayoutAmount) || 0)
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
      })
    }
    return sorted
  }, [
    leads,
    statusFilter,
    leadSearch,
    salesOwnerFilter,
    processUserFilter,
    productFilter,
    eliteAmbassadorFilter,
    ambassadorFilter,
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
    return u?.displayName || u?.email || uid.slice(0, 8)
  }

  function productNameFor(productId) {
    if (!productId) return '-'
    const p = products.find((item) => item.id === productId)
    return p?.name || productId
  }

  function eliteAmbassadorNameFor(orgId, fallbackName = '') {
    return (
      resolveEliteAmbassadorName(orgId, fallbackName, eliteAmbassador) || '-'
    )
  }

  function ambassadorNameFor(ambassadorId, fallbackName = '') {
    return resolveAmbassadorName(ambassadorId, fallbackName, ambassadorRows) || '-'
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

  function toggleAssignee(uid) {
    setSelectedAssignees((prev) =>
      prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid],
    )
  }

  function toggleSalesAssignee(uid) {
    setSelectedSalesAssignees((prev) =>
      prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid],
    )
  }

  function openEdit(lead) {
    setFormError('')
    setEditingId(lead.id)
    setLeadForm({
      eliteAmbassadorId: String(lead.eliteAmbassadorId ?? '').trim(),
      company: lead.company ?? '',
      clientName: lead.clientName ?? '',
      clientPhoneNo: lead.clientPhoneNo ?? '',
      location: lead.location ?? '',
      bankName: lead.bankName ?? '',
      onePagerLink: lead.onePagerLink ?? '',
      description: lead.description ?? '',
      status: lead.status ?? '',
      updatedStatusDate: lead.updatedStatusDate ?? '',
      productId: lead.productId ?? '',
      leadDate: lead.leadDate ?? '',
      totalAmount: lead.totalAmount ?? '',
      bankPayoutPercent: lead.bankPayoutPercent ?? '',
      mandateSigned: Boolean(lead.mandateSigned),
      mandatePayoutPercent: lead.mandatePayoutPercent ?? '',
    })
    const processUids = assignedUids(lead.assignedTo)
    const salesUids = assignedUids(lead.salesAssignedTo)
    if (salesUids.length && !processUids.length) {
      setAssignmentMode('sales')
      setSelectedSalesAssignees(salesUids)
      setSelectedAssignees([])
    } else {
      setAssignmentMode('process')
      setSelectedAssignees(processUids)
      setSelectedSalesAssignees([])
    }
    setAssigneeDropdownOpen(false)
    setSalesAssigneeDropdownOpen(false)
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
        eliteAmbassadorId: leadForm.eliteAmbassadorId,
        eliteAmbassadorName: eliteAmbassadorLabel,
        company: leadForm.company.trim() || eliteAmbassadorLabel,
        clientName: leadForm.clientName.trim(),
        location: leadForm.location.trim(),
        clientPhoneNo: leadForm.clientPhoneNo.trim(),
        bankName: leadForm.bankName.trim(),
        onePagerLink: leadForm.onePagerLink.trim(),
        leadDate: leadForm.leadDate || '',
        description: leadForm.description.trim(),
        status: leadForm.status || '',
        updatedStatusDate: leadForm.updatedStatusDate || '',
        assignedTo:
          assignmentMode === 'process'
            ? toAssignedMap(selectedAssignees)
            : null,
        salesAssignedTo:
          assignmentMode === 'sales'
            ? toAssignedMap(selectedSalesAssignees)
            : null,
        productId: leadForm.productId || null,
        totalAmount: leadForm.totalAmount || '',
        bankPayoutPercent: leadForm.bankPayoutPercent || '',
        bankPayoutAmount: Number(bankPayoutAmount.toFixed(2)),
        mandateSigned: Boolean(leadForm.mandateSigned),
        mandatePayoutPercent: leadForm.mandateSigned
          ? leadForm.mandatePayoutPercent || ''
          : '',
        mandatePayoutAmount: Number(mandatePayoutAmount.toFixed(2)),
        updatedAt: Date.now(),
      }
      if (editingId) {
        await update(ref(db, `leads/${editingId}`), payload)
      } else {
        await set(push(ref(db, 'leads')), {
          ...payload,
          createdBy: user.uid,
          createdAt: Date.now(),
        })
      }
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
        lead.company || '',
        lead.clientPhoneNo || '',
        labelForLeadStatus(statusLabelByValue, lead.status),
        productNameFor(lead.productId),
        nameFor(lead.createdBy),
        assignedUids(lead.assignedTo).map((uid) => nameFor(uid)).join(', '),
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
        'Company',
        'Phone No.',
        'Status',
        'Product',
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
    setAssigneeDropdownOpen(false)
    setSalesAssigneeDropdownOpen(false)
    setAssignmentMode('process')
    setLeadForm({
      eliteAmbassadorId: '',
      company: '',
      clientName: '',
      clientPhoneNo: '',
      location: '',
      bankName: '',
      onePagerLink: '',
      description: '',
      status: '',
      updatedStatusDate: '',
      productId: '',
      leadDate: '',
      totalAmount: '',
      bankPayoutPercent: '',
      mandateSigned: false,
      mandatePayoutPercent: '',
    })
    setSelectedAssignees([])
    setSelectedSalesAssignees([])
  }

  if (loading) {
    return <p className="text-slate-400">Loading leads…</p>
  }
  
  async function handleDelete(leadId) {
    setMessage('')
    setFormError('')
    
    const ok = window.confirm(
      `Delete this lead? This cannot be undone.`,
    )
    if (!ok) return

    setDeletingLeadId(leadId)
    try {
      await remove(ref(db, `leads/${leadId}`))
      setMessage('Lead deleted.')
    } catch (err) {
      setFormError(err?.message ?? 'Could not delete lead.')
    } finally {
      setDeletingLeadId('')
    }
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">All leads</h1>
            <p className="mt-1 text-sm text-slate-400">
              Track every lead, owner, assignment, and status across teams.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <button
              type="button"
              onClick={() => {
                setFormError('')
                setEditingId(null)
                setAssignmentMode('process')
                setLeadForm({
                  eliteAmbassadorId: '',
                  company: '',
                  clientName: '',
                  clientPhoneNo: '',
                  location: '',
                  bankName: '',
                  onePagerLink: '',
                  description: '',
                  status: '',
                  updatedStatusDate: '',
                  productId: '',
                  leadDate: '',
                  totalAmount: '',
                  bankPayoutPercent: '',
                  mandateSigned: false,
                  mandatePayoutPercent: '',
                })
                setSelectedAssignees([])
                setSelectedSalesAssignees([])
                setAssigneeDropdownOpen(false)
                setSalesAssigneeDropdownOpen(false)
                setLeadModalOpen(true)
              }}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500"
            >
              New lead
            </button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div>
            <label
              htmlFor="status-filter"
              className="block text-xs font-medium uppercase tracking-wide text-slate-500"
            >
              Filter by status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            >
              <option value="">All statuses</option>
              {statusOptions.filter((s) => s.value).map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="sales-owner-filter"
              className="block text-xs font-medium uppercase tracking-wide text-slate-500"
            >
              Sales owner
            </label>
            <TypeaheadMultiSelect
              id="sales-owner-filter"
              label={null}
              placeholder="Type sales owner…"
              options={salesOwnerOptions}
              selectedIds={salesOwnerFilter}
              onChangeSelectedIds={setSalesOwnerFilter}
            />
          </div>

          <div>
            <label
              htmlFor="process-user-filter"
              className="block text-xs font-medium uppercase tracking-wide text-slate-500"
            >
              Process team user
            </label>
            <TypeaheadMultiSelect
              id="process-user-filter"
              label={null}
              placeholder="Type process user…"
              options={processUserOptions}
              selectedIds={processUserFilter}
              onChangeSelectedIds={setProcessUserFilter}
            />
          </div>

          <div>
            <label
              htmlFor="product-filter"
              className="block text-xs font-medium uppercase tracking-wide text-slate-500"
            >
              Product
            </label>
            <select
              id="product-filter"
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            >
              <option value="">All products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || p.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="elite-ambassador-filter"
              className="block text-xs font-medium uppercase tracking-wide text-slate-500"
            >
              Elite ambassador
            </label>
            <TypeaheadMultiSelect
              id="elite-ambassador-filter"
              label={null}
              placeholder="Type elite ambassador…"
              options={eliteAmbassadorOptions}
              selectedIds={eliteAmbassadorFilter}
              onChangeSelectedIds={setEliteAmbassadorFilter}
            />
          </div>

          <div>
            <label
              htmlFor="ambassador-filter"
              className="block text-xs font-medium uppercase tracking-wide text-slate-500"
            >
              Ambassador
            </label>
            <TypeaheadMultiSelect
              id="ambassador-filter"
              label={null}
              placeholder="Type ambassador…"
              options={ambassadorOptions}
              selectedIds={ambassadorFilter}
              onChangeSelectedIds={setAmbassadorFilter}
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
          <div className="flex items-end">
            <button
              type="button"
              onClick={exportCsv}
              className="w-full rounded-lg border border-slate-600 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
            >
              Export CSV
            </button>
          </div>
          <div></div>
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
        </div>
      </div>

      <div className="max-w-full min-w-0 rounded-xl border border-slate-800 bg-slate-900/40 [-webkit-overflow-scrolling:touch]">
        <div className="overflow-x-auto">
          <table className="min-w-max w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Elite ambassador</th>
                <th className="px-4 py-2 font-medium">Ambassador</th>
                <th className="px-4 py-2 font-medium">Company</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Product</th>
                <th className="px-4 py-2 font-medium">Sales owner</th>
                <th className="px-4 py-2 font-medium">Process team</th>
                <th className="px-4 py-2 font-medium text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort('requiredAmount')}
                    className="inline-flex items-center gap-1 text-right hover:text-slate-300"
                    title="Sort required amount"
                  >
                    Required Amount
                    <span>{sortIndicator('requiredAmount')}</span>
                  </button>
                </th>
                <th className="px-4 py-2 font-medium text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort('revenue')}
                    className="inline-flex items-center gap-1 text-right hover:text-slate-300"
                    title="Sort total revenue"
                  >
                    Total Revenue
                    <span>{sortIndicator('revenue')}</span>
                  </button>
                </th>
                <th className="px-4 py-2 font-medium">Lead Date</th>
                <th className="px-4 py-2 font-medium">Updated status date</th>
                <th className="px-4 py-2 font-medium">View details</th>
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
                tablePageItems.map((lead) => {
                  const assignees = assignedUids(lead.assignedTo)
                  return (
                    <tr key={lead.id} className="text-slate-300">
                      <td className="px-4 py-1">
                        {eliteAmbassadorNameFor(
                          lead.eliteAmbassadorId,
                          lead.eliteAmbassadorName,
                        )}
                      </td>
                      <td className="px-4 py-1 text-slate-400">
                        {ambassadorNameFor(lead.ambassadorId, lead.ambassadorName)}
                      </td>
                      <td className="px-4 py-1 text-slate-400">{lead.company || '-'}</td>
                      <td className="px-4 py-1">
                        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-blue-300">
                          {labelForLeadStatus(statusLabelByValue, lead.status) ||
                            'New'}
                        </span>
                      </td>
                      <td className="px-4 py-1 text-slate-400">
                        {productNameFor(lead?.productId)}
                      </td>
                      <td className="px-4 py-1 text-slate-400">{nameFor(lead.createdBy)}</td>
                      <td className="px-4 py-1">
                        {assignees.length === 0 ? (
                          <span className="text-slate-600">Unassigned</span>
                        ) : (
                          <ul className="space-y-0.5 text-xs text-slate-400">
                            {assignees.map((uid) => (
                              <li key={uid}>{nameFor(uid)}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="px-4 py-1 text-slate-400 text-right">
                        {formatCurrencyINR(lead?.totalAmount)}
                      </td>
                      <td className="px-4 py-1 text-slate-400 text-right">
                        {formatCurrencyINR(
                          (Number(lead?.bankPayoutAmount) || 0) +
                            (Number(lead?.mandatePayoutAmount) || 0),
                        )}
                      </td>
                      <td className="px-4 py-1 text-xs text-slate-500">{lead.leadDate || '-'}</td>
                      <td className="px-4 py-1 text-xs text-slate-500">{lead.updatedStatusDate || '-'}</td>
                      <td className="px-4 py-1">
                        <div className="flex flex-wrap items-center gap-2 justify-end">
                          <div>
                            <button
                              type="button"
                              onClick={() => setViewLead(lead)}
                              className="rounded-lg border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 sm:px-3"
                              >
                                View details
                              </button>
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => openEdit(lead)}
                              className="rounded-lg border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 sm:px-3"
                            >
                              Edit
                            </button>
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => handleDelete(lead.id)}
                              disabled={!isManagement ||deletingLeadId === lead.id}
                              className="rounded-lg border border-red-800/40 px-4 py-1 text-xs text-red-300 hover:bg-red-950/40 disabled:opacity-50"
                            >
                              {deletingLeadId === lead.id ? 'Deleting...' : 'Delete'}
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

      {viewLead && (
        <LeadDetailsModal
          lead={viewLead}
          usersById={usersById}
          onClose={() => setViewLead(null)}
        />
      )}

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
                <label className="block text-sm font-medium text-slate-300">
                  Elite ambassador
                </label>
                <select
                  value={leadForm.eliteAmbassadorId}
                  onChange={(e) =>
                    setLeadForm((f) => ({
                      ...f,
                      eliteAmbassadorId: e.target.value,
                      company:
                        f.company ||
                        eliteAmbassador.find((p) => p.id === e.target.value)?.name ||
                        '',
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                >
                  <option value="">Select elite ambassador</option>
                  {eliteAmbassador.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Company</label>
                <input
                  value={leadForm.company}
                  onChange={(e) =>
                    setLeadForm((f) => ({ ...f, company: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Name of client</label>
                <input
                  value={leadForm.clientName}
                  onChange={(e) =>
                    setLeadForm((f) => ({ ...f, clientName: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Mobile No.</label>
                <input
                  value={leadForm.clientPhoneNo}
                  onChange={(e) =>
                    setLeadForm((f) => ({ ...f, clientPhoneNo: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Location</label>
                <input
                  value={leadForm.location}
                  onChange={(e) =>
                    setLeadForm((f) => ({ ...f, location: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Bank Name</label>
                <input
                  value={leadForm.bankName}
                  onChange={(e) =>
                    setLeadForm((f) => ({ ...f, bankName: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">One pager link</label>
                <input
                  type="url"
                  value={leadForm.onePagerLink}
                  onChange={(e) =>
                    setLeadForm((f) => ({ ...f, onePagerLink: e.target.value }))
                  }
                  placeholder="https://..."
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
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
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Updated status date
                </label>
                <input
                  type="date"
                  value={leadForm.updatedStatusDate}
                  onChange={(e) =>
                    setLeadForm((f) => ({
                      ...f,
                      updatedStatusDate: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Product</label>
                <select
                  value={leadForm.productId}
                  onChange={(e) =>
                    setLeadForm((f) => ({ ...f, productId: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                >
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Date</label>
                <input
                  type="date"
                  value={leadForm.leadDate}
                  onChange={(e) =>
                    setLeadForm((f) => ({ ...f, leadDate: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Required Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={leadForm.totalAmount}
                  onChange={(e) =>
                    setLeadForm((f) => ({ ...f, totalAmount: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
                <AmountInWordsHint value={leadForm.totalAmount} />
              </div>
              <section className="rounded-xl border border-slate-700/80 bg-slate-900/40 p-4">
                <h3 className="text-sm font-semibold text-blue-300">Revenue Details</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300">
                      Bank Payout Percent (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={leadForm.bankPayoutPercent}
                      onChange={(e) =>
                        setLeadForm((f) => ({ ...f, bankPayoutPercent: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={bankAmount.toFixed(2)}
                      readOnly
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-medium text-slate-300">Mandate Signed</p>
                  <div className="mt-2 flex items-center gap-5 text-sm text-slate-300">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="mgmtMandateSigned"
                        checked={leadForm.mandateSigned === true}
                        onChange={() =>
                          setLeadForm((f) => ({ ...f, mandateSigned: true }))
                        }
                      />
                      Yes
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="mgmtMandateSigned"
                        checked={leadForm.mandateSigned === false}
                        onChange={() =>
                          setLeadForm((f) => ({ ...f, mandateSigned: false }))
                        }
                      />
                      No
                    </label>
                  </div>
                </div>
                {leadForm.mandateSigned && (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-300">
                        Mandate Payout Percent (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={leadForm.mandatePayoutPercent}
                        onChange={(e) =>
                          setLeadForm((f) => ({
                            ...f,
                            mandatePayoutPercent: e.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300">
                        Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={mandateAmount.toFixed(2)}
                        readOnly
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-white"
                      />
                    </div>
                  </div>
                )}
                <div className="mt-4 rounded-lg border border-emerald-700/50 bg-emerald-950/20 px-3 py-3 text-sm text-emerald-200">
                  <div className="flex justify-between">
                    <span>Bank Payout Amount:</span>
                    <span>₹{bankAmount.toFixed(2)}</span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span>Mandate Amount:</span>
                    <span>₹{mandateAmount.toFixed(2)}</span>
                  </div>
                  <div className="mt-2 flex justify-between font-semibold">
                    <span>Total Revenue:</span>
                    <span>₹{totalRevenue.toFixed(2)}</span>
                  </div>
                </div>
              </section>
              <div>
                <p className="text-sm font-medium text-slate-300">
                  Assign to
                </p>
                <div className="mt-2 flex rounded-lg border border-slate-700 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAssignmentMode('process')
                      setSelectedSalesAssignees([])
                      setSalesAssigneeDropdownOpen(false)
                    }}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      assignmentMode === 'process'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Process
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAssignmentMode('sales')
                      setSelectedAssignees([])
                      setAssigneeDropdownOpen(false)
                    }}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      assignmentMode === 'sales'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sales
                  </button>
                </div>
                {assignmentMode === 'process' ? (
                  <>
                    <p className="mt-3 text-xs font-medium text-slate-400">
                      Process team (multi-select)
                    </p>
                    <div className="relative mt-2">
                      <button
                        type="button"
                        onClick={() =>
                          processAssignees.length > 0 &&
                          setAssigneeDropdownOpen((v) => !v)
                        }
                        className="flex w-full items-center justify-between rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-left text-sm text-white disabled:opacity-60"
                        disabled={processAssignees.length === 0}
                      >
                        <span className="truncate">
                          {processAssignees.length === 0
                            ? 'No process users found'
                            : selectedAssignees.length === 0
                              ? 'Select process users'
                              : `${selectedAssignees.length} selected`}
                        </span>
                        <span className="text-slate-400">
                          {assigneeDropdownOpen ? '▲' : '▼'}
                        </span>
                      </button>
                      {assigneeDropdownOpen && processAssignees.length > 0 && (
                        <div className="absolute bottom-full left-0 z-20 mb-2 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 p-2 shadow-xl">
                          {processAssignees.map((u) => (
                            <label
                              key={u.uid}
                              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
                            >
                              <input
                                type="checkbox"
                                checked={selectedAssignees.includes(u.uid)}
                                onChange={() => toggleAssignee(u.uid)}
                                className="rounded border-slate-600 bg-slate-950 text-blue-600"
                              />
                              <span>{labelAssignableProcessUser(u)}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mt-3 text-xs font-medium text-slate-400">
                      Sales team (multi-select)
                    </p>
                    <div className="relative mt-2">
                      <button
                        type="button"
                        onClick={() =>
                          salesAssignees.length > 0 &&
                          setSalesAssigneeDropdownOpen((v) => !v)
                        }
                        className="flex w-full items-center justify-between rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-left text-sm text-white disabled:opacity-60"
                        disabled={salesAssignees.length === 0}
                      >
                        <span className="truncate">
                          {salesAssignees.length === 0
                            ? 'No sales users found'
                            : selectedSalesAssignees.length === 0
                              ? 'Select sales users'
                              : `${selectedSalesAssignees.length} selected`}
                        </span>
                        <span className="text-slate-400">
                          {salesAssigneeDropdownOpen ? '▲' : '▼'}
                        </span>
                      </button>
                      {salesAssigneeDropdownOpen &&
                        salesAssignees.length > 0 && (
                          <div className="absolute bottom-full left-0 z-20 mb-2 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 p-2 shadow-xl">
                            {salesAssignees.map((u) => (
                              <label
                                key={u.uid}
                                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedSalesAssignees.includes(
                                    u.uid,
                                  )}
                                  onChange={() =>
                                    toggleSalesAssignee(u.uid)
                                  }
                                  className="rounded border-slate-600 bg-slate-950 text-blue-600"
                                />
                                <span>
                                  {labelAssignableProcessUser(u)}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                    </div>
                  </>
                )}
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
