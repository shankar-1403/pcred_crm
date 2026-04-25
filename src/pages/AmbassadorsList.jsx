import React, { useState } from 'react';
import { useEliteAmbassador } from '../hooks/useEliteAmbassador';
import { useAmbassador } from '../hooks/useAmbassador';
import { useUsers } from '../hooks/useUsers';
import { useAuth } from '../context/AuthContext';
import TablePagination from '../components/TablePagination';
import { usePagination } from '../hooks/usePagination';
import ModalCloseButton from '../components/ModalCloseButton';

function AmbassadorsList() {
    const { eliteAmbassador } = useEliteAmbassador();
    const { ambassador } = useAmbassador();
    const { profile } = useAuth();
    const { usersById } = useUsers();
    const TARGET_UID = "thy1xXKWoQXShRv3g31vuE180Uh1";
    const [modalOpen, setModalOpen] = useState(false);
    const [referredTo, setReferredTo] = useState([]);

    const handleOpen = (data) => {
        const list = ambassador.filter(
            (item) => item.referredByUid === data.id
        );

        setReferredTo(list); 
        setModalOpen(true);
    };

    function referredToLabel(uid) {
        const id = String(uid ?? '').trim()
        if (!id) return '—'
        const u = usersById[id]
        if (!u) return `${id.slice(0, 8)}…`
        return u.displayName || u.email || id.slice(0, 8)
    }

    const filterEliteAmbassador = eliteAmbassador.filter((item) => {
        if (profile.uid === TARGET_UID) return true
        return item.referredByUid === profile.uid
    })

    const filterAmbassador = ambassador.filter((item)=>{
        if(profile.uid === item.referredByUid)
        return item
    })

    const {
        page: tablePage,
        setPage: setTablePage,
        pageSize: tablePageSize,
        setPageSize: setTablePageSize,
        total: tableTotal,
        totalPages: tableTotalPages,
        pageItems: tablePageItems,
    } = usePagination(filterEliteAmbassador)  

    return (
        <>
            <div className="min-w-0 space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                    <h1 className="text-2xl font-semibold text-white">Elite Ambassador List</h1>
                    </div>
                </div>
            
                <div className="max-w-full min-w-0 rounded-xl border border-slate-800 bg-slate-900/40 [-webkit-overflow-scrolling:touch]">
                    <div className="overflow-x-auto">
                        {profile.role === 'elite_ambassador' ? 
                            <table className="w-max min-w-full text-left text-xs sm:text-sm">
                                <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-2 font-medium whitespace-nowrap w-10">Sr No.</th>
                                    <th className="px-4 py-2 font-medium whitespace-nowrap">Name</th>
                                    <th className="px-4 py-2 font-medium whitespace-nowrap">Phone No.</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                {filterAmbassador.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                                            You have no {profile.role === "elite_ambassador" ? 'Ambassador' : 'Elite Ambassador'} yet.
                                        </td>
                                    </tr>
                                ) : (
                                    filterAmbassador.map((data,index) => (
                                    <tr key={data.id} className="text-slate-300">
                                        <td className="whitespace-nowrap px-4 py-1 text-slate-400">{index + 1 || '-'}</td>
                                        <td className="whitespace-nowrap px-4 py-1 text-slate-400">{data.name || '-'}</td>
                                        <td className="whitespace-nowrap px-4 py-1 text-slate-400">{data.phoneNo || '-'}</td>
                                    </tr>
                                    ))
                                )}
                                </tbody>
                            </table> :
                            <table className="w-max min-w-full text-left text-xs sm:text-sm">
                                <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-2 font-medium whitespace-nowrap w-10">Sr No.</th>
                                    <th className="px-4 py-2 font-medium whitespace-nowrap">Name</th>
                                    <th className="px-4 py-2 font-medium whitespace-nowrap">Phone No.</th>
                                    {profile.role === 'ambassador' ? null : (
                                        <th className="px-4 py-2 font-medium whitespace-nowrap">Referred to</th>
                                    )}
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                {filterEliteAmbassador.length === 0 ? (
                                    <tr>
                                        <td colSpan={profile.role === 'ambassador' ? 3 : 4} className="px-4 py-10 text-center text-slate-500">
                                            You have no {profile.role === "elite_ambassador" ? 'Ambassador' : 'Elite Ambassador'} yet.
                                        </td>
                                    </tr>
                                ) : (
                                    filterEliteAmbassador.map((data,index) => (
                                        <tr key={data.id} className="text-slate-300">
                                            <td className="whitespace-nowrap px-4 py-1 text-slate-400">{index + 1 || '-'}</td>
                                            <td className="whitespace-nowrap px-4 py-1 text-slate-400">{data.name || '-'}</td>
                                            <td className="whitespace-nowrap px-4 py-1 text-slate-400">{data.phoneNo || '-'}</td>
                                            {profile.role === 'ambassador' ? null : (
                                                <td className="whitespace-nowrap px-4 py-1 text-slate-400">
                                                    <button onClick={() => handleOpen(data)} className='border rounded-lg p-1 text-xs cursor-pointer border-accent'>View Names</button>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        }
                    </div>
                    <TablePagination
                    page={tablePage}
                    totalPages={tableTotalPages}
                    totalItems={tableTotal}
                    pageSize={tablePageSize}
                    onPageChange={setTablePage}
                    onPageSizeChange={setTablePageSize}
                    />
                    {modalOpen &&  
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                            <div
                            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto overflow-x-visible rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl sm:p-6"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="lead-modal-title-elite-ambassador"
                            >
                                <div className="flex items-start justify-end gap-3">
                                    <ModalCloseButton onClick={() => setModalOpen(false)} />
                                </div>
                                <table className="w-max min-w-full text-left text-xs sm:text-sm">
                                    <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="px-4 py-2 font-medium whitespace-nowrap w-10">Sr No.</th>
                                        <th className="px-4 py-2 font-medium whitespace-nowrap">Name</th>
                                        <th className="px-4 py-2 font-medium whitespace-nowrap">Phone No.</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                    {referredTo.length === 0 ? (
                                        <tr>
                                            <td colSpan={profile.role === 'ambassador' ? 3 : 4} className="px-4 py-10 text-center text-slate-500">
                                                No Ambassador yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        referredTo.map((data,index) => (
                                            <tr key={data.id} className="text-slate-300">
                                                <td className="whitespace-nowrap px-4 py-1 text-slate-400">{index + 1 || '-'}</td>
                                                <td className="whitespace-nowrap px-4 py-1 text-slate-400">{data.name}</td>
                                                <td className="whitespace-nowrap px-4 py-1 text-slate-400">{data.phoneNo || '-'}</td>
                                            </tr>
                                        ))
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    }
                </div>
            </div>
        </>
    )
}

export default AmbassadorsList