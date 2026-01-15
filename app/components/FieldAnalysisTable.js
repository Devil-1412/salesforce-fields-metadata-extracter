"use client";

import { useState, useMemo } from "react";
import VirtualTable from "./VirtualTable";
import toast from "react-hot-toast";

export default function FieldAnalysisTable({ fields, objectName, token, instanceUrl }) {
  const [analysisData, setAnalysisData] = useState({});
  const [loadingMap, setLoadingMap] = useState({});

  const fetchAnalysis = async (type) => {
    if (!token || !instanceUrl || !objectName) return;

    setLoadingMap(prev => ({ ...prev, [type]: true }));
    const toastId = toast.loading(`Calculating ${type}...`);

    try {
      const res = await fetch("/api/fieldAnalysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: token,
          instanceUrl,
          objectName,
          type
        }),
      });
      const data = await res.json();

      if (data.success) {
        setAnalysisData(prev => {
           // Merge new data into existing field entries
           const newData = { ...prev };
           // data.data is keyed by field name { FieldName: Value }
           Object.entries(data.data).forEach(([fieldName, value]) => {
                newData[fieldName] = { ...newData[fieldName], [type]: value };
           });
           return newData;
        });
        toast.success(`Calculated ${type}`, { id: toastId });
      } else {
        toast.error(data.message || "Analysis failed", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error(`Error calculating ${type}`, { id: toastId });
    } finally {
      setLoadingMap(prev => ({ ...prev, [type]: false }));
    }
  };

  // Merge static fields with dynamic analysis data
  const tableData = useMemo(() => {
    return fields.map(f => {
        const fieldName = f.ApiName || f.name;
        return {
            ...f,
            ...(analysisData[fieldName] || {})
        };
    });
  }, [fields, analysisData]);

  const columns = [
    { label: "Field Label", key: "label", width: "15%" },
    { label: "API Name", key: "ApiName", width: "15%" },
    { label: "Type", key: "type", width: "10%" },
    { 
        label: "Sample Value", 
        key: "sample", 
        width: "15%",
        headerRender: () => (
            <HeaderAction 
                label="Sample Value" 
                onClick={() => fetchAnalysis('sample')} 
                loading={loadingMap['sample']} 
            />
        ),
        render: (item) => item.sample || "—"
    },
    { 
        label: "Populated", 
        key: "fieldCount", 
        width: "10%",
        headerRender: () => (
            <HeaderAction 
                label="Populated" 
                onClick={() => fetchAnalysis('fieldCount')} 
                loading={loadingMap['fieldCount']} 
            />
        ),
        render: (item) => item.fieldCount !== undefined ? item.fieldCount : "—"
    },
    { 
        label: "Nulls", 
        key: "nullCount", 
        width: "10%",
        headerRender: () => (
            <HeaderAction 
                label="Nulls" 
                onClick={() => fetchAnalysis('nullCount')} 
                loading={loadingMap['nullCount']} 
            />
        ),
        render: (item) => item.nullCount !== undefined ? item.nullCount : "—"
    },
    { 
        label: "% Populated", 
        key: "percentPresent", 
        width: "10%",
        headerRender: () => (
            <HeaderAction 
                label="% Populated" 
                onClick={() => fetchAnalysis('percentPresent')} 
                loading={loadingMap['percentPresent']} 
            />
        ),
         render: (item) => item.percentPresent || "—"
    },
     { 
        label: "Distinct", 
        key: "distinctCount", 
        width: "15%",
        headerRender: () => (
            <HeaderAction 
                label="Distinct" 
                onClick={() => fetchAnalysis('distinctCount')} 
                loading={loadingMap['distinctCount']} 
            />
        ),
        render: (item) => item.distinctCount !== undefined ? item.distinctCount : "—"
    }
  ];

  return (
    <VirtualTable 
        data={tableData}
        columns={columns}
        itemSize={50}
        emptyMessage="No fields to analyze."
        className="h-full"
    />
  );
}

function HeaderAction({ label, onClick, loading }) {
    return (
        <div className="flex flex-col items-start gap-1">
            <span>{label}</span>
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
                disabled={loading}
                className="text-[10px] bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded border border-white/30 transition-colors uppercase font-bold tracking-wider disabled:opacity-50 disabled:cursor-wait"
            >
                {loading ? "..." : "Fetch"}
            </button>
        </div>
    );
}
