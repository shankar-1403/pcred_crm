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

    return (
        <>
            <div className="min-w-0 space-y-6 rounded-xl border border-slate-800 bg-slate-900/40 p-2 max-w-6xl mx-auto my-10">
                <div className='flex'>
                    <div className='w-[50%] p-4'>
                        <h1 className="text-2xl font-semibold text-white">Loan in Minutes</h1>
                        <form action="" className='py-3 flex flex-col gap-2'>
                            <div>
                                <label htmlFor="name">Full Name</label>
                                <input type="text" className='mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white'/>
                            </div>
                            <div>
                                <label htmlFor="mobile_no">Mobile No.</label>
                                <input type="number" className='mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white'/>
                            </div>
                            <div>
                                <label htmlFor="email">Email</label>
                                <input type="email" className='mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white'/>
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
                                <input type="number" className='mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white'/>
                            </div>
                            <div>
                                <label htmlFor="remarks">Remarks</label>
                                <textarea className='mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white'/>
                            </div>
                        </form>
                    </div>
                    <div className='w-[50%]'>

                    </div>
                </div>
            </div>
        </>
    )
}

export default Form