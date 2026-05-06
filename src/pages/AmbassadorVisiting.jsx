import React,{useRef,useState} from 'react';
import {jsPDF} from 'jspdf';
import { useAuth } from '../context/AuthContext';
import { useAmbassador } from '../hooks/useAmbassador';
import businessOne from "../../public/business_1.png";
import businessTwoSmall from "../../public/business_2_small.png";
import businessTwoBig from "../../public/business_2_big.png";
import { SALUTATIONS } from '../lib/salutation';
import { useEliteAmbassador } from '../hooks/useEliteAmbassador';

function AmbassadorVisiting() {
    const { profile, user } = useAuth();
    const {ambassador} = useAmbassador();
    const {eliteAmbassador} = useEliteAmbassador();
    const name = profile.displayName;
    const nameLength = profile.displayName.length;
    const email = profile.email;
    const phone = profile.phoneNo;
    const uid = profile.uid;
    const roleName = profile.role;
    const role = roleName === "elite_ambassador" ? "Elite Ambassador" : "Ambassador";
    const ambassador_id = ambassador.find((data)=>{
        return data.id;
    })
    const elite_ambassador_id = eliteAmbassador.find((data)=>{
        return data.id;
    })

    const ambassadorData = ambassador.find((data) => uid === data.id);
    const eliteAmbassadorData = eliteAmbassador.find((data)=> uid === data.id);

    const salutationValue = ambassadorData?.salutation || eliteAmbassadorData?.salutation;
    const salutationName = SALUTATIONS.find(item => item.id == salutationValue);

    const loadFont = async () => {
        const font = new FontFace(
            "Myriad",
            "url(/fonts/Myriad-Variable-Concept.ttf)"
        );

        await font.load();
        document.fonts.add(font);
    };


    const canvasRef = useRef(null);
    const generateCertificate = async () => {
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
        const img2 = await loadImage(nameLength > 20 ? businessTwoBig : businessTwoSmall);

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
        ctx.font = "38px Myriad";

        const x2 = nameLength > 20 ? 455 : 592;
        const baseY2 = canvas.height * 0.26;
        const y2 = canvas.height * 0.35;
        const x3 = 95;
        const y3 = 465;
        const x4 = 95;
        const y4 = 530;
        ctx.fillText(`${salutationName?.label || ""} ${name}`, x2, baseY2);
        ctx.font = "35px Myriad";
        ctx.fillText(role, x2, y2);
        ctx.fillStyle = "#000000";
        ctx.font = "28px Myriad";
        ctx.fillText(email, x3, y3);
        ctx.fillText(phone, x4, y4);

        pdf.addPage([img2.width, img2.height]); // ✅ page size matches image

        imgData = canvas.toDataURL("image/png");
        pdf.addImage(imgData, "PNG", 0, 0, img2.width, img2.height);

        pdf.save(`${name}_visiting_card.pdf`);
    };
    return (
        <div className="min-w-0 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-white">Visiting Card</h1>
                </div>
            </div>
        
            <div className="max-w-full min-w-0 p-2 rounded-xl border border-slate-800 bg-slate-900/40 [-webkit-overflow-scrolling:touch]">
                <button onClick={generateCertificate} className="bg-blue-600 text-white px-4 py-2 rounded-xl">Download Visiting Card</button>
                <canvas ref={canvasRef} style={{ display: "none" }} />
            </div>
        </div>
    )
}

export default AmbassadorVisiting