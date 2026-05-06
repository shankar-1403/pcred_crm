import React, { useState, useEffect, useMemo } from 'react'
import { State, City } from "country-state-city";
import { useProducts } from '../hooks/useProducts';
import { push, ref, set, update } from 'firebase/database';
import { useAmbassador } from '../hooks/useAmbassador';
import { useEliteAmbassador } from '../hooks/useEliteAmbassador';
import { db } from '../lib/firebase'
import { labelForLeadStatus } from '../lib/statusLabels';
import { useStatuses } from '../hooks/useStatuses';
import { statusLabelMapFromStatuses } from '../lib/statusLabels';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  clientName: '',
  clientPhoneNo: '',
  clientEmail: '',
  company: '',
  state:'',
  city: '',
  productId:'',
  totalAmount:'',
  description: '',
};

function Form() {
    const {ambassador} = useAmbassador();
    const {eliteAmbassador} = useEliteAmbassador();
    const {statuses} = useStatuses(); 
    const [selectedState, setSelectedState] = useState("");
    const [cities, setCities] = useState([]);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const { products } = useProducts();
    const states = State.getStatesOfCountry("IN");
    const uid = window.location.href.split("/")[5];

    function productNameFor(productId) {
        if (!productId) return '-'
        const product = products.find((p) => p.id === productId)
        return product?.name || productId
    }

    const statusLabelByValue = useMemo(
        () => statusLabelMapFromStatuses(statuses),
        [statuses],
    )

    const ambassador_id = ambassador.map((data)=>{
        return data.id;
    })
    const elite_ambassador_id = eliteAmbassador.map((data)=>{
        return data.id;
    })

    const ambassadorData = ambassador.find((data) => uid === data.id);
    const ambassadorName = ambassadorData?.name;
    
    const eliteAmbassadorData = eliteAmbassador.find((data)=> uid === data.id);
    const eliteAmbassadorName =  eliteAmbassadorData?.name;

    const label = () => {
        if (ambassador_id.includes(uid)){
            return "ambassadorId"
        }else if (elite_ambassador_id.includes(uid)) {
            return "eliteAmbassadorId"
        } else {
            return "createdBy"
        }
    }

    const name = () => {
        if (ambassador_id.includes(uid)){
            return `${ambassadorName} (Ambassador)`
        }else if (elite_ambassador_id.includes(uid)) {
            return `${eliteAmbassadorName} (Elite Ambassador)`
        }
    }

    const handleStateChange = (e) => {
        const isoCode = e.target.value;
        const selected = states.find((s) => s.isoCode === isoCode);
        setSelectedState(isoCode);
        setForm((f) => ({ ...f, state: selected?.name, city: "" }));
        const stateCities = City.getCitiesOfState("IN", isoCode);
        setCities(stateCities);
    };

    function sendTelegramMessage() {
        const BOT_TOKEN = import.meta.env.VITE_BOT_TOKEN
        const CHAT_ID = "-1003871644587"
        const message = `
          Created through a magic link by ${[name()]}
    
          Hello Team,
    
          Here are new lead details:
          
          Company: ${form.company || '-'}
          Client Name: ${form.clientName || '-'}
          Product: ${productNameFor(form.productId)}
          Amount: ₹${Number(form.totalAmount || 0).toLocaleString('en-IN')}
          Status: ${labelForLeadStatus(statusLabelByValue, form.status) || 'New'}
          Remarks : ${form.description}

          Thank you.
        `
        fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            chat_id: CHAT_ID,
            text: message,
            parse_mode: "Markdown"
          })
        })
        .then(res => res.json())
        .then(data => console.log("Sent:", data))
        .catch(err => console.error("Error:", err))
    }

    async function saveLead(e) {
        e.preventDefault()
        if(!form.clientName && !form.clientPhoneNo && !form.clientEmail && !form.company && !form.city && !form.productId && !form.totalAmount){
            setErrorMessage("All fields are required")
            return
        }
        setSaving(true)
        try {
            const payload = {
                clientName: form.clientName.trim(),
                clientPhoneNo: form.clientPhoneNo.trim(),
                clientEmail: form.clientEmail.trim(),
                company: form.company.trim(),
                location: `${form.state.trim()}, ${form.city.trim()}`,
                description: form.description.trim(),
                [label()] : uid,
                productId: form.productId || null,
                totalAmount: form.totalAmount || '',
            }
          
            const newRef = push(ref(db, 'leads'))
            await set(newRef, {
                ...payload,
                createdAt: new Date().toISOString().split("T")[0],
                leadDate: new Date().toISOString().split("T")[0]
            })
            setMessage("Form Submitted Successfully")
            setSelectedState("")
            setForm(emptyForm)
            // sendTelegramMessage()
        } finally {
          setSaving(false)
        }
    }

    const services = [
        { name: "Capital Market Advisory", href: "https://www.pcred.org/capitalmarket.html" },
        { name: "Credit Rating Optimization", href: "https://www.pcred.org/creditrating.html" },
        { name: "Debt Advisory", href: "https://www.pcred.org/debtadvisory.html" },
        { name: "Virtual CFO Services", href: "https://www.pcred.org/virtualcfo.html" },
        { name: "Risk Management", href: "https://www.pcred.org/riskmanagement.html" },
        { name: "IPO Advisory", href: "https://www.pcred.org/ipoadvisory.html" },
    ];

    const metrics = [
        { val: "5+", label: "Years" },
        { val: "5000+", label: "Clients" },
    ];

    const contacts = [
        {
            href: "mailto:info@pcred.org",
            label: "info@pcred.org",
            icon: (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                </svg>
            ),
        },
        {
            href: "tel:+912235120060",
            label: "+91 22 35120060",
            icon: (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.58 3.49 2 2 0 0 1 3.55 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.54a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
            ),
        },
        {
            href: "https://www.pcred.org",
            label: "www.pcred.org",
            icon: (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
            ),
        },
    ];

    const socials = [
        {
            href: "https://www.pcred.org",
            title: "Website",
            icon: (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
            ),
        },
        {
            href: "mailto:info@pcred.org",
            title: "Email",
            icon: (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                </svg>
            ),
        },
        {
            href: "tel:+912235120060",
            title: "Call",
            icon: (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.58 3.49 2 2 0 0 1 3.55 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.54a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
            ),
        },
    ];

    return (
        <>
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-2 max-w-6xl mx-auto my-10">
                <div className="flex flex-col lg:flex-row lg:items-stretch">
                    <div className="w-full lg:w-1/2 p-4">
                        <form onSubmit={saveLead} className='py-3 flex flex-col gap-2'>
                            <div>
                                <label htmlFor="name">Full Name <span className='text-red-600 text-sm'>*</span></label>
                                <input value={form.clientName} onChange={(e) =>setForm((f) => ({ ...f, clientName: e.target.value }))} className='mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white' />
                            </div>
                            <div>
                                <label htmlFor="company_name">Company Name <span className='text-red-600 text-sm'>*</span></label>
                                <input value={form.company} onChange={(e) =>setForm((f) => ({ ...f, company: e.target.value }))} className='mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white' />
                            </div>
                            <div>
                                <label htmlFor="mobile_no">Mobile No. <span className='text-red-600 text-sm'>*</span></label>
                                <input type="number" value={form.clientPhoneNo} onChange={(e) =>setForm((f) => ({ ...f, clientPhoneNo: e.target.value }))} className='mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white' />
                            </div>
                            <div>
                                <label htmlFor="email">Email <span className='text-red-600 text-sm'>*</span></label>
                                <input type="email" value={form.clientEmail} onChange={(e) =>setForm((f) => ({ ...f, clientEmail: e.target.value }))} className='mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white' />
                            </div>
                            <div>
                                <label htmlFor="state">State <span className='text-red-600 text-sm'>*</span></label>
                                <select value={selectedState} onChange={handleStateChange} className='mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white'>
                                    <option value="" disabled>-- select state --</option>
                                    {states.map((state) => (
                                        <option key={state.isoCode} value={state.isoCode}>
                                            {state.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="city">City <span className='text-red-600 text-sm'>*</span></label>
                                <select value={form.city} onChange={(e) =>setForm((f) => ({ ...f, city: e.target.value }))} className='mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white' disabled={!selectedState}>
                                    <option value="">-- select city --</option>
                                    {cities.map((city) => (
                                        <option key={city.name} value={city.name}>
                                            {city.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="products">Products <span className='text-red-600 text-sm'>*</span></label>
                                <select value={form.productId} onChange={(e) =>setForm((f) => ({ ...f, productId: e.target.value }))} className='mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white'>
                                    <option value="">-- select products --</option>
                                    {products.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="amount">Amount <span className='text-red-600 text-sm'>*</span></label>
                                <input type="number" value={form.totalAmount} onChange={(e) =>setForm((f) => ({ ...f, totalAmount: e.target.value }))} className='mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white' />
                            </div>
                            <div>
                                <label htmlFor="remarks">Remarks</label>
                                <textarea  value={form.description} onChange={(e) =>setForm((f) => ({ ...f, description: e.target.value }))} className='mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white' />
                            </div>
                            <button type="submit" className="mt-2 w-full bg-blue-800 hover:bg-blue-700 active:scale-[0.98] text-blue-100 font-semibold text-sm py-2.5 rounded-lg transition-colors tracking-wide cursor-pointer" disabled={saving}>{saving ? 'Submitting' : 'Submit'}</button>
                            <div>
                                {errorMessage && <span className='text-red-500 text-sm'>{errorMessage}</span>}
                                {message && <span className='text-green-500 text-sm'>{message}</span>}
                            </div>
                        </form>
                    </div>

                    <div className="w-full lg:w-1/2 p-4 flex flex-col">
                        <div className="flex flex-col bg-[#111827] rounded-xl border border-slate-800 overflow-hidden h-full min-h-full">

                            <div className="p-6 border-b border-slate-800">
                                <img
                                    src="/pcred-logo-og.png"
                                    alt="PCRED"
                                    className="h-25 w-auto object-contain mb-4"
                                />
                                <p className="text-[15px] tracking-[2px] uppercase text-slate-500 mt-0.5 mb-3">
                                    Corporate Advisory Services
                                </p>
                                <p className="text-[13px] text-slate-500 leading-relaxed">
                                    PCRED stands at the forefront of financial advisory, offering sophisticated solutions tailored to the complex demands of modern enterprises. With a commitment to excellence and innovation, we help businesses achieve unmatched financial clarity and operational efficiency.
                                </p>
                            </div>


                            <div className="grid grid-cols-3 gap-2 p-4 border-b border-slate-800">
                                {metrics.map((m) => (
                                    <div key={m.label} className="bg-slate-900 border border-slate-800 rounded-lg py-3 text-center">
                                        <span className="block text-base font-bold text-blue-400">{m.val}</span>
                                        <span className="block text-[10px] text-slate-500 mt-1">{m.label}</span>
                                    </div>
                                ))}
                            </div>


                            <div className="p-4 flex-1">
                                <p className="text-[15px] tracking-[2px] uppercase text-slate-600 font-semibold mb-2">
                                    Our Services
                                </p>

                                <div className="grid grid-cols-2 gap-2">
                                    {services.map((s) => (
                                        <a
                                            key={s.name}
                                            href={s.href}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-2 bg-slate-900 hover:bg-blue-950/30 border border-slate-800 hover:border-blue-900 rounded-lg px-3 py-2 transition-colors no-underline"
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-800 shrink-0" />
                                            <span className="text-[11px] text-slate-400 leading-snug">
                                                {s.name}
                                            </span>
                                        </a>
                                    ))}
                                </div>
                            </div>


                            <div className="p-4 border-b border-slate-800">
                                <p className="text-[15px] tracking-[2px] uppercase text-slate-600 font-semibold mb-2">
                                    Get in Touch
                                </p>

                                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col gap-2.5">
                                    {contacts.map((c) => (
                                        <a
                                            key={c.label}
                                            href={c.href}
                                            rel="noreferrer"
                                            className="flex items-center gap-2.5 no-underline"
                                        >
                                            <div className="w-6 h-6 rounded bg-blue-950/40 border border-blue-900/30 flex items-center justify-center shrink-0">
                                                {c.icon}
                                            </div>
                                            <span className="text-[12px] text-slate-400">{c.label}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>

                        </div >
                    </div >

                </div >
            </div >
        </>
    )
}

export default Form