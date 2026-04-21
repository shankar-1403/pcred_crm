import { useMemo, useState } from 'react'
import { push, ref, set, update } from 'firebase/database'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { useLeads } from '../hooks/useLeads'
import { useUsers } from '../hooks/useUsers'
import { useProducts } from '../hooks/useProducts'
import { useEliteAmbassador } from '../hooks/useEliteAmbassador'
import { useAmbassador } from '../hooks/useAmbassador'
import { useStatuses } from '../hooks/useStatuses'
import { assignedUids, normalizedReferredByUid, toAssignedMap } from '../lib/leads'
import { downloadCsv, formatAmountForCsv, inDateRange } from '../lib/csv'
import {
  resolveAmbassadorName,
  resolveEliteAmbassadorName,
  resolveAmbassadorPhone
} from '../lib/partnerOrg'
import {
  labelForLeadStatus,
  statusLabelMapFromStatuses,
} from '../lib/statusLabels'
import LeadDetailsModal from '../components/LeadDetailsModal'
import ModalCloseButton from '../components/ModalCloseButton'
import AmountInWordsHint from '../components/AmountInWordsHint'
import TablePagination from '../components/TablePagination'
import { usePagination } from '../hooks/usePagination'

const emptyForm = {
  title: '',
  viaEnabled: false,
  viaName: '',
  company: '',
  clientName: '',
  location: '',
  bankName: '',
  onePagerLink: '',
  leadDate: '',
  description: '',
  status: '',
  updatedStatusDate: '',
  productId: '',
  totalAmount: '',
  bankPayoutPercent: '',
  mandateSigned: false,
  mandatePayoutPercent: '',
}

export default function EliteAmbassadorBoard() {
  const { user, profile } = useAuth()
  const { leads, loading } = useLeads()
  const { usersById } = useUsers()
  const { products, loading: productsLoading, error: productsError } =
    useProducts()
  const { eliteAmbassador } = useEliteAmbassador()
  const { ambassador: ambassadorRows } = useAmbassador()
  const { statuses } = useStatuses()

  const eliteAmbassadorId = String(profile?.eliteAmbassadorId ?? '').trim()

  const eliteOrgName = useMemo(() => {
    if (!eliteAmbassadorId) return ''
    return eliteAmbassador.find((p) => p.id === eliteAmbassadorId)?.name || ''
  }, [eliteAmbassador, eliteAmbassadorId])

  const referredAmbassadorIdsForElite = useMemo(() => {
    if (!user?.uid) return new Set()
    const ids = []
    for (const a of ambassadorRows) {
      if (normalizedReferredByUid(a) === user.uid) ids.push(a.id)
    }
    return new Set(ids)
  }, [ambassadorRows, user?.uid])

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [assignmentMode, setAssignmentMode] = useState('process')
  const [selectedAssignees, setSelectedAssignees] = useState([])
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false)
  const [selectedSalesAssignees, setSelectedSalesAssignees] = useState([])
  const [salesAssigneeDropdownOpen, setSalesAssigneeDropdownOpen] =
    useState(false)
  const [saving, setSaving] = useState(false)
  const [leadSearch, setLeadSearch] = useState('')
  const [viewLead, setViewLead] = useState(null)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const myLeads = useMemo(() => {
    if (!eliteAmbassadorId) return []
    return leads.filter((l) => {
      const pid = String(l.eliteAmbassadorId ?? '').trim()
      if (pid === eliteAmbassadorId) return true
      const aid = String(l.ambassadorId ?? '').trim()
      return Boolean(aid && referredAmbassadorIdsForElite.has(aid))
    })
  }, [leads, eliteAmbassadorId, referredAmbassadorIdsForElite])

  const filteredMyLeads = useMemo(() => {
    const term = leadSearch.trim().toLowerCase()
    let list = myLeads
    if (term) {
      list = list.filter((l) => {
        const company = String(l.company ?? '').toLowerCase()
        const clientName = String(l.clientName ?? '').toLowerCase()
        return company.includes(term) || clientName.includes(term)
      })
    }
    list = list.filter((l) => inDateRange(l.leadDate || '', fromDate, toDate))
    return list
  }, [myLeads, leadSearch, fromDate, toDate])

  const {
    page: tablePage,
    setPage: setTablePage,
    pageSize: tablePageSize,
    setPageSize: setTablePageSize,
    total: tableTotal,
    totalPages: tableTotalPages,
    pageItems: tablePageItems,
  } = usePagination(filteredMyLeads)

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

  function processNames(assignedTo) {
    const assignees = assignedUids(assignedTo)
    if (!assignees.length) return 'Unassigned'
    return assignees
      .map((uid) => {
        const u = usersById[uid]
        return u?.displayName || u?.email || uid.slice(0, 8)
      })
      .join(', ')
  }

  function salesNames(salesAssignedTo) {
    const assignees = assignedUids(salesAssignedTo)
    if (!assignees.length) return '-'
    return assignees
      .map((uid) => {
        const u = usersById[uid]
        return u?.displayName || u?.email || uid.slice(0, 8)
      })
      .join(', ')
  }

  function productNameFor(productId) {
    if (!productId) return '-'
    const product = products.find((p) => p.id === productId)
    return product?.name || productId
  }

  function ambassadorNameFor(ambassadorId, fallbackName = '') {
    return (
      resolveAmbassadorName(ambassadorId, fallbackName, ambassadorRows) || '-'
    )
  }

  function ambassadorPhoneDisplay(lead) {
    const phone = resolveAmbassadorPhone(
      lead.ambassadorId,
      lead.ambassadorPhoneNo,
      ambassadorRows,
    )
    return phone || '-'
  }

  function eliteAmbassadorNameFor(orgId, fallbackName = '') {
    return (
      resolveEliteAmbassadorName(orgId, fallbackName, eliteAmbassador) || '-'
    )
  }

  function openNew() {
    setEditingId(null)
    setForm(emptyForm)
    setAssignmentMode('process')
    setSelectedAssignees([])
    setAssigneeDropdownOpen(false)
    setSelectedSalesAssignees([])
    setSalesAssigneeDropdownOpen(false)
    setModalOpen(true)
  }

  function openEdit(lead) {
    setEditingId(lead.id)
    setForm({
      title: lead.title ?? '',
      viaEnabled: Boolean(String(lead.viaName ?? '').trim()),
      viaName: lead.viaName ?? '',
      company: lead.company ?? '',
      clientName: lead.clientName ?? '',
      location: lead.location ?? '',
      bankName: lead.bankName ?? '',
      onePagerLink: lead.onePagerLink ?? '',
      leadDate: lead.leadDate ?? '',
      description: lead.description ?? '',
      status: lead.status ?? '',
      updatedStatusDate: lead.updatedStatusDate ?? '',
      productId: lead.productId ?? '',
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
    setModalOpen(true)
  }

  async function saveLead(e) {
    e.preventDefault()
    if (!user) return
    if (!eliteAmbassadorId) return
    setSaving(true)
    try {
      const existingLead =
        editingId != null ? leads.find((l) => l.id === editingId) : null

      let eliteAmbassadorIdVal = null
      let eliteAmbassadorNameVal = ''
      let referredSnap = ''
      let ambassadorIdVal = null
      let ambassadorNameVal = ''

      const eliteRow = eliteAmbassador.find((p) => p.id === eliteAmbassadorId)
      referredSnap = normalizedReferredByUid(eliteRow)
      eliteAmbassadorIdVal = eliteAmbassadorId
      eliteAmbassadorNameVal = eliteOrgName || ''
      if (existingLead?.ambassadorId) {
        ambassadorIdVal = existingLead.ambassadorId
        ambassadorNameVal = String(existingLead.ambassadorName ?? '')
      }

      const baseAmount = Number.parseFloat(form.totalAmount || 0) || 0
      const bankPercent = Number.parseFloat(form.bankPayoutPercent || 0) || 0
      const mandatePercent =
        Number.parseFloat(form.mandatePayoutPercent || 0) || 0
      const bankPayoutAmount = (baseAmount * bankPercent) / 100
      const mandatePayoutAmount = form.mandateSigned
        ? (baseAmount * mandatePercent) / 100
        : 0

      const payload = {
        title: form.title.trim(),
        viaName: form.viaEnabled ? form.viaName.trim() : '',
        company: form.company.trim(),
        clientName: form.clientName.trim(),
        location: form.location.trim(),
        bankName: form.bankName.trim(),
        onePagerLink: form.onePagerLink.trim(),
        leadDate: form.leadDate || '',
        description: form.description.trim(),
        status: form.status,
        updatedStatusDate: form.updatedStatusDate || '',
        createdBy: existingLead?.createdBy ?? user.uid,
        assignedTo:
          assignmentMode === 'process'
            ? toAssignedMap(selectedAssignees)
            : null,
        salesAssignedTo:
          assignmentMode === 'sales'
            ? toAssignedMap(selectedSalesAssignees)
            : null,
        productId: form.productId || null,
        totalAmount: form.totalAmount || '',
        bankPayoutPercent: form.bankPayoutPercent || '',
        bankPayoutAmount: Number(bankPayoutAmount.toFixed(2)),
        mandateSigned: Boolean(form.mandateSigned),
        mandatePayoutPercent: form.mandateSigned
          ? form.mandatePayoutPercent || ''
          : '',
        mandatePayoutAmount: Number(mandatePayoutAmount.toFixed(2)),
        updatedAt: Date.now(),
        eliteAmbassadorId: eliteAmbassadorIdVal,
        eliteAmbassadorName: eliteAmbassadorNameVal,
        referredByUid: referredSnap || null,
        ambassadorId: ambassadorIdVal,
        ambassadorName: ambassadorNameVal,
      }
      if (editingId) {
        await update(ref(db, `leads/${editingId}`), payload)
      } else {
        const newRef = push(ref(db, 'leads'))
        await set(newRef, {
          ...payload,
          createdAt: Date.now(),
        })
      }
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-slate-400">Loading…</p>
  }

  if (!eliteAmbassadorId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-white">My leads</h1>
        <div className="rounded-xl border border-amber-800/70 bg-amber-950/30 px-4 py-4 text-sm text-amber-100">
          Your account is not linked to an elite ambassador record yet. Ask an admin to set{' '}
          <code className="text-amber-200">eliteAmbassadorId</code> on your user profile,
          or recreate your login from Elite ambassador master.
        </div>
      </div>
    )
  }

  const baseAmount = Number.parseFloat(form.totalAmount || 0) || 0
  const bankPercent = Number.parseFloat(form.bankPayoutPercent || 0) || 0
  const mandatePercent = Number.parseFloat(form.mandatePayoutPercent || 0) || 0
  const bankAmount = (baseAmount * bankPercent) / 100
  const mandateAmount = form.mandateSigned ? (baseAmount * mandatePercent) / 100 : 0
  const totalRevenue = bankAmount + mandateAmount

  function exportCsv() {
    const rows = filteredMyLeads
      .filter((lead) => inDateRange(lead.leadDate || '', fromDate, toDate))
      .map((lead) => [
        eliteAmbassadorNameFor(lead.eliteAmbassadorId, lead.eliteAmbassadorName),
        ambassadorNameFor(lead.ambassadorId, lead.ambassadorName),
        lead.viaName || '',
        lead.company || '',
        lead.clientName || '',
        lead.location || '',
        productNameFor(lead.productId),
        labelForLeadStatus(statusLabelByValue, lead.status),
        processNames(lead.assignedTo),
        salesNames(lead.salesAssignedTo),
        lead.leadDate || '',
        formatAmountForCsv(lead.totalAmount),
        lead.bankPayoutPercent || '',
        formatAmountForCsv(lead.bankPayoutAmount),
        lead.mandateSigned ? 'Yes' : 'No',
        lead.mandatePayoutPercent || '',
        formatAmountForCsv(lead.mandatePayoutAmount),
      ])

    downloadCsv(
      'my-leads.csv',
      [
        'Elite ambassador',
        'Ambassador',
        'Via',
        'Company',
        'Client Name',
        'Location',
        'Product',
        'Status',
        'Processed By',
        'Sales',
        'Lead Date',
        'Required Amount',
        'Bank Payout %',
        'Bank Payout Amount',
        'Mandate Signed',
        'Mandate Payout %',
        'Mandate Payout Amount',
      ],
      rows,
    )
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">My leads</h1>
          <p className="mt-1 text-sm text-slate-400">
            Create leads, set revenue details, and assign process or sales teammates.
            {eliteOrgName ? (
              <span className="block text-slate-500">Organization: {eliteOrgName}</span>
            ) : null}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end sm:gap-4">
          <div className="w-full sm:w-[260px]">
            <label
              htmlFor="search-company-elite-ambassador"
              className="block text-xs font-medium uppercase tracking-wide text-slate-500"
            >
              Search company
            </label>
            <input
              id="search-company-elite-ambassador"
              type="text"
              value={leadSearch}
              onChange={(e) => setLeadSearch(e.target.value)}
              placeholder="Type company name..."
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          <div className="w-full sm:w-auto">
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
              From
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
              To
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm text-white"
            />
          </div>

          <button
            type="button"
            onClick={exportCsv}
            className="rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800"
          >
            Export CSV
          </button>

          <button
            type="button"
            onClick={openNew}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
          >
            New lead
          </button>
        </div>
      </div>

      <div className="max-w-full min-w-0 rounded-xl border border-slate-800 bg-slate-900/40 [-webkit-overflow-scrolling:touch]">
        <div className="overflow-x-auto">
          <table className="w-max min-w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium whitespace-nowrap">Company</th>
                <th className="px-4 py-2 font-medium whitespace-nowrap">Ambassador</th>
                <th className="px-4 py-2 font-medium whitespace-nowrap">Ambassador phone</th>
                <th className="px-4 py-2 font-medium whitespace-nowrap">Client name</th>
                <th className="px-4 py-2 font-medium whitespace-nowrap">Via</th>
                <th className="px-4 py-2 font-medium whitespace-nowrap">Location</th>
                <th className="px-4 py-2 font-medium whitespace-nowrap">Product</th>
                <th className="px-4 py-2 font-medium whitespace-nowrap">Status</th>
                <th className="px-4 py-2 font-medium whitespace-nowrap">Processed by</th>
                <th className="px-4 py-2 font-medium whitespace-nowrap">Sales</th>
                <th className="px-4 py-2 font-medium whitespace-nowrap text-right">Required Amount</th>
                <th className="px-4 py-2 font-medium whitespace-nowrap">Date</th>
                <th className="px-4 py-2 font-medium whitespace-nowrap">Updated status date</th>
                <th className="px-4 py-2 font-medium whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredMyLeads.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-10 text-center text-slate-500">
                    You have no leads yet. Click New lead to add one.
                  </td>
                </tr>
              ) : (
                tablePageItems.map((lead) => (
                  <tr key={lead.id} className="text-slate-300">
                    <td className="whitespace-nowrap px-4 py-1 text-slate-400">
                      {lead.company || '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-1 text-slate-400">
                      {ambassadorNameFor(lead.ambassadorId, lead.ambassadorName)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-1 text-slate-400">
                      {ambassadorPhoneDisplay(lead)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-1 text-slate-400">
                      {lead.clientName || '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-1 text-slate-400">
                      {lead.viaName || '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-1 text-slate-400">{lead.location || '-'}</td>
                    <td className="whitespace-nowrap px-4 py-1 text-slate-400">
                      {productNameFor(lead.productId)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-1">
                      <span className="inline-block whitespace-nowrap rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-blue-300">
                        {labelForLeadStatus(statusLabelByValue, lead.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-1 text-xs text-slate-400">
                      {processNames(lead.assignedTo)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-1 text-xs text-slate-400">
                      {salesNames(lead.salesAssignedTo)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-1 text-right text-slate-400">
                      ₹ {Number(lead?.totalAmount).toLocaleString('en-IN') || 0}
                    </td>
                    <td className="whitespace-nowrap px-4 py-1 text-xs text-slate-500">
                      {lead.leadDate || '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-1 text-xs text-slate-500">
                      {lead.updatedStatusDate || '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-1">
                      <div className="flex flex-nowrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(lead)}
                          title="Edit"
                          className="rounded-lg border border-slate-600 px-2 py-1 text-sm text-slate-300 hover:bg-slate-800"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewLead(lead)}
                          title="View details"
                          className="rounded-lg border border-slate-600 px-2 py-1 text-sm text-slate-300 hover:bg-slate-800"
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
          showPartner
          onClose={() => setViewLead(null)}
        />
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto overflow-x-visible rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-modal-title-elite-ambassador"
          >
            <div className="flex items-start justify-between gap-3">
              <h2
                id="lead-modal-title-elite-ambassador"
                className="text-lg font-semibold text-white"
              >
                {editingId ? 'Edit lead' : 'New lead'}
              </h2>
              <ModalCloseButton onClick={() => setModalOpen(false)} />
            </div>

            <form onSubmit={saveLead} className="mt-6 space-y-4">
              <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.viaEnabled}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        viaEnabled: e.target.checked,
                        ...(e.target.checked ? {} : { viaName: '' }),
                      }))
                    }
                    className="rounded border-slate-600 bg-slate-950 text-blue-600"
                  />
                  <span>Via</span>
                </label>
                {form.viaEnabled && (
                  <div>
                    <label
                      htmlFor="elite-ambassador-lead-via-name"
                      className="block text-xs font-medium text-slate-400"
                    >
                      Name
                    </label>
                    <input
                      id="elite-ambassador-lead-via-name"
                      type="text"
                      value={form.viaName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, viaName: e.target.value }))
                      }
                      placeholder="Referrer or channel name"
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Company
                </label>
                <input
                  value={form.company}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, company: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Name of client
                </label>
                <input
                  value={form.clientName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clientName: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Location
                </label>
                <input
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Bank Name
                </label>
                <input
                  value={form.bankName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bankName: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  One pager link
                </label>
                <input
                  type="url"
                  value={form.onePagerLink}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, onePagerLink: e.target.value }))
                  }
                  placeholder="https://..."
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Date
                </label>
                <input
                  type="date"
                  value={form.leadDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, leadDate: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value }))
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
                  value={form.updatedStatusDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, updatedStatusDate: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Product
                </label>
                <select
                  value={form.productId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, productId: e.target.value }))
                  }
                  disabled={productsLoading || products.length === 0}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white disabled:opacity-60"
                >
                  <option value="">
                    {productsLoading ? 'Loading products…' : 'Select product'}
                  </option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {productsError && (
                  <p className="mt-2 text-xs text-amber-200">
                    Could not load products.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Required Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.totalAmount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, totalAmount: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
                <AmountInWordsHint value={form.totalAmount} />
              </div>


              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
