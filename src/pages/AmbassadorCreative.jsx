import React, { useState } from 'react';
import one from "../../public/one.webp";
import ModalCloseButton from '../components/ModalCloseButton';

function AmbassadorCreative() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <div className="min-w-0 space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Sales Material</h1>
                    </div>
                </div>
                <div className="max-w-full min-w-0">
                    <div className="overflow-x-auto">
                        <div className="grid grid-cols-5 gap-4">
                            <div className='col-span-1'>
                                <div className='border border-blue-600 rounded-2xl overflow-hidden'>
                                    <div className='border-r-3 border-b-3 border-blue-600 rounded-2xl py-4 px-3'>
                                        <div className='pb-2'>
                                            <h2 className='text-lg font-bold text-center'>CGTMSE Scheme</h2>
                                        </div>
                                        <div className='flex justify-center'>
                                            <img src={one} alt="Test" className='h-50 rounded-sm'/>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mt-4">
                                            <div>
                                                <button className='bg-blue-600 rounded-lg py-1 px-3 w-full'>Download</button>
                                            </div>
                                            <div>
                                                <button className='border border-blue-600 rounded-lg py-1 px-3 w-full' onClick={()=>setOpen(true)}>View</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto overflow-x-visible rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl sm:p-6" role="dialog" aria-modal="true" aria-labelledby="lead-modal-title-ambassador">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-lg font-semibold text-white">CGTMSE Scheme</h2>
                            <ModalCloseButton onClick={() => setOpen(false)} />
                        </div>
                        <div className='flex flex-col justify-center w-full py-2'>
                            <img src={one} alt="Test" className='h-140 rounded-sm'/>
                            <div className="grid grid-cols-2 gap-2">
                                <div className='col-span-2'>
                                    <h3 className='text-center text-xl text-amber-600'>ENTREPRENEURS CONNECT BHARAT</h3>
                                </div>
                                <div></div>
                                <div></div>
                                <div></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default AmbassadorCreative