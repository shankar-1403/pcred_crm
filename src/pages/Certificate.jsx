import React,{useRef,useState} from 'react';
import {jsPDF} from 'jspdf';
import { useAuth } from '../context/AuthContext';
import { useAmbassador } from '../hooks/useAmbassador';
import { useEliteAmbassador } from '../hooks/useEliteAmbassador';
import certificate from "../../public/certificate.png";
import { SALUTATIONS } from '../lib/salutation';
import { useUsers } from '../hooks/useUsers';

function Certificate() {
    const { profile, user } = useAuth();
    const {users} = useUsers();
    const {ambassador} = useAmbassador();
    const {eliteAmbassador} = useEliteAmbassador();
    const name = profile.displayName;
    const uid = profile.uid;

    const ambassador_id = ambassador.find((data)=>{
        return data.id;
    })
    const elite_ambassador_id = eliteAmbassador.find((data)=>{
        return data.id;
    })

    const ambassadorData = ambassador.find((data) => uid === data.id);
    const employeeData = users.find((data) => uid === data.id);
    const eliteAmbassadorData = eliteAmbassador.find((data)=> uid === data.id);

    const salutationValue = employeeData?.salutation || ambassadorData?.salutation || eliteAmbassadorData?.salutation;
    const salutationName = SALUTATIONS.find(item => item.id == salutationValue);

    const loadFont = async () => {
        const font = new FontFace(
            "GreatVibes",
            "url(/fonts/GreatVibes-Regular.ttf)"
        );

        await font.load();
        document.fonts.add(font);
    };

    const newFont = async () => {
        const font = new FontFace(
            "QuattroCento",
            "url(/fonts/Quattrocento-Regular.ttf)"
        );

        await font.load();
        document.fonts.add(font);
    };


    const canvasRef = useRef(null);
    const generateCertificate = async() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        await loadFont();
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
        ctx.fillText(`This is to certify that ${salutationName?.label || ""}` || "", salutationX, salutationY);

        ctx.fillStyle = "#000000";
        ctx.font = name.length > 20 ? "100px GreatVibes" : "150px GreatVibes";
        ctx.fillText(name, x, nameY);

        const imgData = canvas.toDataURL("image/png");

        // Generate PDF
        const pdf = new jsPDF({
            orientation: canvas.width > canvas.height ? "landscape" : "portrait",
            unit: "px",
            format: [canvas.width, canvas.height],
        });

        pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
        pdf.save(`${name}_certificate.pdf`);
        };
    };

    return (
        <div className="min-w-0 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-white">Certificate</h1>
                </div>
            </div>
        
            <div className="max-w-full min-w-0 p-2 rounded-xl border border-slate-800 bg-slate-900/40 [-webkit-overflow-scrolling:touch]">
                <button
                    onClick={generateCertificate}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl"
                >
                    Download Certificate
                </button>

                <canvas ref={canvasRef} style={{ display: "none" }} />
            </div>
        </div>
    )
}

export default Certificate