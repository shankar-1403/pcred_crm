import React, { useState, useMemo } from 'react'
import TablePagination from '../components/TablePagination';
import { push, ref, set, update } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from '../hooks/firebase';
import { db } from '../lib/firebase';
import { usePagination } from '../hooks/usePagination';
import { useAuth } from '../context/AuthContext';
import ModalCloseButton from '../components/ModalCloseButton';
import { useCreatives } from '../hooks/useCreative';
import { ROLES } from '../constants'

const emptyForm = {
  name: '',
  file: null,
}

function AdminCreative() {
    const {profile,user} = useAuth();
    const {creatives} = useCreatives();
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState('');
    const [message, setMessage] = useState('');
    const [creativeName, setCreativeName] = useState('');
    const [formError, setFormError] = useState('');
    const [file, setFile] = useState(null);
    const handleOpen = () => {
        setOpen(true);
    }

    const isAdmin = String(profile?.role ?? '').trim().toLowerCase() === ROLES.ADMIN
    const creativesTable = useMemo(() => creatives ?? [], [creatives])

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

        const name = creativeName.trim()
        if (!name) {
        setFormError('Product name is required.')
        return
        }

        setSaving(true)
        try {
            const fileRef = storageRef(storage, `creatives/${Date.now()}_${file.name}`);
            await uploadBytes(fileRef, file);

            const fileURL = await getDownloadURL(fileRef);
            const newRef = push(ref(db, 'creatives'))
            await set(newRef, {
                name,
                fileUrl,
                createdAt: Date.now(),
                createdByAdminUid: user.uid,
            })
            setProductName('');
            setFile(null)
            setMessage('Product added.')
        } catch (err) {
            setFormError(err?.message ?? 'Could not add product.')
        } finally {
            setSaving(false)
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
    } = usePagination(creatives)
    
    return (
        <>
            <div className="min-w-0 space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Creative List</h1>
                    </div>
                    <div>
                        <button
                            type="button"
                            onClick={handleOpen}
                            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
                        >
                            New Creative
                        </button>
                    </div>
                </div>
                <div className="max-w-full min-w-0 rounded-xl border border-slate-800 bg-slate-900/40 [-webkit-overflow-scrolling:touch]">
                    <div className="overflow-x-auto">
                        <table className="w-max min-w-full text-left text-xs sm:text-sm">
                            <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-slate-500">
                                <tr>
                                <th className="px-4 py-2 font-medium whitespace-nowrap">Sr No.</th>
                                <th className="px-4 py-2 font-medium whitespace-nowrap">Creative name</th>
                                <th className="px-4 py-2 font-medium whitespace-nowrap">File</th>
                                <th className="px-4 py-2 font-medium whitespace-nowrap">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {creatives.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                                    You have no leads yet. Click New lead to add one.
                                    </td>
                                </tr>
                                ) : (
                                creatives.map((creative) => (
                                    <tr key={creative.id} className="text-slate-300">
                                        <td className="whitespace-nowrap px-4 py-1 text-slate-400">{creative.company || '-'}</td>
                                        <td className="whitespace-nowrap px-4 py-1 text-slate-400">{creative.clientName || '-'}</td>
                                        <td className="whitespace-nowrap px-4 py-1 text-slate-400">{creative.file || '-'}</td>
                                        <td className="whitespace-nowrap px-4 py-1">
                                            <div className="flex flex-nowrap items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(creative)}
                                                    title="Edit"
                                                    className="rounded-lg border border-slate-600 px-2 py-1 text-sm text-slate-300 hover:bg-slate-800"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setViewLead(creative)}
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
                {open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto overflow-x-visible rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl sm:p-6" role="dialog" aria-modal="true" aria-labelledby="lead-modal-title-ambassador">
                            <div className="flex items-start justify-between gap-3">
                                <h2
                                id="lead-modal-title-ambassador"
                                className="text-lg font-semibold text-white"
                                >
                                {editingId ? 'Edit creative' : 'New creative'}
                                </h2>
                                <ModalCloseButton onClick={() => setModalOpen(false)} />
                            </div>
            
                            <form onSubmit={handleCreate} className="mt-6 space-y-4">
                                 <div className="space-y-2 ">
                                    <label className="mb-4" htmlFor="profile">Label</label>
                                    <input id="label" value={creativeName} onChange={(e)=>setCreativeName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"/>
                                </div>
                
                                <div className="space-y-2 ">
                                    <label className="mb-4" htmlFor="profile">Upload</label>
                                    <input id="profile" value={file} onChange={(e)=>setFile(e.target.value)} type="file" accept=".jpeg,.png,.jpg" className="mt-2 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white file:shadow-sm file:transition cursor-pointer"/>
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
        </>
    )
}

export default AdminCreative