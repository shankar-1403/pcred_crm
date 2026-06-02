import React, { useState, useRef } from 'react';
import ModalCloseButton from '../components/ModalCloseButton';
import { useCreatives } from '../hooks/useCreative';
import { useAuth } from '../context/AuthContext';
import html2canvas from 'html2canvas';
import { IconUser, IconId, IconMail, IconPhone } from '@tabler/icons-react';

function AmbassadorCreative() {
    const downloadRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [loadingId, setLoadingId] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [details, setDetails] = useState()
    const {creatives} = useCreatives();
    const {profile} = useAuth();
    const handleOpen = (item) => {
        setOpen(true);
        setDetails(item)
    }

    const handleClose = () => {
        setOpen(false);
        setDetails(null);
    }

    const handleDownload = async (item) => {
        setDetails(item);
        setLoadingId(item.id);
        try {
            const img = downloadRef.current.querySelector("img");

            if (img && !img.complete) {
            await new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
            });
            }

            const canvas = await html2canvas(downloadRef.current, {
                useCORS: true,
                scale: 2,
                backgroundColor: "#ffffff",

                onclone: (clonedDoc) => {
                    const allElements = clonedDoc.querySelectorAll("*");

                    allElements.forEach((el) => {
                    const style = clonedDoc.defaultView.getComputedStyle(el);

                    // Replace unsupported oklch colors
                    if (style.color.includes("oklch")) {
                        el.style.color = "#000000";
                    }

                    if (style.backgroundColor.includes("oklch")) {
                        el.style.backgroundColor = "#ffffff";
                    }

                    if (style.borderColor.includes("oklch")) {
                        el.style.borderColor = "#000000";
                    }
                    });
                },
            });

            const link = document.createElement("a");
            // const dataUrl = canvas.toDataURL("image/png");
            // setPreviewImage(dataUrl);
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
                        <h1 className="text-2xl font-semibold text-white">Sales Material</h1>
                    </div>
                </div>
                <div className="max-w-full min-w-0">
                    <div className="overflow-x-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {creatives.map((item)=>(
                                <div className='col-span-1'>
                                    <div className='border border-blue-600 rounded-2xl overflow-hidden'>
                                        <div className='border-r-3 border-b-3 border-blue-600 rounded-2xl py-4 px-3'>
                                            <div className='pb-2'>
                                                <h2 className='text-lg font-bold text-center'>{item.name}</h2>
                                            </div>
                                            <div className='flex justify-center'>
                                                <img src={item.fileUrl} alt={item.name} className='h-50 rounded-sm'/>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 mt-4">
                                                <div>
                                                    <button className='bg-blue-600 rounded-lg text-base py-1 px-3 w-full cursor-pointer' onClick={()=>handleDownload(item)}>{loadingId === item.id ? 'Downloading' : 'Download'}</button>
                                                </div>
                                                <div>
                                                    <button className='border border-blue-600 text-base rounded-lg py-1 px-3 w-full cursor-pointer' onClick={()=>handleOpen(item)}>View</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                                    <img src={details.fileUrl} alt={details.name} className='h-180'/>
                                    <div className="border-t-2 border-[#FFAB2E] p-2">
                                        <h3 className='text-xl text-white underline font-bold'>ENTREPRENEURS CONNECT BHARAT</h3>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <div className='flex items-center gap-2'>
                                                <IconUser color='white' size={20}/>
                                                <p className='capitalize text-base text-white'>{profile.displayName}</p>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <IconId color='white' size={20}/>
                                                <p className='capitalize text-base text-white'>{profile.role === "elite_ambassador" ? "Elite Ambassador" : profile.role === "ambassador" ? "Ambassador" : profile.designation}</p>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <IconMail color='white' size={20}/>
                                                <p className='text-base text-white'>{profile.email}</p>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <IconPhone color='white' size={20}/>
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
                <div ref={downloadRef} style={{width: "800px",background: "#0A4D9D", color: "#ffffff"}}>
                    {details && (
                    <>
                        <img src={details.fileUrl}  crossOrigin="anonymous" alt={details.name} style={{height:1000}} />
                        <div style={{borderTop:"2px solid #FFAB2E",padding:"10px",background:"#03244c"}}>
                            <h3 style={{ color: "#ffffff",fontWeight:"bolder",fontSize:"30px"}}>ENTREPRENEURS CONNECT BHARAT</h3>
                            <table style={{width:"100%",marginTop:"10px"}}>
                                <tbody>
                                    <tr>
                                        <td style={{padding:"4px"}}>
                                            <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
                                                <div>
                                                    <IconUser style={{ color: "#ffffff",width:"38px",height:"38px",marginTop:"5px" }}/>
                                                </div>
                                                <span style={{ fontSize: "28px" }}>
                                                    {profile.displayName}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{padding:"4px"}}>
                                            <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
                                                <div>
                                                    <IconId style={{ color: "#ffffff",width:"38px",height:"38px",marginTop:"5px" }}/>
                                                </div>
                                                <span style={{ fontSize: "28px", textTransform: "capitalize" }}>
                                                    {profile.role === "elite_ambassador" ? "Elite Ambassador" : "Ambassador"}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{padding:"4px"}}>
                                            <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
                                                <div>
                                                    <IconMail style={{ color: "#ffffff",width:"38px",height:"38px",marginTop:"5px" }}/>
                                                </div>
                                                <span style={{ fontSize: "28px" }}>
                                                    {profile.email}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{padding:"4px"}}>
                                            <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
                                                <div>
                                                    <IconPhone style={{ color: "#ffffff",width:"38px",height:"38px",marginTop:"5px" }}/>
                                                </div>
                                                <span style={{ fontSize: "28px" }}>
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

export default AmbassadorCreative