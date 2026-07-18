import React, { useState, useRef } from 'react';
import ModalCloseButton from '../components/ModalCloseButton';
import { useMarketing } from '../hooks/useMarketing';
import { useAuth } from '../context/AuthContext';
import html2canvas from 'html2canvas';
import { IconUser, IconId, IconMail, IconPhone } from '@tabler/icons-react';

function MarketingInternal() {
    const downloadRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [loadingId, setLoadingId] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [details, setDetails] = useState()
    const { marketing } = useMarketing();
    console.log(marketing)
    const { profile } = useAuth();
    const handleOpen = (item) => {
        setOpen(true);
        setDetails(item)
    }

    const handleClose = () => {
        setOpen(false);
        setDetails(null);
    }

    const handleDownload = async (item) => {
        setLoadingId(item.id);
        setDetails(item);

        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            const img = downloadRef.current.querySelector("pdf");

            if (img && !img.complete) {
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            }

            const link = document.createElement("a");
            link.download = `${item.name}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <>
            <div className="min-w-0 space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Marketing Material</h1>
                    </div>
                </div>
                <div className="max-w-full min-w-0">
                    <div className="overflow-x-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {marketing.map((item) => {
                                const subject = encodeURIComponent(`PCRED - Your One-Stop Corporate Advisory Partner `);

                                const body = encodeURIComponent([
                                    'Dear Sir/Ma’am,',
                                    '',
                                    'Greetings from PCRED.',
                                    '',
                                    `We have received your enquiry regarding your working capital requirements and understand that you are exploring funding options under the Government scheme CGTMSE.`,
                                    '',
                                    'At PCRED, we are a leading corporate advisory firm with over a decade of experience and a portfolio of 400+ reputed clients. Our mission is to empower businesses of all sizes, from ambitious startups to established enterprises, to navigate financial complexities, capitalize on opportunities, and achieve sustainable growth.',
                                    '',
                                    'We offer a comprehensive suite of services, including:',
                                    '✅ Working Capital',
                                    '✅ Export Finance & Supply Chain Finance',
                                    '✅ Government Schemes',
                                    '✅ Retail Loans',
                                    '✅ IPO Advisory & Equity Financing',
                                    '✅ Debt Syndication & Project Finance',
                                    '✅ One-Time Settlement (OTS) & Bill Discounting',
                                    '',
                                    'As a trusted advisory partner, we work closely with businesses to identify the most suitable funding structures and government-backed schemes. Our approach is personalized, result-oriented, and focused on ensuring financial stability while unlocking long-term growth opportunities.',
                                    '',
                                    'View the file:',
                                    item.fileUrl,
                                    '',
                                    'If you have any questions, please feel free to reach out.',
                                    '',
                                    'Warm Regards,',
                                    'PCRED Venture Pvt. Ltd.'
                                    ].join('\n'));
                            return (
                            <div className='col-span-1'>
                                <div className='border border-blue-600 rounded-2xl overflow-hidden'>
                                    <div className='border-r-3 border-b-3 border-blue-600 rounded-2xl py-4 px-3'>
                                        <div className='pb-2'>
                                            <h2 className='text-lg font-bold text-center'>{item.name}</h2>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mt-4">
                                            <a href={item.fileUrl} target='_blank' className='bg-blue-600 rounded-lg text-base py-1 px-3 w-full cursor-pointer text-center'>View</a>
                                            <a href={`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`} target='_blank' rel="noopener noreferrer" className='border border-blue-600 text-base rounded-lg py-1 px-3 w-full cursor-pointer text-center'>Share</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            );
                            })}
                        </div>
                    </div>
                </div>
            </div>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto overflow-x-visible rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl sm:p-6" role="dialog" aria-modal="true" aria-labelledby="lead-modal-title-ambassador">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-lg font-semibold text-white">{details.name}</h2>
                            <ModalCloseButton onClick={handleClose} />
                        </div>
                        <div className="sales-material-preview flex flex-col justify-center w-full bg-[#03244c] mt-2">
                            {details && (
                                <>
                                    <img src={details.fileUrl} alt={details.name} className='h-180' />
                                    <div className="border-t-2 border-[#FFAB2E] p-2">
                                        <h3 className='text-xl text-white underline font-bold'>ENTREPRENEURS CONNECT BHARAT</h3>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <div className='flex items-center gap-2'>
                                                <IconUser color='white' size={20} />
                                                <p className='capitalize text-base text-white'>{profile.displayName}</p>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <IconId color='white' size={20} />
                                                <p className='capitalize text-base text-white'>{profile.role === "elite_ambassador" ? "Elite Ambassador" : profile.role === "ambassador" ? "Ambassador" : profile.designation}</p>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <IconMail color='white' size={20} />
                                                <p className='text-base text-white'>{profile.email}</p>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <IconPhone color='white' size={20} />
                                                <p className='text-base text-white'>{profile.phoneNo}</p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <div
                style={{
                    position: "fixed",
                    left: "-9999px",
                    top: 0,
                }}
            >
                <div ref={downloadRef} style={{ width: "800px", background: "#0A4D9D", color: "#ffffff" }}>
                    {details && (
                        <>
                            <img src={details.fileUrl} crossOrigin="anonymous" alt={details.name} style={{ height: 1000 }} />
                            <div style={{ borderTop: "2px solid #FFAB2E", padding: "10px", background: "#03244c" }}>
                                <h3 style={{ color: "#ffffff", fontWeight: "bolder", fontSize: "30px" }}>ENTREPRENEURS CONNECT BHARAT</h3>
                                <table style={{ width: "100%", marginTop: "10px" }}>
                                    <tbody>
                                        <tr style={{ background: "#03244c" }}>
                                            <td style={{ padding: "4px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                    <div>
                                                        <IconUser style={{ color: "#ffffff", width: "38px", height: "38px", marginTop: "5px" }} />
                                                    </div>
                                                    <span style={{ fontSize: "28px", color: "#ffffff" }}>
                                                        {profile.displayName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: "4px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                    <div>
                                                        <IconId style={{ color: "#ffffff", width: "38px", height: "38px", marginTop: "5px" }} />
                                                    </div>
                                                    <span style={{ fontSize: "28px", color: "#ffffff", textTransform: "capitalize" }}>
                                                        {profile.role === "elite_ambassador" ? "Elite Ambassador" : "Ambassador"}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr style={{ background: "#03244c" }}>
                                            <td style={{ padding: "4px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                    <div>
                                                        <IconMail style={{ color: "#ffffff", width: "38px", height: "38px", marginTop: "5px" }} />
                                                    </div>
                                                    <span style={{ fontSize: "28px", color: "#ffffff" }}>
                                                        {profile.email}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: "4px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                    <div>
                                                        <IconPhone style={{ color: "#ffffff", width: "38px", height: "38px", marginTop: "5px" }} />
                                                    </div>
                                                    <span style={{ fontSize: "28px", color: "#ffffff" }}>
                                                        {profile.phoneNo}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}


                    {/* {previewImage && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
                            <div className="bg-white p-4 rounded-lg max-w-3xl">
                            <h2 className="text-lg font-bold mb-2">Preview</h2>

                            <img src={previewImage} alt="Preview" className="w-full" />

                            </div>
                        </div>
                    )} */}
                </div>
            </div>
        </>
    )
}

export default MarketingInternal