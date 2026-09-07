import React, { useState } from 'react'
import TablePagination from '../components/TablePagination'
import { usePagination } from '../hooks/usePagination'
import { useExtractedLeads } from '../hooks/useExtractedLeads'
import ModalCloseButton from '../components/ModalCloseButton'
import axios from 'axios'
import { update, ref } from 'firebase/database'
import { db } from '../lib/firebase'

function Row({ label, value, isLink = false }) {
    return (
        <div className="text-sm text-slate-300 sm:text-base">
            <span className="font-semibold text-slate-200">{label}: </span>
            {isLink ? (
                <a
                    href={String(value)}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-blue-300 underline-offset-2 hover:underline"
                >
                    {String(value)}
                </a>
            ) : (
                <span className="break-all text-slate-300">{String(value)}</span>
            )}
        </div>
    )
}

function Leads() {
    const { extractedLeads, loading, error } = useExtractedLeads();
    const [leadForm, setLeadForm] = useState({ leadId:'' , feedback: '' });
    const [modalOpen, setModalOpen] = useState(false);
    const [modalFeedbackOpen, setModalFeedbackOpen] = useState(false);
    const [leadDetails, setLeadDetails] = useState(null);
    const [savingLead, setSavingLead] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formError, setFormError] = useState('')
    const handleDetails = (lead) => {
        setLeadDetails(lead);
        setModalOpen(true);
    }
    const onClose = () => {
        setModalOpen(false)
        setLeadDetails({})
    }

    function openEdit(lead) {
        setEditingId(lead.id)
        setLeadForm({
            leadId: lead.leadId ?? '',
            feedback: lead.feedback ?? '',
        })
        setModalFeedbackOpen(true)
    }

    async function saveLead(e) {
        e.preventDefault()
        setSavingLead(true)
        setFormError('')
        try {
            const payload = {
                leadId: leadForm.leadId,
                feedback: leadForm.feedback,
            }

            if (!leadForm.leadId) {
                throw new Error("Lead ID is missing.");
            }

            if (!leadForm.feedback?.trim()) {
                throw new Error("Feedback is required.");
            }
            if (editingId) {
                await axios.post('https://pushleads-gaihlhxysa-uc.a.run.app', payload,
                    {
                        headers: {
                            "Content-Type": "application/json"
                        }
                    }
                )

                await update(ref(db, `extracted_leads/${editingId}`), payload)
            }
            setModalFeedbackOpen(false)
        } catch (err) {
            setFormError(err?.message || 'Could not update lead.')
        } finally {
            setSavingLead(false)
        }
    }
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
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">LeadId</th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">Client Name</th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">Company Name</th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">Turnover</th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">Phone</th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">Personal Email</th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">Business Email</th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">Address</th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">Zipcode</th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">CIBIL</th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">CMR</th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">Others 1</th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">Others 2</th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">Others 3</th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">Others 4</th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">Others 5</th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">Others 6</th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={18} className="px-4 py-8 text-center text-slate-500">
                                            Loading leads...
                                        </td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td colSpan={18} className="px-4 py-8 text-center text-slate-500">
                                            Could not read leads.
                                        </td>
                                    </tr>
                                ) : extractedLeads.length === 0 ? (
                                    <tr>
                                        <td colSpan={18} className="px-4 py-8 text-center text-slate-500">
                                            No leads yet.
                                        </td>
                                    </tr>
                                ) : (
                                    tablePageItems.map((p) => (
                                        <tr key={p.id} className="text-slate-300">
                                            <td className="px-4 py-3 text-white">{p.leadId}</td>
                                            <td className="px-4 py-3 text-white">{p.client_name}</td>
                                            <td className="px-4 py-3 text-white">{p.company_name}</td>
                                            <td className="px-4 py-3 text-white">{p.turnover}</td>
                                            <td className="px-4 py-3 text-white">{p.phone}</td>
                                            <td className="px-4 py-3 text-white">{p.personal_email}</td>
                                            <td className="px-4 py-3 text-white">{p.business_email}</td>
                                            <td className="px-4 py-3 text-white">{p.address}</td>
                                            <td className="px-4 py-3 text-white">{p.zip_code}</td>
                                            <td className="px-4 py-3 text-white">{p.cibil}</td>
                                            <td className="px-4 py-3 text-white">{p.cmr}</td>
                                            <td className="px-4 py-3 text-white">{p.others_1}</td>
                                            <td className="px-4 py-3 text-white">{p.others_2}</td>
                                            <td className="px-4 py-3 text-white">{p.others_3}</td>
                                            <td className="px-4 py-3 text-white">{p.others_4}</td>
                                            <td className="px-4 py-3 text-white">{p.others_5}</td>
                                            <td className="px-4 py-3 text-white">{p.others_6}</td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex gap-3">
                                                    <button type="button" onClick={() => handleDetails(p)} className="rounded-lg border border-red-800/60 px-3 py-1 text-xs text-red-300 hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50">View Details</button>
                                                    <button type="button" onClick={() => openEdit(p)} className="rounded-lg border border-blue-800/60 px-3 py-1 text-xs text-blue-300 hover:bg-blue-950/40 disabled:cursor-not-allowed disabled:opacity-50">Give feedback</button>
                                                </div>
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

            {modalOpen && leadDetails &&
                <div className="fixed inset-0 z-60 overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-4">
                    <div className="mx-auto my-6 w-full max-w-5xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 sm:px-6 sm:py-4">
                            <h2 className="text-lg font-semibold text-white">Lead Details</h2>
                            <ModalCloseButton onClick={onClose} />
                        </div>

                        <div className="crm-thin-scrollbar max-h-[80vh] overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
                            <p className="text-sm font-semibold text-slate-400 mb-6">Lead Information</p>
                            <section className="space-y-3 grid grid-cols-2">
                                <Row label="Lead Id" value={leadDetails.leadId || '-'} />
                                <Row label="Company Name" value={leadDetails.company_name} />
                                <Row label="Client Name" value={leadDetails.client_name || '-'} />
                                <Row label="Turnover" value={leadDetails.turnover || '-'} />
                                <Row label="Personal Email" value={leadDetails.personal_email || '-'} />
                                <Row label="Business Email" value={leadDetails.business_email || '-'} />
                                <Row label="Address" value={leadDetails.address || '-'} />
                                <Row label="Zipcode" value={leadDetails.zip_code || '-'} />
                                <Row label="CIBIL" value={leadDetails.cibil || '-'} />
                                <Row label="CMR" value={leadDetails.cmr || '-'} />
                                <Row label="Others_1" value={leadDetails.others_1 || '-'} />
                                <Row label="Others_2" value={leadDetails.others_2 || '-'} />
                                <Row label="Others_3" value={leadDetails.others_3 || '-'} />
                                <Row label="Others_4" value={leadDetails.others_4 || '-'} />
                                <Row label="Others_5" value={leadDetails.others_5 || '-'} />
                                <Row label="Others_6" value={leadDetails.others_6 || '-'} />
                                <Row label="Created At" value={leadDetails.createdAt || '-'} />
                                <Row label="Updated At" value={leadDetails.updatedAt || '-'} />
                            </section>
                        </div>
                    </div>
                </div>
            }

            {modalFeedbackOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl sm:p-6">
                        <div className="flex items-start justify-between gap-3">
                            <h2 className="text-lg font-semibold text-white">
                                {editingId ? 'Edit lead' : 'New lead'}
                            </h2>
                            <ModalCloseButton onClick={()=>setModalFeedbackOpen(false)} />
                        </div>
                        <form onSubmit={saveLead} className="mt-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300">Feedback</label>
                                <input value={leadForm.feedback} onChange={(e) => setLeadForm((f) => ({ ...f, feedback: e.target.value }))}className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"/>
                            </div>
                            {formError && <p className="text-sm text-red-300">{formError}</p>}
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setModalFeedbackOpen(false)}
                                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingLead}
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                                >
                                    {savingLead ? 'Sending...' : 'Send Feedback'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}

export default Leads