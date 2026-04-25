import React from 'react'

function Certificate() {
  return (
    <div className="min-w-0 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-2xl font-semibold text-white">My leads</h1>
                <p className="mt-1 text-sm text-slate-400">
                Create leads, set revenue details, and assign process or sales teammates.
                {eliteOrgName ? (
                    <span className="block text-slate-500">Organization: {eliteOrgName}</span>
                ) : null}
                </p>
            </div>
        </div>
    
        <div className="max-w-full min-w-0 rounded-xl border border-slate-800 bg-slate-900/40 [-webkit-overflow-scrolling:touch]">
            
        </div>
    </div>
  )
}

export default Certificate