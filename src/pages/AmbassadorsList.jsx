import React, { useState, useRef } from 'react';
import { useEliteAmbassador } from '../hooks/useEliteAmbassador';
import { useAmbassador } from '../hooks/useAmbassador';
import { useUsers } from '../hooks/useUsers';
import { useAuth } from '../context/AuthContext';
import TablePagination from '../components/TablePagination';
import { usePagination } from '../hooks/usePagination';
import ModalCloseButton from '../components/ModalCloseButton';
import { SALUTATIONS } from '../lib/salutation';
import businessOne from '../../public/business_1.png';
import businessTwoBig from '../../public/business_2_big.png';
import businessTwoSmall from '../../public/business_2_small.png';
import certificate from '../../public/certificate.png';
import {jsPDF} from 'jspdf';

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

    function salutation(id){
        const salutation = SALUTATIONS.find(item => item.id == id)
        return salutation.label;
    }

    const newFont = async () => {
        const font = new FontFace(
            "QuattroCento",
            "url(/fonts/Quattrocento-Regular.ttf)"
        );

        await font.load();
        document.fonts.add(font);
    };

    const loadFont = async () => {
        const font = new FontFace(
            "Myriad",
            "url(/fonts/Myriad-Variable-Concept.ttf)"
        );

        await font.load();
        document.fonts.add(font);
    };

    const vibesFont = async () => {
        const font = new FontFace(
            "GreatVibes",
            "url(/fonts/GreatVibes-Regular.ttf)"
        );

        await font.load();
        document.fonts.add(font);
    };
    
    
    const canvasRef = useRef(null);
    const generateVisitingElite = async (data) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        await loadFont();

        const loadImage = (src) =>
            new Promise((resolve) => {
                const img = new Image();
                img.src = src;
                img.onload = () => resolve(img);
            });

        const img1 = await loadImage(businessOne);
        const img2 = await loadImage(data.name > 20 ? businessTwoBig : businessTwoSmall);

        // ======================
        // PAGE 1 (img1 size)
        // ======================
        canvas.width = img1.width;
        canvas.height = img1.height;

        ctx.drawImage(img1, 0, 0);

        const pdf = new jsPDF({
            orientation: img1.width > img1.height ? "landscape" : "portrait",
            unit: "px",
            format: [img1.width, img1.height],
        });

        let imgData = canvas.toDataURL("image/png");
        pdf.addImage(imgData, "PNG", 0, 0, img1.width, img1.height);

        // ======================
        // PAGE 2 (img2 size)
        // ======================
        canvas.width = img2.width;
        canvas.height = img2.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img2, 0, 0);

        ctx.fillStyle = "#ffffff";
        ctx.font = data.name.length > 20 ? "32px Myriad" : "38px Myriad";

        const x2 = data.name > 20 ? 455 : 592;
        const baseY2 = canvas.height * 0.26;
        const y2 = canvas.height * 0.35;
        const x3 = 95;
        const y3 = 465;
        const x4 = 95;
        const y4 = 530;
        ctx.fillText(`${salutation(data.salutation) || ""} ${data.name}`, x2, baseY2);
        ctx.font = data.name.length > 20 ? "30px Myriad" : "35px Myriad";
        ctx.fillText("Elite Ambassador", x2, y2);
        ctx.fillStyle = "#000000";
        ctx.font = "28px Myriad";
        ctx.fillText(data.email, x3, y3);
        ctx.fillText(data.phoneNo, x4, y4);

        pdf.addPage([img2.width, img2.height]); // page size matches image

        imgData = canvas.toDataURL("image/png");
        pdf.addImage(imgData, "PNG", 0, 0, img2.width, img2.height);

        pdf.save(`${data.name} visiting card.pdf`);
    };

    const generateVisitingAmbassador = async (data) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        await loadFont();

        const loadImage = (src) =>
            new Promise((resolve) => {
                const img = new Image();
                img.src = src;
                img.onload = () => resolve(img);
            });

        const img1 = await loadImage(businessOne);
        const img2 = await loadImage(data.name > 20 ? businessTwoBig : businessTwoSmall);

        // ======================
        // PAGE 1 (img1 size)
        // ======================
        canvas.width = img1.width;
        canvas.height = img1.height;

        ctx.drawImage(img1, 0, 0);

        const pdf = new jsPDF({
            orientation: img1.width > img1.height ? "landscape" : "portrait",
            unit: "px",
            format: [img1.width, img1.height],
        });

        let imgData = canvas.toDataURL("image/png");
        pdf.addImage(imgData, "PNG", 0, 0, img1.width, img1.height);

        // ======================
        // PAGE 2 (img2 size)
        // ======================
        canvas.width = img2.width;
        canvas.height = img2.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img2, 0, 0);

        ctx.fillStyle = "#ffffff";
        ctx.font = data.name.length > 20 ? "32px Myriad" : "38px Myriad";

        const x2 = data.name > 20 ? 455 : 592;
        const baseY2 = canvas.height * 0.26;
        const y2 = canvas.height * 0.35;
        const x3 = 95;
        const y3 = 465;
        const x4 = 95;
        const y4 = 530;
        ctx.fillText(`${salutation(data.salutation) || ""} ${data.name}`, x2, baseY2);
        ctx.font = data.name.length > 20 ? "30px Myriad" : "35px Myriad";
        ctx.fillText("Ambassador", x2, y2);
        ctx.fillStyle = "#000000";
        ctx.font = "28px Myriad";
        ctx.fillText(data.email, x3, y3);
        ctx.fillText(data.phoneNo, x4, y4);

        pdf.addPage([img2.width, img2.height]); // page size matches image

        imgData = canvas.toDataURL("image/png");
        pdf.addImage(imgData, "PNG", 0, 0, img2.width, img2.height);

        pdf.save(`${data.name} visiting card.pdf`);
    };

    const generateCertificate = async(data) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        await vibesFont();
        await newFont();
        const img = new Image();
        img.src = certificate;

        img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw certificate background
        ctx.drawImage(img, 0, 0);

        
        // Adjusted position based on your image
        const x = canvas.width / 2;
        const salutationX = canvas.width / 2;
        const baseY = canvas.height * 0.48;
        const marginTop = 190; 
        const nameY = baseY + marginTop;

        const gap = 160;
        const salutationY = nameY - gap;
        
        ctx.textAlign = "center";

        ctx.fillStyle = "#A27430";
        ctx.font = "50px QuattroCento";
        ctx.fillText(`This is to certify that ${salutation(data.salutation) || ""}` || "", salutationX, salutationY);

        ctx.fillStyle = "#000000";
        ctx.font = data.name.length > 20 ? "100px GreatVibes" : "150px GreatVibes";
        ctx.fillText(data.name, x, nameY);

        const imgData = canvas.toDataURL("image/png");

        // Generate PDF
        const pdf = new jsPDF({
            orientation: canvas.width > canvas.height ? "landscape" : "portrait",
            unit: "px",
            format: [canvas.width, canvas.height],
        });

        pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
        pdf.save(`${data.name} certificate.pdf`);
        };
    };

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
                                    <th className="px-4 py-2 font-medium whitespace-nowrap">ECB MSME Link</th>
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
                                        <td className="whitespace-nowrap px-4 py-1 text-slate-400">{import.meta.env.VITE_HOST}/lead/loan/{data.id || '-'}</td>
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
                                    <th className="px-4 py-2 font-medium whitespace-nowrap">ECB MSME Link</th>
                                    {profile.uid === TARGET_UID ? 
                                        <th className="px-4 py-2 font-medium whitespace-nowrap">PAN</th> : null
                                    }
                                    {profile.uid === TARGET_UID ? 
                                        <th className="px-4 py-2 font-medium whitespace-nowrap">Email Id</th> : null
                                    }
                                    {profile.uid === TARGET_UID ? 
                                        <th className="px-4 py-2 font-medium whitespace-nowrap">Date of Birth</th> : null
                                    }
                                    {profile.uid === TARGET_UID ? 
                                        <th className="px-4 py-2 font-medium whitespace-nowrap">Visiting Card</th> : null
                                    }
                                    {profile.uid === TARGET_UID ? 
                                        <th className="px-4 py-2 font-medium whitespace-nowrap">Certificate</th> : null
                                    }
                                    {profile.role === 'ambassador' ? null : (
                                        <th className="px-4 py-2 font-medium whitespace-nowrap">Referred to</th>
                                    )}
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                {filterEliteAmbassador.length === 0 ? (
                                    <tr>
                                        <td colSpan={profile.role === 'ambassador' ? 4 : 5} className="px-4 py-10 text-center text-slate-500">
                                            You have no {profile.role === "elite_ambassador" ? 'Ambassador' : 'Elite Ambassador'} yet.
                                        </td>
                                    </tr>
                                ) : (
                                    tablePageItems.map((data,index) => (
                                        <tr key={data.id} className="text-slate-300">
                                            <td className="whitespace-nowrap px-4 py-1 text-slate-400">{index + 1 || '-'}</td>
                                            <td className="whitespace-nowrap px-4 py-1 text-slate-400">{data.name || '-'}</td>
                                            <td className="whitespace-nowrap px-4 py-1 text-slate-400">{data.phoneNo || '-'}</td>
                                            <td className="whitespace-nowrap px-4 py-1 text-slate-400">{import.meta.env.VITE_HOST}/lead/loan/{data.id || '-'}</td>
                                            {profile.uid === TARGET_UID ? 
                                                <td className="whitespace-nowrap px-4 py-1 text-slate-400">{data.pan || '-'}</td> : null
                                            }
                                            {profile.uid === TARGET_UID ? 
                                                <td className="whitespace-nowrap px-4 py-1 text-slate-400">{data.email || '-'}</td> : null
                                            }
                                            {profile.uid === TARGET_UID ? 
                                                <td className="whitespace-nowrap px-4 py-1 text-slate-400">{data.dob || '-'}</td> : null
                                            }
                                            {profile.uid === TARGET_UID ? 
                                                <td className="whitespace-nowrap px-4 py-1 text-slate-400">
                                                    <button onClick={() => generateVisitingElite(data)} className='border rounded-lg p-1 text-xs cursor-pointer border-accent'>Visiting Card</button>
                                                </td> : null
                                            }
                                            {profile.uid === TARGET_UID ? 
                                                <td className="whitespace-nowrap px-4 py-1 text-slate-400">
                                                    <button onClick={() => generateCertificate(data)} className='border rounded-lg p-1 text-xs cursor-pointer border-accent'>Certificate</button>
                                                </td> : null
                                            }
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
                            className="max-h-[90vh] w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl sm:p-6"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="lead-modal-title-elite-ambassador"
                            >
                                <div className="flex items-start justify-end gap-3">
                                    <ModalCloseButton onClick={() => setModalOpen(false)} />
                                </div>
                                <div className='max-w-4xl overflow-x-auto'>
                                    <table className="w-full text-left text-xs sm:text-sm">
                                        <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-slate-500">
                                        <tr>
                                            <th className="px-4 py-2 font-medium whitespace-nowrap w-10">Sr No.</th>
                                            <th className="px-4 py-2 font-medium whitespace-nowrap">Name</th>
                                            <th className="px-4 py-2 font-medium whitespace-nowrap">Phone No.</th>
                                            <th className="px-4 py-2 font-medium whitespace-nowrap">ECB MSME Link</th>
                                            {profile.uid === TARGET_UID ? 
                                                <th className="px-4 py-2 font-medium whitespace-nowrap">PAN</th> : null
                                            }
                                            {profile.uid === TARGET_UID ? 
                                                <th className="px-4 py-2 font-medium whitespace-nowrap">Email Id</th> : null
                                            }
                                            {profile.uid === TARGET_UID ? 
                                                <th className="px-4 py-2 font-medium whitespace-nowrap">Date of Birth</th> : null
                                            }
                                            {profile.uid === TARGET_UID ? 
                                                <th className="px-4 py-2 font-medium whitespace-nowrap">Certificate</th> : null
                                            }
                                            {profile.uid === TARGET_UID ? 
                                                <th className="px-4 py-2 font-medium whitespace-nowrap">Visiting Card</th> : null
                                            }
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
                                                    <td className="whitespace-nowrap px-4 py-1 text-slate-400">{import.meta.env.VITE_HOST}/lead/loan/{data.id || '-'}</td>
                                                    {profile.uid === TARGET_UID ? 
                                                        <td className="whitespace-nowrap px-4 py-1 text-slate-400">{data.pan || '-'}</td> : null
                                                    }
                                                    {profile.uid === TARGET_UID ? 
                                                        <td className="whitespace-nowrap px-4 py-1 text-slate-400">{data.email || '-'}</td> : null
                                                    }
                                                    {profile.uid === TARGET_UID ? 
                                                        <td className="whitespace-nowrap px-4 py-1 text-slate-400">{data.dob || '-'}</td> : null
                                                    }
                                                    {profile.uid === TARGET_UID ? 
                                                        <td className="whitespace-nowrap px-4 py-1 text-slate-400">
                                                            <button onClick={() => generateCertificate(data)} className='border rounded-lg p-1 text-xs cursor-pointer border-accent'>Certificate</button>
                                                        </td> : null
                                                    }
                                                    {profile.uid === TARGET_UID ? 
                                                        <td className="whitespace-nowrap px-4 py-1 text-slate-400">
                                                            <button onClick={() => generateVisitingAmbassador(data)} className='border rounded-lg p-1 text-xs cursor-pointer border-accent'>Visiting Card</button>
                                                        </td> : null
                                                    }
                                                </tr>
                                            ))
                                        )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    }
                    <canvas ref={canvasRef} style={{ display: "none" }} />
                </div>
            </div>
        </>
    )
}

export default AmbassadorsList