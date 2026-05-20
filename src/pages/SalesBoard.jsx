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
import { assignedUids, leadReferredToUser, toAssignedMap } from '../lib/leads'
import {assignableProcessUsers,assignableSalesUsers,labelAssignableProcessUser,assignableManagementUsers} from '../lib/assignees'
import { labelForLeadStatus, statusLabelMapFromStatuses,} from '../lib/statusLabels'
import { downloadCsv, formatAmountForCsv, inDateRange } from '../lib/csv'
import { resolveEliteAmbassadorName } from '../lib/partnerOrg'
import LeadDetailsModal from '../components/LeadDetailsModal'
import ModalCloseButton from '../components/ModalCloseButton'
import AmountInWordsHint from '../components/AmountInWordsHint'
import TablePagination from '../components/TablePagination'
import SearchableDarkDropdown from '../components/SearchDarkSelect'
import { usePagination } from '../hooks/usePagination'

const emptyForm = {
  title: '',
  sourceEnabled: false,
  leadType:'',
  viaName: '',
  eliteAmbassadorId: '',
  ambassadorId: '',
  company: '',
  clientName: '',
  clientPhoneNo:'',
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

export default function SalesBoard() {
  const { user,profile } = useAuth()
  const { leads, loading } = useLeads()
  const { users, usersById, processUsers, salesUsers, managementUsers, error: usersError } = useUsers()
  const { products, loading: productsLoading, error: productsError } = useProducts()
  const { eliteAmbassador } = useEliteAmbassador()
  const { ambassador } = useAmbassador()
  const { statuses } = useStatuses()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [assignmentMode, setAssignmentMode] = useState('process')
  const [selectedAssignees, setSelectedAssignees] = useState([])
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false)
  const [selectedSalesAssignees, setSelectedSalesAssignees] = useState([])
  const [selectedManagementAssignees, setSelectedManagementAssignees] = useState([])
  const [salesAssigneeDropdownOpen, setSalesAssigneeDropdownOpen] = useState(false)
  const [managementAssigneeDropdownOpen, setManagementAssigneeDropdownOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [leadSearch, setLeadSearch] = useState('')
  const [viewLead, setViewLead] = useState(null)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedEliteAmbassador, setSelectedEliteAmbassador] = useState([])
  const [selectedAmbassador, setSelectedAmbassador] = useState([])

  const myLeads = useMemo(
    () =>
      leads.filter(
        (l) =>
          l.createdBy === user?.uid || leadReferredToUser(l, user?.uid),
      ),
    [leads, user?.uid],
  )

  const processAssignees = useMemo(
    () => assignableProcessUsers(processUsers, user?.uid, usersById),
    [processUsers, user?.uid, usersById],
  )

  const salesAssignees = useMemo(
    () => assignableSalesUsers(salesUsers, user?.uid, usersById),
    [salesUsers, user?.uid, usersById],
  )

  const managementAssignees = useMemo(
    () => assignableManagementUsers(managementUsers, user?.uid, usersById),
    [managementUsers, user?.uid, usersById],
  )

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
    const userData = users.find((user) => user.id === salesAssignedTo);
    return userData?.displayName
  }

  function productNameFor(productId) {
    if (!productId) return '-'
    const product = products.find((p) => p.id === productId)
    return product?.name || productId
  }

  function eliteAmbassadorNameFor(orgId, fallbackName = '') {
    return (
      resolveEliteAmbassadorName(orgId, fallbackName, eliteAmbassador) || '-'
    )
  }
  const eliteAmbassadorOptions = eliteAmbassador.map((p) => ({
    value: p.id,
    label: p.name || p.id,
  }))
  
  const ambassadorOptions = ambassador.map((a) => ({
    value: a.id,
    label: a.name || a.id,
  }))

  function openNew() {
    setEditingId(null)
    setForm(emptyForm)
    setAssignmentMode('process')
    setSelectedAssignees([])
    setAssigneeDropdownOpen(false)
    setManagementAssigneeDropdownOpen(false)
    setSelectedSalesAssignees([])
    setSalesAssigneeDropdownOpen(false)
    setModalOpen(true)
  }

  function openEdit(lead) {
    setEditingId(lead.id)
    setForm({
      title: lead.title ?? '',
      sourceEnabled: lead.sourceEnabled ?? '',
      eliteAmbassadorId: lead.eliteAmbassadorId ?? '',
      ambassadorId: lead.ambassadorId ?? '',
      leadType:lead.leadType ?? '',
      viaName: lead.viaName ?? '',
      company: lead.company ?? '',
      clientName: lead.clientName ?? '',
      clientPhoneNo: lead.clientPhoneNo ?? '',
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
    const managementUids = assignedUids(lead.managementAssignedTo)
    if (salesUids.length && !processUids.length && !managementUids.length) {
      setAssignmentMode('sales')
      setSelectedSalesAssignees(salesUids)
      setSelectedAssignees([])
      setSelectedManagementAssignees([])
    } else if (managementUids.length && !salesUids.length && !processUids.length){
      setAssignmentMode('management')
      setSelectedManagementAssignees(managementUids)
      setSelectedAssignees([])
      setSelectedSalesAssignees([])
    } else {
      setAssignmentMode('process')
      setSelectedAssignees(processUids)
      setSelectedSalesAssignees([])
      setSelectedManagementAssignees([])
    }
    setAssigneeDropdownOpen(false)
    setSalesAssigneeDropdownOpen(false)
    setManagementAssigneeDropdownOpen(false)
    setModalOpen(true)
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

  function toggleManagementAssignee(uid) {
    setSelectedManagementAssignees((prev) =>
      prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid],
    )
  }


  async function saveLead(e) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    try {
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
        sourceEnabled: form.sourceEnabled,
        viaName: form.viaName.trim(),
        leadType: form.leadType.trim(),
        eliteAmbassadorId: form.eliteAmbassadorId,
        ambassadorId: form.ambassadorId,
        company: form.company.trim(),
        clientName: form.clientName.trim(),
        clientPhoneNo: form.clientPhoneNo.trim(),
        location: form.location.trim(),
        bankName: form.bankName.trim(),
        onePagerLink: form.onePagerLink.trim(),
        leadDate: form.leadDate || '',
        description: form.description.trim(),
        status: form.status,
        updatedStatusDate: form.updatedStatusDate || '',
        createdBy: user.uid,
        assignedTo:
          assignmentMode === 'process'
            ? toAssignedMap(selectedAssignees)
            : null,
        salesAssignedTo:
          assignmentMode === 'sales'
            ? toAssignedMap(selectedSalesAssignees)
            : null,
        managementAssignedTo:
          assignmentMode === 'management'
            ? toAssignedMap(selectedManagementAssignees)
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
        lead.company || '',
        lead.clientName || '',
        lead.clientPhoneNo || '',
        lead.viaName || '',
        lead.location || '',
        productNameFor(lead.productId),
        labelForLeadStatus(statusLabelByValue, lead.status),
        processNames(lead?.assignedTo || lead?.salesAssignedTo || lead?.managementAssignedTo),
        salesNames(lead.createdBy),
        lead.leadDate || '',
        formatAmountForCsv(lead.totalAmount),
        lead.bankPayoutPercent || '',
        formatAmountForCsv(lead.bankPayoutAmount),
        lead.mandateSigned ? 'Yes' : 'No',
        lead.mandatePayoutPercent || '',
        formatAmountForCsv(lead.mandatePayoutAmount),
      ])

    downloadCsv(
      'sales-leads.csv',
      [
        'Elite ambassador',
        'Company',
        'Client Name',
        'Mobile No',
        'Via',
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
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className='md:col-span-4 lg:col-span-2'>
          <h1 className="text-2xl font-semibold text-white">My leads</h1>
          <p className="mt-1 text-sm text-slate-400 text-nowrap">
            Create leads and assign one or more process teammates
          </p>
        </div>
        <div className="md:col-span-4 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 items-end w-full gap-3">
          <div className="w-full">
            <label
              htmlFor="search-company-sales"
              className="block text-xs font-medium uppercase tracking-wide text-slate-500"
            >
              Search company
            </label>
            <input
              id="search-company-sales"
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
          <div>
            <button type="button" onClick={exportCsv} className="w-full rounded-lg border border-green-600/30 cursor-pointer px-4 py-2.5 text-sm font-semibold text-slate-200 bg-green-500/20 hover:bg-green-500/30">Export CSV</button>
          </div>
          <div>
            <button type="button" onClick={openNew} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">New lead</button>
          </div>
        </div>
      </div>

      <div className="max-w-full min-w-0 rounded-xl border border-slate-800 bg-slate-900/40 [-webkit-overflow-scrolling:touch]">
        <div className="overflow-x-auto">
          <table className="w-max min-w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium whitespace-nowrap">Elite ambassador</th>
                <th className="px-4 py-2 font-medium whitespace-nowrap">Company</th>
                <th className="px-4 py-2 font-medium whitespace-nowrap">Client name</th>
                <th className="px-4 py-2 font-medium whitespace-nowrap">Via</th>
                <th className="px-4 py-2 font-medium whitespace-nowrap">Location</th>
                <th className="px-4 py-2 font-medium whitespace-nowrap">Product</th>
                <th className="px-4 py-2 font-medium whitespace-nowrap">Status</th>
                <th className="px-4 py-2 font-medium whitespace-nowrap">Processed by</th>
                <th className="px-4 py-2 font-medium whitespace-nowrap">Sales Owner</th>
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
                      {eliteAmbassadorNameFor(
                        lead.eliteAmbassadorId,
                        lead.eliteAmbassadorName,
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-1 text-slate-400">
                      {lead.company || '-'}
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
                        {labelForLeadStatus(statusLabelByValue, lead.status) ||'New'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-1 text-xs text-slate-400">
                      {processNames(lead?.assignedTo || lead?.salesAssignedTo || lead?.managementAssignedTo)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-1 text-xs text-slate-400">
                      {salesNames(lead?.createdBy)}
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
          showPartner={Boolean(
            viewLead.eliteAmbassadorId ||
              viewLead.eliteAmbassadorName ||
              viewLead.ambassadorId ||
              viewLead.ambassadorName,
          )}
          onClose={() => setViewLead(null)}
        />
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto overflow-x-visible rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-modal-title"
          >
            <div className="flex items-start justify-between gap-3">
              <h2
                id="lead-modal-title"
                className="text-lg font-semibold text-white"
              >
                {editingId ? 'Edit lead' : 'New lead'}
              </h2>
              <ModalCloseButton onClick={() => setModalOpen(false)} />
            </div>

            <form onSubmit={saveLead} className="mt-6 space-y-4">
              <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-300">
                  <input type="checkbox" checked={form.sourceEnabled}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        sourceEnabled: e.target.checked,
                      }))
                    }
                    className="rounded border-slate-600 bg-slate-950 text-blue-600"
                  />
                  <span>Source</span>
                </label>
                {form.sourceEnabled && (
                  <>
                    <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-3">
                      <div className="flex gap-4">
                        <div>
                          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-300">
                            <input
                              type="radio"
                              name='leadType'
                              checked={form.leadType === "via"}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  leadType: "via",
                                  ambassadorName: '' }),
                                )
                              }
                              className="rounded border-slate-600 bg-slate-950 text-blue-600"
                            />
                            <span>Via</span>
                          </label>
                        </div>
                        <div>
                          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-300">
                            <input
                              type="radio"
                              name='leadType'
                              checked={form.leadType === "elite_ambassador"}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  leadType: "elite_ambassador",
                                  viaName: '' }),
                                )
                              }
                              className="rounded border-slate-600 bg-slate-950 text-blue-600"
                            />
                            <span>Elite Ambassador</span>
                          </label>
                        </div>
                        <div>
                          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-300">
                            <input
                              type="radio"
                              name='leadType'
                              checked={form.leadType === "ambassador"}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  leadType: "ambassador",
                                  viaName: '' }),
                                )
                              }
                              className="rounded border-slate-600 bg-slate-950 text-blue-600"
                            />
                            <span>Ambassador</span>
                          </label>
                        </div>
                      </div>
                      
                      {form.leadType === "via" && (
                        <>
                          <div>
                            <label htmlFor="sales-lead-via-name" className="block text-xs font-medium text-slate-400"> 
                              Name
                            </label>
                            <input
                              id="sales-lead-via-name"
                              type="text"
                              value={form.viaName}
                              onChange={(e) =>
                                setForm((f) => ({ ...f, viaName: e.target.value }))
                              }
                              placeholder="Referrer or channel name"
                              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                            />
                          </div>
                        </>
                      )}
                      {form.leadType === "elite_ambassador" && (
                        <div className='grid grid-cols-2'>
                          <div>
                            <label className="block text-xs font-medium text-slate-400">Elite Ambassador</label>
                            <SearchableDarkDropdown name={"eliteAmbassadorId"} options={eliteAmbassadorOptions} value={form.eliteAmbassadorId} handleChange={(e) => setForm((f) => ({ ...f, eliteAmbassadorId: e.target.value }))}/>
                          </div>
                        </div>
                      )}
                      {form.leadType === "ambassador" && (
                        <div className='grid grid-cols-2'>
                          <div>
                            <label className="block text-xs font-medium text-slate-400">Ambassador</label>
                            <SearchableDarkDropdown name="ambassadorId" options={ambassadorOptions} value={form.ambassadorId} handleChange={(e)=>setForm((f) => ({ ...f,ambassadorId: e.target.value }))}/>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
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
                <label className="block text-sm font-medium text-slate-300">Mobile No.</label>
                <input
                  value={form.clientPhoneNo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clientPhoneNo: e.target.value }))
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
              <section className="rounded-xl border border-slate-700/80 bg-slate-900/40 p-4">
                <h3 className="text-sm font-semibold text-blue-300">
                  Revenue Details
                </h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-300">
                      Bank Payout Percent (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.bankPayoutPercent}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, bankPayoutPercent: e.target.value }))
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
                        name="mandateSigned"
                        checked={form.mandateSigned === true}
                        onChange={() => setForm((f) => ({ ...f, mandateSigned: true }))}
                      />
                      Yes
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="mandateSigned"
                        checked={form.mandateSigned === false}
                        onChange={() => setForm((f) => ({ ...f, mandateSigned: false }))}
                      />
                      No
                    </label>
                  </div>
                </div>

                {form.mandateSigned && (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-300">
                        Mandate Payout Percent (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.mandatePayoutPercent}
                        onChange={(e) =>
                          setForm((f) => ({
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
                        min="0"
                        step="0.01"
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
                  <button
                    type="button"
                    onClick={() => {
                      setAssignmentMode('management')
                      setSelectedManagementAssignees([])
                      setManagementAssigneeDropdownOpen(false)
                    }}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      assignmentMode === 'management'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Management
                  </button>
                </div>
                {usersError && (
                  <p className="mt-2 rounded-lg border border-amber-800/70 bg-amber-950/40 px-3 py-2 text-xs text-amber-200">
                    Could not read users from Realtime Database
                    (<code>permission_denied</code>). Publish rules that allow
                    authenticated read on <code>/users</code>.
                  </p>
                )}
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
                ) : assignmentMode === 'sales' ? (
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
                ) : (
                  <>
                    <p className="mt-3 text-xs font-medium text-slate-400">
                      Management team (multi-select)
                    </p>
                    <div className="relative mt-2">
                      <button
                        type="button"
                        onClick={() =>
                          managementAssignees.length > 0 &&
                          setManagementAssigneeDropdownOpen((v) => !v)
                        }
                        className="flex w-full items-center justify-between rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-left text-sm text-white disabled:opacity-60"
                        disabled={managementAssignees.length === 0}
                      >
                        <span className="truncate">
                          {managementAssignees.length === 0
                            ? 'No sales users found'
                            : selectedManagementAssignees.length === 0
                              ? 'Select sales users'
                              : `${selectedManagementAssignees.length} selected`}
                        </span>
                        <span className="text-slate-400">
                          {managementAssigneeDropdownOpen ? '▲' : '▼'}
                        </span>
                      </button>
                      {managementAssigneeDropdownOpen &&
                        managementAssignees.length > 0 && (
                          <div className="absolute bottom-full left-0 z-20 mb-2 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 p-2 shadow-xl">
                            {managementAssignees.map((u) => (
                              <label
                                key={u.uid}
                                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedManagementAssignees.includes(
                                    u.uid,
                                  )}
                                  onChange={() =>
                                    toggleManagementAssignee(u.uid)
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
