"use client";

import { useMemo } from "react";

export default function OrgHeader({
  title,
  description,
  orgs = [],
  selectedOrgId,
  onSelectOrg,
  orgLoading,
  selectedOrgMeta,
  children
}) {
  const activeOrgDisplay = useMemo(() => {
    if (!selectedOrgMeta?.instanceUrl) return null;
    return selectedOrgMeta.instanceUrl
      .replace("https://", "")
      .replace(".my.salesforce.com", "");
  }, [selectedOrgMeta]);

  return (
    <header className="relative w-full overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 shadow-xl">
      {/* Subtle Background Art */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 h-80 w-80 rounded-full bg-white/10 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl"></div>
      
      <div className="relative z-10 flex flex-col justify-between gap-8 px-8 py-10 md:flex-row md:items-end">
        {/* Title Section */}
        <div className="max-w-2xl space-y-4">
          <div className="flex items-center gap-3">
             <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                 <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                 <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
               </svg>
             </span>
             <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl text-shadow-sm">
              {title}
            </h1>
          </div>
          <p className="text-base text-blue-50 antialiased md:text-lg font-medium">
            {description}
          </p>
          {children && <div className="pt-2">{children}</div>}
        </div>

        {/* Minimalist Org Switcher */}
        <div className="flex flex-col items-start gap-3 md:items-end">
          {/* Status Badge */}
          {activeOrgDisplay ? (
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 ring-1 ring-inset ring-white/20 backdrop-blur-md">
               <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400"></span>
               </span>
               <span className="text-xs font-bold text-white tracking-wide">
                 {activeOrgDisplay}
               </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-full bg-black/20 px-3 py-1 ring-1 ring-inset ring-white/10">
               <div className="h-2 w-2 rounded-full bg-gray-400"></div>
               <span className="text-xs font-medium text-gray-300">Not Connected</span>
            </div>
          )}

          {/* Clean Light Input */}
          <div className="relative w-full md:w-72 group">
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 opacity-30 blur transition group-hover:opacity-60"></div>
            <select
              className="relative w-full cursor-pointer appearance-none rounded-xl bg-white py-3 pl-4 pr-10 text-sm font-bold text-gray-800 shadow-lg ring-1 ring-black/5 transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-white/50"
              value={selectedOrgId || ""}
              onChange={(event) => onSelectOrg(event.target.value)}
              disabled={orgLoading || !orgs.length}
            >
              <option value="" className="text-gray-500">
                {orgLoading ? "Loading..." : "Select Organization"}
              </option>
              {orgs.map((org) => {
                const iUrl = org.instance_url || org.instanceUrl;
                const oName = org.org_name || org.orgName;
                return (
                  <option
                    key={iUrl}
                    value={iUrl}
                    className="text-gray-900 py-2"
                  >
                    {oName && oName !== "None" ? oName : "Salesforce Org"}
                  </option>
                );
              })}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
