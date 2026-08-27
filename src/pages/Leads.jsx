import React from 'react'
import TablePagination from '../components/TablePagination'
import { usePagination } from '../hooks/usePagination'
import { useExtractedLeads } from '../hooks/useExtractedLeads'

function Leads() {
    const { extractedLeads, loading, error } = useExtractedLeads();
    const {
        page: tablePage,
        setPage: setTablePage,
        pageSize: tablePageSize,
        setPageSize: setTablePageSize,
        total: tableTotal,
        totalPages: tableTotalPages,
        pageItems: tablePageItems,
    } = usePagination(extractedLeads)
    return (
        <>
            <div className="min-w-0 space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-white">Leads</h1>
                    <p className="mt-1 text-sm text-slate-400">Extracted Leads Data</p>
                </div>

                <section className="max-w-full min-w-0 rounded-xl border border-slate-800 bg-slate-900/40 [-webkit-overflow-scrolling:touch]">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] table-auto text-left text-xs sm:text-sm">
                            <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">Id</th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">Company Name</th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">Client Name</th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">Turnover</th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">Phone</th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">Personal Email</th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">Business Email</th>
                                    <th className="px-4 py-3 font-medium text-right whitespace-nowrap">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                                            Loading leads...
                                        </td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                                            Could not read leads.
                                        </td>
                                    </tr>
                                ) : extractedLeads.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                                            No leads yet.
                                        </td>
                                    </tr>
                                ) : (
                                    tablePageItems.map((p) => (
                                        <tr key={p.id} className="text-slate-300">
                                            <td className="px-4 py-3 text-white">{p.leadId}</td>
                                            <td className="px-4 py-3 text-white">{p.company_name}</td>
                                            <td className="px-4 py-3 text-white">{p.client_name}</td>
                                            <td className="px-4 py-3 text-white">{p.turnover}</td>
                                            <td className="px-4 py-3 text-white">{p.phone}</td>
                                            <td className="px-4 py-3 text-white">{p.personal_email}</td>
                                            <td className="px-4 py-3 text-white">{p.business_email}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button type="button" className="rounded-lg border border-red-800/60 px-3 py-1 text-xs text-red-300 hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50">View Details</button>
                                                <button type="button" className="rounded-lg border border-blue-800/60 px-3 py-1 text-xs text-blue-300 hover:bg-blue-950/40 disabled:cursor-not-allowed disabled:opacity-50">Give feedback</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {!loading && !error && extractedLeads.length > 0 ? (
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
        </>
    )
}

export default Leads