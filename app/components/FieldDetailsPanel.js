"use client";

import { useEffect, useState } from "react";
import { X, Calendar, User, FileText, Shield, Info, Database } from "lucide-react";
import toast from "react-hot-toast";

export default function FieldDetailsPanel({ 
  field, 
  onClose, 
  instanceUrl, 
  token,
  objectName 
}) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/getFieldDetails", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken: token,
            instanceUrl,
            objectName: objectName,
            fieldName: field.ApiName || field.name,
          }),
        });
        const data = await res.json();
        if (data.success) {
            setDetails(data.data);
        } else {
             // If not found in Tooling API for some reason, we just use what we have
             console.warn("Field details fetch failed or not found:", data.error);
        }
      } catch (err) {
        console.error("Error fetching details:", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (field && token && instanceUrl) {
        fetchDetails();
    }
  }, [field, token, instanceUrl, objectName]);

  if (!field) return null;

  // Merge tooling data with existing basic metadata
  // Priority: Tooling API > Basic Metadata
  const displayData = { ...field, ...details };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
        return new Date(dateStr).toLocaleString();
    } catch (e) { return dateStr; }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-medium uppercase tracking-wide">
                {displayData.type || displayData.DataType || "Field"}
             </span>
             {displayData.custom && (
                <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded font-medium uppercase tracking-wide">
                    Custom
                </span>
             )}
           </div>
           <h2 className="text-xl font-bold text-gray-900 break-words">{displayData.label || displayData.MasterLabel}</h2>
           <code className="text-sm text-gray-500 font-mono mt-1 block select-all">{displayData.ApiName || displayData.DeveloperName || displayData.name}</code>
        </div>
        <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
        >
            <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Description */}
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
             <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" /> Description
             </h3>
             <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {displayData.Description || displayData.description || "No description provided."}
             </p>
             {displayData.HelpText && (
                <div className="mt-3 pt-3 border-t border-blue-200/50">
                   <span className="text-xs font-bold text-blue-800 uppercase block mb-1">Help Text</span>
                   <p className="text-sm text-blue-800/80 italic">"{displayData.HelpText}"</p>
                </div>
             )}
        </div>

        {/* Audit Info */}
        <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
               <Calendar className="w-4 h-4 text-gray-400" /> Audit Information
            </h3>
            
            {loading ? (
                <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-start gap-3">
                        <div className="mt-1 bg-green-100 p-1.5 rounded-lg text-green-600">
                             <User className="w-4 h-4" />
                        </div>
                        <div>
                             <p className="text-xs text-gray-500 font-medium uppercase">Created By</p>
                             <p className="text-sm font-medium text-gray-900">
                                {displayData.CreatedBy?.Name || "System / Unknown"}
                             </p>
                             <p className="text-xs text-gray-500 mt-0.5">
                                {formatDate(displayData.CreatedDate)}
                             </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                         <div className="mt-1 bg-orange-100 p-1.5 rounded-lg text-orange-600">
                             <FileText className="w-4 h-4" />
                        </div>
                        <div>
                             <p className="text-xs text-gray-500 font-medium uppercase">Last Modified By</p>
                             <p className="text-sm font-medium text-gray-900">
                                {displayData.LastModifiedBy?.Name || "System / Unknown"}
                             </p>
                             <p className="text-xs text-gray-500 mt-0.5">
                                {formatDate(displayData.LastModifiedDate)}
                             </p>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Technical Details */}
        <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
               <Database className="w-4 h-4 text-gray-400" /> Properties
            </h3>
            <div className="grid grid-cols-2 gap-4">
                 <DetailItem label="Length" value={displayData.length} />
                 <DetailItem label="Precision" value={displayData.precision} />
                 <DetailItem label="Scale" value={displayData.scale} />
                 <DetailItem label="Unique" value={displayData.unique} isBool />
                 <DetailItem label="External ID" value={displayData.externalId} isBool />
                 <DetailItem label="Case Sensitive" value={displayData.caseSensitive} isBool />
                 <DetailItem label="Required" value={!displayData.nillable && !displayData.firstName} isBool />
                 <DetailItem label="Calculated" value={displayData.calculated} isBool />
            </div>
            
            {displayData.defaultValueFormula && (
                 <div className="mt-4">
                    <p className="text-xs text-gray-500 font-medium uppercase mb-1">Default Formula</p>
                    <code className="block bg-gray-50 p-2 rounded text-xs border border-gray-200 text-gray-700 font-mono break-all">
                        {displayData.defaultValueFormula}
                    </code>
                 </div>
            )}
             {displayData.calculatedFormula && (
                 <div className="mt-4">
                    <p className="text-xs text-gray-500 font-medium uppercase mb-1">Calculated Formula</p>
                    <code className="block bg-gray-50 p-2 rounded text-xs border border-gray-200 text-gray-700 font-mono break-all">
                        {displayData.calculatedFormula}
                    </code>
                 </div>
            )}
        </div>
        
        {/* Compliance */}
        {(displayData.SecurityClassification || displayData.BusinessStatus || displayData.ComplianceGroup) && (
             <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                   <Shield className="w-4 h-4 text-gray-400" /> Compliance
                </h3>
                 <div className="space-y-3">
                    {displayData.SecurityClassification && (
                         <BadgeItem label="Security Classification" value={displayData.SecurityClassification} color="red" />
                    )}
                     {displayData.BusinessStatus && (
                         <BadgeItem label="Business Status" value={displayData.BusinessStatus} color="blue" />
                    )}
                     {displayData.ComplianceGroup && (
                         <BadgeItem label="Compliance Group" value={displayData.ComplianceGroup} color="purple" />
                    )}
                 </div>
             </div>
        )}

      </div>
    </div>
  );
}

function DetailItem({ label, value, isBool }) {
    if (value === undefined || value === null || value === "") return null;
    return (
        <div>
            <p className="text-xs text-gray-500 font-medium uppercase">{label}</p>
            {isBool ? (
                value ? <span className="text-green-600 font-bold text-sm">Yes</span> : <span className="text-gray-400 text-sm">No</span>
            ) : (
                <p className="text-sm font-medium text-gray-900">{String(value)}</p>
            )}
        </div>
    );
}

function BadgeItem({ label, value, color }) {
    const colorStyles = {
        red: "bg-red-50 text-red-700 border-red-100",
        blue: "bg-blue-50 text-blue-700 border-blue-100",
        purple: "bg-purple-50 text-purple-700 border-purple-100",
        green: "bg-green-50 text-green-700 border-green-100",
        orange: "bg-orange-50 text-orange-700 border-orange-100",
    };
    const styleClass = colorStyles[color] || colorStyles.blue;

    return (
        <div className="flex justify-between items-center">
             <span className="text-sm text-gray-600">{label}</span>
             <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${styleClass}`}>
                {value}
             </span>
        </div>
    );
}
