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
import { resolveAmbassadorName, resolveEliteAmbassadorName,resolveAmbassadorPhone} from '../lib/partnerOrg'
import {labelForLeadStatus,statusLabelMapFromStatuses} from '../lib/statusLabels'
import LeadDetailsModal from '../components/LeadDetailsModal'
import ModalCloseButton from '../components/ModalCloseButton'
import AmountInWordsHint from '../components/AmountInWordsHint'
import TablePagination from '../components/TablePagination'
import { usePagination } from '../hooks/usePagination'
import SearchableDropdown from '../components/SearchSelect'
import { useCategory } from '../hooks/useCategory';
import { useServices } from '../hooks/useServices';
import { State, City } from "country-state-city";
import { SOURCES } from '../lib/source'

const emptyForm = {
  clientName: '',
  clientPhoneNo: '',
  clientEmail: '',
  company: '',
  state:'',
  city: '',
  categoryId:'',
  serviceId:'',
  description: '',
}

export default function AmbassadorOtherLeads() {
    const { user, profile } = useAuth()
    const { leads, loading } = useLeads()
    const { users,usersById } = useUsers()
    const { category } = useCategory()
    const { services } = useServices()
    const { products, loading: productsLoading, error: productsError } = useProducts()
    const { ambassador:ambassadorRows } = useAmbassador()
    const { statuses } = useStatuses()
    const [selectedStateCode, setSelectedStateCode] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('')
    const [selectedService, setSelectedService] = useState([])
    const [cities, setCities] = useState([])
    const [modalOpen, setModalOpen] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)
    const [leadSearch, setLeadSearch] = useState('')
    const [viewLead, setViewLead] = useState(null)
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const states = State.getStatesOfCountry('IN')

    const ambassadorId = String(profile?.ambassadorId ?? '').trim()

    const referredById = ambassadorRows.find(
        item => item.id === ambassadorId
    )?.referredByUid
    
    const managerName = users.find(item=> item.id === referredById)?.displayName

    const ambassadorOrgName = useMemo(() => {
        if (!ambassadorId) return ''
        return ambassadorRows.find((p) => p.id === ambassadorId)?.name || ''
    }, [ambassadorRows, ambassadorId])

    const referredAmbassadorIds = useMemo(() => {
        if (!user?.uid) return new Set()
        const ids = []
        for (const a of ambassadorRows) {
        if (normalizedReferredByUid(a) === user.uid) ids.push(a.id)
        }
        return new Set(ids)
    }, [ambassadorRows, user?.uid])


    const myLeads = useMemo(() => {
        if (!ambassadorId) return []
        return leads.filter((l) => {
        const pid = String(l.ambassadorId ?? '').trim()
        if (pid === ambassadorId) return true
        const aid = String(l.ambassadorId ?? '').trim()
        return Boolean(aid && referredAmbassadorIds.has(aid))
        })
    }, [leads, ambassadorId, referredAmbassadorIds])

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

    const stateOptions = states.map((state) => ({
        value: state.isoCode,
        label: state.name,
    }))

    const citiesOptions = cities.map((city) => ({
        value: city.name,
        label: city.name,
    }))
    const categoryFilter = category.filter((cat) => {
        const data = cat.id !== "-Os1EruiNYLx2XjzRUdF";
        return data
    })
    const categoryOptions = categoryFilter.map((cat) => ({
        value: cat.id,
        label: cat.name,
    }))

    const serviceOptions = services.map((service) => ({
        value: service.id,
        category:service.category,
        label: service.name
    }))

    
    const filteredMyLeads = useMemo(() => {
        const term = leadSearch.trim().toLowerCase()
        let list = leads
        
        if (term) {
            list = list.filter((l) => {
                const company = String(l.company ?? '').toLowerCase()
                const clientName = String(l.clientName ?? '').toLowerCase()
                return company.includes(term) || clientName.includes(term)
            })
        }

        list = list.filter((l) => inDateRange(l.leadDate || '', fromDate, toDate))
        list = list.filter((l) => l.categoryId !== '-Os1EruiNYLx2XjzRUdF' && l?.ambassadorId === profile?.uid );
        const sorted = [...list]
        return sorted
    }, [
        leads,
        leadSearch,
        categoryFilter,
        fromDate,
        toDate,
    ])

    const {
        page: tablePage,
        setPage: setTablePage,
        pageSize: tablePageSize,
        setPageSize: setTablePageSize,
        total: tableTotal,
        totalPages: tableTotalPages,
        pageItems: tablePageItems,
    } = usePagination(filteredMyLeads)

    const handleStateChange = (e) => {
        const isoCode = e.target.value
        const selected = states.find((s) => s.isoCode === isoCode)
        setSelectedStateCode(isoCode)
        setForm((f) => ({ ...f, state: selected?.name ?? '', city: '' }))
        setCities(isoCode ? City.getCitiesOfState('IN', isoCode) : [])
    }

    const handleCategoryChange = (e) => {
        const value = e.target.value
        setSelectedCategory(value)
        setForm((f) => ({ ...f, categoryId: value, serviceId: '' }))
        setSelectedService(serviceOptions.filter((s) => s?.category === value))
    }

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
  
    function sourceNameFor(sourceId) {
      if (!sourceId) return '-'
      const s = SOURCES.find((item) => item.id == sourceId)
      return s?.label || sourceId
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

    function resetFormState() {
        setEditingId(null)
        setSelectedStateCode('')
        setSelectedCategory('')
        setSelectedService([])
        setCities([])
        setForm(emptyForm)
    }

    function openNew() {
        resetFormState()
        setModalOpen(true)
    }

    function openEdit(lead) {
        const stateCode = String(lead.stateCode ?? '').trim()
        const cityName =
            String(lead.city ?? '').trim() ||
            String(lead.location ?? '').split(',').pop()?.trim() ||
            ''
        const selected = states.find((s) => s.isoCode === stateCode)
        const categoryId = String(lead.categoryId ?? '').trim()

        setEditingId(lead.id)
        setSelectedStateCode(stateCode)
        setCities(stateCode ? City.getCitiesOfState('IN', stateCode) : [])
        setSelectedCategory(categoryId)
        setSelectedService(
            categoryId
                ? serviceOptions.filter((s) => s?.category === categoryId)
                : [],
        )
        setForm({
            clientName: lead.clientName ?? '',
            company: lead.company ?? '',
            clientPhoneNo: lead.clientPhoneNo ?? '',
            clientEmail: lead.clientEmail ?? '',
            state: selected?.name ?? lead.state ?? '',
            city: cityName,
            categoryId,
            serviceId: lead.serviceId ?? '',
            description: lead.description ?? '',
        })
        setModalOpen(true)
    }

    function sendTelegramMessage() {
        const BOT_TOKEN = import.meta.env.VITE_BOT_TOKEN
        const CHAT_ID = "-1003871644587"
        const message = `
        Created by ${profile.displayName} (Elite Ambassador)

        Hello Team,

        Here are new lead details:
        
        Company: ${form.company || '-'}
        Client Name: ${form.clientName || '-'}
        Product: ${productNameFor(form.productId)}
        Amount: ₹${Number(form.totalAmount || 0).toLocaleString('en-IN')}
        Status: ${labelForLeadStatus(statusLabelByValue, form.status) || 'New'}

        Thank you.
        `
        fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            chat_id: CHAT_ID,
            text: message,
            parse_mode: "Markdown"
        })
        })
        .then(res => res.json())
        .then(data => console.log("Sent:", data))
        .catch(err => console.error("Error:", err))
    }

    async function saveLead(e) {
        e.preventDefault()
        if (!user) return
        if (!ambassadorId) return
        setSaving(true)
        try {
        const existingLead =
            editingId != null ? leads.find((l) => l.id === editingId) : null

        const payload = {
            clientName: form.clientName.trim(),
            company: form.company.trim(),
            clientPhoneNo: form.clientPhoneNo.trim(),
            clientEmail: form.clientEmail.trim(),
            location: `${form.state.trim()}, ${form.city.trim()}`,
            stateCode: selectedStateCode,
            categoryId: form.categoryId || null,
            serviceId: form.serviceId || null,
            totalAmount: form.totalAmount || '',
            description: form.description.trim(),
            ambassadorId: ambassadorId,
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
            // sendTelegramMessage()
        }
        setSelectedStateCode('')
        setSelectedCategory('')
        setSelectedService([])
        setCities([])
        setForm(emptyForm)
        setModalOpen(false)
        } finally {
        setSaving(false)
        }
    }

    if (loading) {
        return <p className="text-slate-400">Loading…</p>
    }

    if (!ambassadorId) {
        return (
        <div className="space-y-4">
            <h1 className="text-2xl font-semibold text-white">Other leads</h1>
            <div className="rounded-xl border border-amber-800/70 bg-amber-950/30 px-4 py-4 text-sm text-amber-100">
            Your account is not linked to an elite ambassador record yet. Ask an admin to set{' '}
            <code className="text-amber-200">eliteAmbassadorId</code> on your user profile,
            or recreate your login from Elite ambassador master.
            </div>
        </div>
        )
    }

    function exportCsv() {
        const rows = filteredMyLeads
        .filter((lead) => inDateRange(lead.leadDate || '', fromDate, toDate))
        .map((lead) => [
            lead.clientName || '',
            lead.company || '',
            lead.clientPhoneNo || '',
            lead.clientEmail || '',
            `${lead.state || ''}, ${lead.city || ''}`,
            categoryNameFor(lead.categoryId || null),
            serviceNameFor(lead.serviceId || null),
            lead.description || '',
        ])

        downloadCsv(
        'my-leads.csv',
        [
            'Client Name',
            'Company Name',
            'Mobile No.',
            'Email',
            'Location',
            'Category',
            'Service',
            'Description',
        ],
        rows,
        )
    }

  return (
    <div className="min-w-0 space-y-4">
        <div className="grid grid-cols-10 gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className='col-span-10 lg:col-span-3'>
            <h1 className="text-2xl font-semibold text-white">Other leads</h1>
            </div>
            <div className="flex flex-col md:flex-row justify-end col-span-10 lg:col-span-7 w-full gap-3">
            <div>
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

            <div>
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
            <div>
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
            <div className='flex w-full md:w-auto justify-end items-end gap-2'>
                <div className='w-[50%] md:w-auto'>
                <button
                    type="button"
                    onClick={exportCsv}
                    className="rounded-lg w-full border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800"
                >
                    Export CSV
                </button>
                </div>
                <div className='w-[50%] md:w-auto'>
                <button
                    type="button"
                    onClick={openNew}
                    className="rounded-lg w-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
                >
                    New lead
                </button>
                </div>
            </div>
            </div>
        </div>

        <div className="max-w-full min-w-0 rounded-xl border border-slate-800 bg-slate-900/40 [-webkit-overflow-scrolling:touch]">
            <div className="overflow-x-auto">
            <table className="w-max min-w-full text-left text-xs sm:text-sm">
                <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-slate-500">
                <tr>
                    <th className="px-4 py-2 font-medium whitespace-nowrap">Sr. No.</th>
                    <th className="px-4 py-2 font-medium whitespace-nowrap">Full Name</th>
                    <th className="px-4 py-2 font-medium whitespace-nowrap">Company Name</th>
                    <th className="px-4 py-2 font-medium whitespace-nowrap">Mobile No</th>
                    <th className="px-4 py-2 font-medium whitespace-nowrap">Status</th>
                    <th className="px-4 py-2 font-medium whitespace-nowrap">Category</th>
                    <th className="px-4 py-2 font-medium whitespace-nowrap">Services</th>
                    <th className="px-4 py-2 font-medium whitespace-nowrap">Location</th>
                    <th className="px-4 py-2 font-medium whitespace-nowrap">Referred by</th>
                    <th className="px-4 py-2 font-medium whitespace-nowrap">Lead Date</th>
                    <th className="px-4 py-2 font-medium whitespace-nowrap">Source</th>
                    <th className="px-4 py-2 font-medium whitespace-nowrap">Action</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                {filteredMyLeads.length === 0 ? (
                    <tr>
                    <td colSpan={12} className="px-4 py-10 text-center text-slate-500">
                        You have no leads yet. Click New lead to add one.
                    </td>
                    </tr>
                ) : (
                    tablePageItems.map((lead,index) => (
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
                        <td className="px-4 py-1 text-xs text-slate-500">{sourceNameFor(lead?.sourceId) || '-'}</td>
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
                <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto overflow-x-visible rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl sm:p-6" role="dialog" aria-modal="true" aria-labelledby="lead-modal-title-elite-ambassador">
                    <div className="flex items-start justify-between gap-3">
                        <h2
                            id="lead-modal-title-elite-ambassador"
                            className="text-lg font-semibold text-white"
                        >
                            {editingId ? 'Edit lead' : 'New lead'}
                        </h2>
                        <ModalCloseButton onClick={() => { setModalOpen(false); resetFormState() }} />
                    </div>

                    <form onSubmit={saveLead} className="mt-6 space-y-4">
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-300">Company Name <span className='text-red-600 text-sm'>*</span></label>
                            <input value={form.company}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, company: e.target.value }))
                            }
                            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300">Name of client <span className='text-red-600 text-sm'>*</span></label>
                            <input value={form.clientName} onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300">Mobile No. <span className='text-red-600 text-sm'>*</span></label>
                            <input value={form.clientPhoneNo} onChange={(e) => setForm((f) => ({ ...f, clientPhoneNo: e.target.value }))}
                            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300">Email Id <span className='text-red-600 text-sm'>*</span></label>
                            <input value={form.clientEmail} onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))}className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"/>
                        </div>
                        <div className='col-span-2 md:col-span-1 lg:col-span-2'>
                            <label  className="block text-sm font-medium text-slate-300" htmlFor="state">State <span className='text-red-600 text-sm'>*</span></label>
                            <SearchableDropdown
                                placeholder="Search State…"
                                options={stateOptions}
                                value={selectedStateCode}
                                handleChange={handleStateChange}
                            />
                        </div>
                        <div className='col-span-2 md:col-span-1 lg:col-span-2'>
                            <label  className="block text-sm font-medium text-slate-300" htmlFor="city">City <span className='text-red-600 text-sm'>*</span></label>
                            <SearchableDropdown
                                placeholder={selectedStateCode ? 'Search City…' : 'Select state first'}
                                options={citiesOptions}
                                value={form.city}
                                handleChange={(e) =>
                                    setForm((f) => ({ ...f, city: e.target.value }))
                                }
                            />
                        </div>
                        <div className='col-span-2 md:col-span-1 lg:col-span-2'>
                            <label  className="block text-sm font-medium text-slate-300" htmlFor="category">Category <span className='text-red-600 text-sm'>*</span></label>
                            <SearchableDropdown
                                placeholder="Search Category…"
                                options={categoryOptions}
                                value={selectedCategory}
                                handleChange={handleCategoryChange}
                            />
                        </div>
                        <div className='col-span-2 md:col-span-1 lg:col-span-2'>
                            <label  className="block text-sm font-medium text-slate-300" htmlFor="service">Services <span className='text-red-600 text-sm'>*</span></label>
                            <SearchableDropdown
                                placeholder="Search Service…"
                                options={selectedService}
                                value={form.serviceId}
                                handleChange={(e) =>setForm((f) => ({ ...f, serviceId: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300">Description</label>
                            <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"/>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => { setModalOpen(false); resetFormState() }} className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">Cancel</button>
                            <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  )
}