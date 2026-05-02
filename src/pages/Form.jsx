import React, { useState } from 'react'
import { State, City } from "country-state-city";
import { useProducts } from '../hooks/useProducts';

function Form() {
    const [selectedState, setSelectedState] = useState("");
    const [selectedProducts, setSelectedProducts] = useState("");
    const [cities, setCities] = useState([]);
    const { products } = useProducts();
    const states = State.getStatesOfCountry("IN");

    const handleStateChange = (e) => {
        const isoCode = e.target.value;
        setSelectedState(isoCode);
        const stateCities = City.getCitiesOfState("IN", isoCode);
        setCities(stateCities);
    };

    const services = [
        { name: "Capital Market Advisory", href: "https://www.pcred.org/capitalmarket.html" },
        { name: "Credit Rating Optimization", href: "https://www.pcred.org/creditrating.html" },
        { name: "Debt Advisory", href: "https://www.pcred.org/debtadvisory.html" },
        { name: "Virtual CFO Services", href: "https://www.pcred.org/virtualcfo.html" },
        { name: "Risk Management", href: "https://www.pcred.org/riskmanagement.html" },
        { name: "IPO Advisory", href: "https://www.pcred.org/ipoadvisory.html" },
    ];

    const metrics = [
        { val: "₹322cr", label: "Disbursed" },
        { val: "16+", label: "Years" },
        { val: "1600+", label: "Clients" },
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
                        <h1 className="text-2xl font-semibold text-white">Loan in Minutes</h1>
                        <form action="" className='py-3 flex flex-col gap-2'>
                            <div>
                                <label htmlFor="name">Full Name</label>
                                <input type="text" className='mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white' />
                            </div>
                            <div>
                                <label htmlFor="mobile_no">Mobile No.</label>
                                <input type="number" className='mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white' />
                            </div>
                            <div>
                                <label htmlFor="email">Email</label>
                                <input type="email" className='mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white' />
                            </div>
                            <div>
                                <label htmlFor="state">State</label>
                                <select className='mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white' onChange={handleStateChange} defaultValue="">
                                    <option value="" disabled>-- select state --</option>
                                    {states.map((state) => (
                                        <option key={state.isoCode} value={state.isoCode}>
                                            {state.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="city">City</label>
                                <select className='mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white' disabled={!selectedState}>
                                    <option value="">-- select city --</option>
                                    {cities.map((city) => (
                                        <option key={city.name} value={city.name}>
                                            {city.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="products">Products</label>
                                <select className='mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white'>
                                    <option value="">-- select products --</option>
                                    {products.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="amount">Amount</label>
                                <input type="number" className='mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white' />
                            </div>
                            <div>
                                <label htmlFor="remarks">Remarks</label>
                                <textarea className='mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white' />
                            </div>
                            <button
                                type="submit"
                                className="mt-2 w-full bg-blue-800 hover:bg-blue-700 active:scale-[0.98] text-blue-100 font-semibold text-sm py-2.5 rounded-lg transition-colors tracking-wide"
                            >
                                Submit →
                            </button>
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