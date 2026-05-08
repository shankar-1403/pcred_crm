import { useMemo, useState } from 'react'
import { ref, serverTimestamp, update } from 'firebase/database'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { useLeads } from '../hooks/useLeads'
import { useEliteAmbassador } from '../hooks/useEliteAmbassador'
import { useUsers } from '../hooks/useUsers'
import { assignedUids, leadReferredToUser } from '../lib/leads'
import { useProducts } from '../hooks/useProducts'
import { useCategory } from '../hooks/useCategory'
import { useServices } from '../hooks/useServices'
import { useStatuses } from '../hooks/useStatuses'
import LeadDetailsModal from '../components/LeadDetailsModal'
import ModalCloseButton from '../components/ModalCloseButton'
import AmountInWordsHint from '../components/AmountInWordsHint'
import { downloadCsv, inDateRange } from '../lib/csv'
import { resolveEliteAmbassadorName, resolveEliteAmbassadorPhone} from '../lib/partnerOrg'
import TablePagination from '../components/TablePagination'
import { usePagination } from '../hooks/usePagination'
import {labelForLeadStatus,statusLabelMapFromStatuses,} from '../lib/statusLabels'

export default function Employees() {
    const { user } = useAuth()
    const { products, loading: productsLoading, error: productsError } = useProducts()
    const { statuses } = useStatuses()
    const { category } = useCategory()
    const { services } = useServices()
    const { eliteAmbassador } = useEliteAmbassador()
    const { leads, loading } = useLeads()
    const { usersById } = useUsers()
    const [leadSearch, setLeadSearch] = useState('')
    const [viewLead, setViewLead] = useState(null)
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [editLeadId, setEditLeadId] = useState(null)
    const [editForm, setEditForm] = useState({
        company: '',
        clientName: '',
        location: '',
        leadDate: '',
        status: '',
        productId: '',
    })
    const [savingEdit, setSavingEdit] = useState(false)

    const assignedToMe = useMemo(() => {
        if (!user) return []
        return leads.filter((l) => {
        const uids = assignedUids(l.assignedTo)
        return (
            uids.includes(user.uid) || l.createdBy === user?.uid || leadReferredToUser(l, user.uid)
        )
        })
    }, [leads, user])

    const filteredAssignedToMe = useMemo(() => {
        const term = leadSearch.trim().toLowerCase()
        let list = assignedToMe
        if (term) {
        list = list.filter((l) => {
            const company = String(l.company ?? '').toLowerCase()
            const clientName = String(l.clientName ?? '').toLowerCase()
            return company.includes(term) || clientName.includes(term)
        })
        }
        list = list.filter((l) => inDateRange(l.leadDate || '', fromDate, toDate))
        return list
    }, [assignedToMe, leadSearch, fromDate, toDate])

    const {
        page: tablePage,
        setPage: setTablePage,
        pageSize: tablePageSize,
        setPageSize: setTablePageSize,
        total: tableTotal,
        totalPages: tableTotalPages,
        pageItems: tablePageItems,
    } = usePagination(filteredAssignedToMe)
    

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

    if (loading) {
        return <p className="text-slate-400">Loading…</p>
    }

    function exportCsv() {
        const rows = filteredAssignedToMe
        .filter((lead) => inDateRange(lead.leadDate || '', fromDate, toDate))
        .map((lead) => [
            lead.company || '',
            lead.clientName || '',
            lead.location || '',
            products.find((p) => p.id === lead.productId)?.name || '',
            category.find((p) => p.id === lead.categoryId)?.name || '',
            services.find((p) => p.id === lead.serviceId)?.name || '',
            labelForLeadStatus(statusLabelByValue, lead.status),
            lead.leadDate || '',
        ])

        downloadCsv(
        'emmployee-leads.csv',
        [
            'Company',
            'Client Name',
            'Location',
            'Product',
            'Category',
            'Services',
            'Status',
            'Lead Date',
        ],
        rows,
        )
    }

  return (
    <div className="min-w-0 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
            <h1 className="text-2xl font-semibold text-white">My Leads</h1>
            </div>

            <div className="flex flex-col gap-2 sm:w-[320px]">
            <label htmlFor="search-company-process" className="block text-xs font-medium uppercase tracking-wide text-slate-500">Search company</label>
                <input
                    id="search-company-process"
                    type="text"
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                    placeholder="Type company name..."
                    className="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                />
            </div>
            <div className="flex gap-2">
            <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">From</label>
                <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="mt-1 rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm text-white"
                />
            </div>
            <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">To</label>
                <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="mt-1 rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm text-white"
                />
            </div>
            <button
                type="button"
                onClick={exportCsv}
                className="mt-5 rounded-lg bg-green-500/20 border border-green-500/30 cursor-pointer px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-green-500/30"
            >
                Export CSV
            </button>
            </div>
        </div>

        <div className="max-w-full min-w-0 rounded-xl border border-slate-800 bg-slate-900/40 [-webkit-overflow-scrolling:touch]">
            <div className="overflow-x-auto">
            <table className="w-full min-w-360 table-auto text-left text-xs sm:text-sm">
                <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-slate-500">
                <tr>
                    <th className="px-4 py-2 font-medium whitespace-nowrap">Company</th>
                    <th className="px-4 py-2 font-medium whitespace-nowrap">Client name</th>
                    <th className="px-4 py-2 font-medium whitespace-nowrap">Location</th>
                    <th className="px-4 py-2 font-medium whitespace-nowrap">Product</th>
                    <th className="px-4 py-2 font-medium whitespace-nowrap">Category</th>
                    <th className="px-4 py-2 font-medium whitespace-nowrap">Service</th>
                    <th className="px-4 py-2 font-medium whitespace-nowrap">Status</th>
                    <th className="px-4 py-2 font-medium whitespace-nowrap">Lead date</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                {filteredAssignedToMe.length === 0 ? (
                    <tr>
                        <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                            No leads
                        </td>
                    </tr>
                ) : (
                    tablePageItems.map((lead) => (
                    <tr key={lead.id} className="text-slate-300">
                        <td className="px-4 py-1 text-slate-400 whitespace-nowrap">{lead.company || '-'}</td>
                        <td className="px-4 py-1 text-slate-400 whitespace-nowrap">{lead.clientName || '-'}</td>
                        <td className="px-4 py-1 text-slate-400 whitespace-nowrap">{lead.location || '-'}</td>
                        <td className="px-4 py-1 text-slate-400 whitespace-nowrap">
                            {products.find((p) => p.id === lead.productId)?.name || '-'}
                        </td>
                        <td className="px-4 py-1 text-slate-400 whitespace-nowrap">
                            {category.find((p) => p.id === lead.categoryId)?.name || '-'}
                        </td>
                        <td className="px-4 py-1 text-slate-400 whitespace-nowrap">
                            {services.find((p) => p.id === lead.serviceId)?.name || '-'}
                        </td>
                        <td className="px-4 py-1 text-slate-400 whitespace-nowrap">
                            <span className="inline-block whitespace-nowrap rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-blue-300">{labelForLeadStatus(statusLabelByValue, lead.status) ||'New'}</span>
                        </td>
                        <td className="px-4 py-1 text-xs text-slate-500 whitespace-nowrap">{lead.leadDate || '-'}</td>
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
    </div>
  )
}
