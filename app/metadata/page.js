'use client';
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function MetadataPage() {
  const router = useRouter();

  const allMetadataKeys = [
    "label",
    "ApiName",
    "type",
    "length",
    "precision",
    "scale",
    "digits",
    "byteLength",
    "DBOrder",
    "soapType",
    "extraTypeInfo",
    "defaultValue",
    "defaultValueFormula",
    "compoundFieldName",
    "controllerName",
    "filteredLookupInfo",
    "mask",
    "maskType",
    "referenceTo",
    "referenceTargetField",
    "relationshipName",
    "relationshipOrder",
    "aggregatable",
    "aiPredictionField",
    "autoNumber",
    "calculated",
    "cascadeDelete",
    "cascadeDeleteSpecified",
    "caseSensitive",
    "custom",
    "dataTranslationEnabled",
    "dataTranslationEnabledSpecified",
    "defaultedOnCreate",
    "dependentPicklist",
    "dependentPicklistSpecified",
    "deprecatedAndHidden",
    "displayLocationInDecimal",
    "displayLocationInDecimalSpecified",
    "encrypted",
    "encryptedSpecified",
    "externalId",
    "externalIdSpecified",
    "filterable",
    "formulaTreatNullNumberAsZero",
    "formulaTreatNullNumberAsZeroSpecified",
    "groupable",
    "highScaleNumber",
    "highScaleNumberSpecified",
    "htmlFormatted",
    "htmlFormattedSpecified",
    "idLookup",
    "nameField",
    "namePointing",
    "namePointingSpecified",
    "permissionable",
    "polymorphicForeignKey",
    "queryByDistance",
    "relationshipOrderSpecified",
    "restrictedDelete",
    "restrictedDeleteSpecified",
    "restrictedPicklist",
    "searchPrefilterable",
    "sortable",
    "sortableSpecified",
    "unique",
    "writeRequiresMasterRead",
    "writeRequiresMasterReadSpecified",
    "Salesforce Data Type",
    "MSSQL Data Type",
    "Oracle Data Type",
    "MySQL Data Type",
    "Properties",
    "Nullable",
    "Createable",
    "Updateable",
    "On Page Layout",
    "PicklistValues",
    "Category",
    "Description",
    "Help Text",
    "Formula"
  ];

  const TABS = ["Fields", "Validation Rules", "Triggers", "Apex Classes", "Workflows"];
  const [activeTab, setActiveTab] = useState("Fields");

  const [objectDetails, setObjectDetails] = useState([]);
  const [recordCounts, setRecordCounts] = useState({});
  const [fieldsData, setFieldsData] = useState({});
  const [validationRules, setValidationRules] = useState([]);
  const [triggers, setTriggers] = useState([]);
  const [apexClasses, setApexClasses] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [selectedObject, setSelectedObject] = useState("");
  const [selectedObjects, setSelectedObjects] = useState([]);
  const [token, setToken] = useState("");
  const [instanceUrl, setInstanceUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [objectSearch, setObjectSearch] = useState("");
  const [lastSynced, setLastSynced] = useState("");
  const [pinnedObjects, setPinnedObjects] = useState([]);


  // ✅ On mount

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    const t = sessionStorage.getItem("accessToken");
    const url = sessionStorage.getItem("instanceUrl");
    const selObjs = JSON.parse(sessionStorage.getItem("selectedObjects") || "[]");

    if (!t || !url || selObjs.length === 0) {
      setLoading(false);
      router.push("/");
      return;
    }

    setToken(t);
    setInstanceUrl(url);
    setSelectedObjects(selObjs);
    setSelectedObject(selObjs[0]);
    setRecordCounts({});
    setFieldsData({});
    setValidationRules([]);
    setTriggers([]);
    setApexClasses([]);
    setWorkflows([]);

    try {
      const fieldsRes = await fetch("/api/fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: t, instanceUrl: url, objects: selObjs }),
      });
      const fieldsPayload = await fieldsRes.json();
      if (fieldsPayload.success) {
        setFieldsData(fieldsPayload.data);
      }

      const objRes = await fetch("/api/objects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: t, instanceUrl: url }),
      });
      const objData = await objRes.json();
      if (objData.success) {
        setObjectDetails(objData.object);
      }

      for (const obj of selObjs) {
        fetch("/api/getRecordCount", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken: t,
            instanceUrl: url,
            objectName: obj,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            setRecordCounts((prev) => ({
              ...prev,
              [obj]: data.success ? data.count : "N/A",
            }));
          })
          .catch(() => {
            setRecordCounts((prev) => ({
              ...prev,
              [obj]: "N/A",
            }));
          });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLastSynced(new Date().toLocaleString());
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    setPinnedObjects((prev) => prev.filter((obj) => selectedObjects.includes(obj)));
  }, [selectedObjects]);

  const filteredObjects = useMemo(() => {
    const query = objectSearch.trim().toLowerCase();
    if (!query) return selectedObjects;
    return selectedObjects.filter((obj) => obj.toLowerCase().includes(query));
  }, [objectSearch, selectedObjects]);

  const togglePin = (obj) => {
    setPinnedObjects((prev) =>
      prev.includes(obj) ? prev.filter((item) => item !== obj) : [...prev, obj]
    );
  };

  const activeObjectDetails = useMemo(
    () => objectDetails.find((obj) => obj.name === selectedObject),
    [objectDetails, selectedObject]
  );

  const activeFields = fieldsData[selectedObject] || [];


  // ✅ Fetchers for each metadata type (called on tab switch)
  const fetchMetadataByType = async (type) => {
    if (!token || !instanceUrl) return;
    const existingData =
      (type === "validationRules" && validationRules.length > 0) ||
      (type === "triggers" && triggers.length > 0) ||
      (type === "apexClasses" && apexClasses.length > 0) ||
      (type === "workflows" && workflows.length > 0);

    if (existingData) return;
    try {
      const res = await fetch(`/api/objectMetadata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: token, instanceUrl, selectedObject, type }),
      });
      const data = await res.json();
      if (data.success) {
        switch (type) {
          case "validationRules":
            setValidationRules(data.data);
            break;
          case "triggers":
            setTriggers(data.data);
            break;
          case "apexClasses":
            setApexClasses(data.data);
            break;
          case "workflows":
            setWorkflows(data.data);
            break;
        }
      }
    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
    }
  };


  // ✅ Load data when user switches tab
  useEffect(() => {
    if (activeTab === "Validation Rules") fetchMetadataByType("validationRules");
    else if (activeTab === "Triggers") fetchMetadataByType("triggers");
    else if (activeTab === "Apex Classes") fetchMetadataByType("apexClasses");
    else if (activeTab === "Workflows") fetchMetadataByType("workflows");
  }, [activeTab]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <p className="animate-pulse text-lg font-medium">Loading metadata...</p>
      </div>
    );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 flex flex-col items-center p-8">
      <div className="w-full max-w-[98%] bg-white shadow-2xl rounded-3xl p-10 border border-gray-200 min-h-[90vh] overflow-visible">

        {/* 🌈 HEADER SECTION */}
        <header className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-8 px-10 rounded-3xl shadow-lg mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight mb-1">
                Salesforce Metadata Explorer
              </h1>
              <p className="text-blue-100 text-sm">
                Analyze objects, fields, and automation in your Salesforce org.
              </p>
            </div>

            <div className="mt-4 md:mt-0 text-right">
              <p className="text-sm text-blue-100">
                Connected Instance:
              </p>
              <p className="font-semibold text-white">
                {instanceUrl?.replace("https://", "") || "Not Connected"}
              </p>
            </div>
          </div>
        </header>

        {/* 🧩 OBJECT SELECTION + INFO SECTION */}
        <section className="w-full bg-white border border-gray-200 rounded-2xl shadow-md px-8 py-6 mb-8 flex flex-col md:flex-row justify-between items-center">
          {/* Dropdown */}
          <div className="flex flex-col items-start gap-2 w-full max-w-md">
            <label className="text-sm font-semibold text-gray-700">Select Object</label>
            <select
              value={selectedObject}
              onChange={(e) => setSelectedObject(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-300 text-gray-800 text-base rounded-xl px-4 py-3 shadow-sm hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition duration-200 cursor-pointer"
            >
              <option value="" disabled>
                — Choose Object —
              </option>
              {selectedObjects.map((o) => (
                <option key={o} value={o} className="text-gray-700">
                  {o} ({recordCounts[o] ?? "…"} records)
                </option>
              ))}
            </select>
          </div>


          {/* Object Info Summary */}
          <div className="flex items-center gap-6 flex-wrap justify-center md:justify-end">
            <div className="bg-blue-50 rounded-xl px-5 py-3 border border-blue-100 shadow-sm text-center">
              <p className="text-xs uppercase text-gray-500 font-medium">Key Prefix</p>
              <p className="text-base font-semibold text-blue-700">
                {objectDetails.filter((obj) => selectedObjects.includes(obj.name)).find((o) => o.name === selectedObject)?.keyPrefix || "—"}
              </p>
            </div>

            <div className="bg-indigo-50 rounded-xl px-5 py-3 border border-indigo-100 shadow-sm text-center">
              <p className="text-xs uppercase text-gray-500 font-medium">Fields</p>
              <p className="text-base font-semibold text-indigo-700">
                {fieldsData[selectedObject]?.length || 0}
              </p>
            </div>

            <div className="bg-green-50 rounded-xl px-5 py-3 border border-green-100 shadow-sm text-center">
              <p className="text-xs uppercase text-gray-500 font-medium">Records</p>
              <p className="text-base font-semibold text-green-700">
                {recordCounts[selectedObject] || "—"}
              </p>
            </div>
          </div>
        </section>

        {/* 🔹 Tabs */}
        <div className="flex justify-center mb-8 border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-lg font-semibold transition-colors ${activeTab === tab
                ? "border-b-4 border-blue-600 text-blue-700"
                : "text-gray-500 hover:text-blue-600"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 🔹 Tab Content */}
        {activeTab === "Fields" && (
          <FieldsTable
            selectedObject={selectedObject}
            selectedObjects={selectedObjects}
            fieldsData={fieldsData}
            allMetadataKeys={allMetadataKeys}
          />
        )}

        {activeTab === "Validation Rules" && <ValidationRulesTable data={validationRules} />}
        {activeTab === "Triggers" && <TriggersTable data={triggers} />}
        {activeTab === "Apex Classes" && <ApexClassesTable data={apexClasses} />}
        {activeTab === "Workflows" && <WorkflowsTable data={workflows} />}
      </div>
    </div>
  );

}

/* ---------------------------
 ✅ Sub-components for tables
----------------------------*/


export function FieldsTable({ selectedObject, selectedObjects, fieldsData, allMetadataKeys }) {
  const [selectedMetadata, setSelectedMetadata] = useState(["label", "ApiName", "type", "length", "description"]);
  const [typeFilter, setTypeFilter] = useState([]);
  const [exportObjects, setExportObjects] = useState(selectedObjects);

  const fields = fieldsData[selectedObject] || [];

  // 🔍 Get all unique field types dynamically
  const allTypes = useMemo(() => [...new Set(fields.map((f) => f.type).filter(Boolean))], [fields]);

  // 🔄 Filtered fields based on selected types
  const filteredFields = useMemo(() => {
    if (typeFilter.length === 0) return fields;
    return fields.filter((f) => typeFilter.includes(f.type));
  }, [fields, typeFilter]);

  // Toggle for multi-select dropdowns
  const toggleSelection = (value, setState) => {
    setState((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const exportSelectedToCSV = (selectedObjs) => {
    if (selectedObjs.length === 0) {
      alert("Please select at least one object to export.");
      return;
    }

    const rows = [];
    const header = ["Object"];
    header.push(selectedMetadata);
    rows.push(header.join(","));

    selectedObjs.forEach((obj) => {
      const fields = fieldsData[obj];
      if (fields && fields.length > 0) {
        fields.forEach((f) => {
          const row = [obj, f.ApiName || f.name];
          selectedMetadata.forEach((m) => {
            row.push(
              f[m] !== undefined
                ? Array.isArray(f[m])
                  ? `"${f[m].join("; ")}"`
                  : `"${String(f[m]).replace(/"/g, '""')}"`
                : ""
            );
          });
          rows.push(row.join(","));
        });
      }
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "fields_metadata.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Dropdown controls */}
      <div className="flex flex-wrap justify-between items-center gap-6 mb-4">
        {/* Metadata selection dropdown */}
        <div className="relative">
          <details className="group border border-gray-300 rounded-lg px-4 py-2 bg-white cursor-pointer w-64 shadow-sm">
            <summary className="flex justify-between items-center text-gray-700 font-medium select-none">
              Metadata Columns
              <span className="text-gray-500 text-sm">
                ({selectedMetadata.length})
              </span>
            </summary>
            <div className="absolute z-20 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-auto w-full p-2">
              {allMetadataKeys.map((meta) => (
                <label
                  key={meta}
                  className="flex items-center text-gray-700 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedMetadata.includes(meta)}
                    onChange={() => toggleSelection(meta, setSelectedMetadata)}
                    className="mr-2 accent-blue-600"
                  />
                  {meta}
                </label>
              ))}
            </div>
          </details>
        </div>

        {/* Type filter dropdown */}
        <div className="relative">
          <details className="group border border-gray-300 rounded-lg px-4 py-2 bg-white cursor-pointer w-64 shadow-sm">
            <summary className="flex justify-between items-center text-gray-700 font-medium select-none">
              Filter by Field Type
              <span className="text-gray-400 text-sm">
                ({typeFilter.length || "All"})
              </span>
            </summary>
            <div className="absolute z-20 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-auto w-full p-2">
              {allTypes.map((t) => (
                <label
                  key={t}
                  className="flex items-center text-gray-700 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={typeFilter.includes(t)}
                    onChange={() => toggleSelection(t, setTypeFilter)}
                    className="mr-2 accent-blue-600"
                  />
                  {t}
                </label>
              ))}
            </div>
          </details>
        </div>
      </div>

      {/* Table container */}
      <div className="overflow-auto max-h-[70vh] border-0 rounded-xl shadow-lg bg-white scrollbar-hide scrollbar-hover">
                  <table className="min-w-full text-sm border-collapse">
                    <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white sticky top-0 z-20 shadow-md">
            <tr className="bg-gradient-to-r from-blue-500 to-indigo-500 border-t-0">
              <th className="p-4 text-center font-bold text-sm uppercase tracking-wider border-b-0 border-blue-700">
                #
              </th>
              {selectedMetadata.map((meta) => (
                <th
                  key={meta}
                  className="p-4 text-center font-bold text-sm uppercase tracking-wider border-b-0 border-blue-700"
                >
                  {meta.replace(/([A-Z])/g, " $1")}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {filteredFields.map((f, i) => (
              <tr
                key={`${selectedObject}-${i}`}
                className="bg-white hover:bg-blue-50/50 border-l-4 border-transparent hover:border-blue-300"
              >
                <td className="border border-gray-200 p-2 text-gray-600 text-center w-12">
                  {i + 1}
                </td>
                {selectedMetadata.map((meta) => (
                  <td key={meta} className="border border-gray-200 p-2 text-gray-700">
                    {f[meta] === null
                      ? "null"
                      : Array.isArray(f[meta])
                        ? f[meta].join("; ")
                        : f[meta] !== undefined
                          ? String(f[meta])
                          : ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        {/* Multi-select dropdown */}
        <div className="relative" >
          <details className="group border border-gray-300 rounded-lg px-4 py-2 bg-white cursor-pointer w-100 shadow-sm">
            <summary className="flex justify-between items-center text-gray-700 font-medium select-none">
              Select Objects for CSV Export
              <span className="text-gray-500 text-sm ml-2">
                ({exportObjects.length || "All"})
              </span>
            </summary>
            <div className="absolute z-20 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-auto w-full p-2">              {selectedObjects.map((t) => (
              <label
                key={t}
                className="flex items-center text-gray-700 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={exportObjects.includes(t)}
                  onChange={() => toggleSelection(t, setExportObjects)}
                  className="mr-2 accent-blue-600"
                />
                {t}
              </label>
            ))}
            </div>
          </details>
        </div>

        {/* Export button */}
        <button
          onClick={() => exportSelectedToCSV(exportObjects)}
          disabled={exportObjects.length === 0}
          className={`px-6 py-2 rounded-lg font-semibold transition ${exportObjects.length === 0
            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
            }`}
        >
          Export CSV
        </button>
      </div>

    </div>
  );
}


function ValidationRulesTable({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-xl">
        No validation rules found.
      </div>
    );
  }

  // Dynamically get all unique keys from the data array
  const allKeys = Array.from(
    new Set(data.flatMap((item) => Object.keys(item)))
  );

  return (
    <div className="overflow-auto max-h-[75vh] border rounded-xl p-4 shadow-sm bg-white">
      <table className="min-w-full text-sm border-collapse">
        <thead className="bg-green-100 sticky top-0 z-10">
          <tr>
            {allKeys.map((key) => (
              <th
                key={key}
                className="border p-2 text-left font-semibold text-gray-700 capitalize"
              >
                {key.replace(/([A-Z])/g, " $1")} {/* add spacing for camelCase */}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.Id || row.fullName || i}
              className="hover:bg-green-50 transition border-b"
            >
              {allKeys.map((key) => (
                <td key={key} className="border p-2 text-gray-700">
                  {Array.isArray(row[key])
                    ? row[key].join(", ")
                    : typeof row[key] === "object" && row[key] !== null
                      ? JSON.stringify(row[key])
                      : row[key] !== undefined && row[key] !== null
                        ? String(row[key])
                        : "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


function TriggersTable({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-xl">
        No Triggers found.
      </div>
    );
  }

  // Dynamically get all unique keys from the data array
  const allKeys = Array.from(
    new Set(data.flatMap((item) => Object.keys(item)))
  );

  return (
    <div className="overflow-auto max-h-[75vh] border rounded-xl p-4 shadow-sm bg-white">
      <table className="min-w-full text-sm border-collapse">
        <thead className="bg-green-100 sticky top-0 z-10">
          <tr>
            {allKeys.map((key) => (
              <th
                key={key}
                className="border p-2 text-left font-semibold text-gray-700 capitalize"
              >
                {key.replace(/([A-Z])/g, " $1")} {/* add spacing for camelCase */}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.Id || row.fullName || i}
              className="hover:bg-green-50 transition border-b"
            >
              {allKeys.map((key) => (
                <td key={key} className="border p-2 text-gray-700">
                  {Array.isArray(row[key])
                    ? row[key].join(", ")
                    : typeof row[key] === "object" && row[key] !== null
                      ? JSON.stringify(row[key])
                      : row[key] !== undefined && row[key] !== null
                        ? String(row[key])
                        : "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ApexClassesTable({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-xl">
        No Appex Classes found.
      </div>
    );
  }

  // Dynamically get all unique keys from the data array
  const allKeys = Array.from(
    new Set(data.flatMap((item) => Object.keys(item)))
  );

  return (
    <div className="overflow-auto max-h-[75vh] border rounded-xl p-4 shadow-sm bg-white">
      <table className="min-w-full text-sm border-collapse">
        <thead className="bg-green-100 sticky top-0 z-10">
          <tr>
            {allKeys.map((key) => (
              <th
                key={key}
                className="border p-2 text-left font-semibold text-gray-700 capitalize"
              >
                {key.replace(/([A-Z])/g, " $1")} {/* add spacing for camelCase */}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.Id || row.fullName || i}
              className="hover:bg-green-50 transition border-b"
            >
              {allKeys.map((key) => (
                <td key={key} className="border p-2 text-gray-700">
                  {Array.isArray(row[key])
                    ? row[key].join(", ")
                    : typeof row[key] === "object" && row[key] !== null
                      ? JSON.stringify(row[key])
                      : row[key] !== undefined && row[key] !== null
                        ? String(row[key])
                        : "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WorkflowsTable({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-xl">
        No Workflows found.
      </div>
    );
  }

  // Dynamically get all unique keys from the data array
  const allKeys = Array.from(
    new Set(data.flatMap((item) => Object.keys(item)))
  );

  return (
    <div className="overflow-auto max-h-[70vh] border-0 rounded-xl shadow-lg bg-white scrollbar-hide scrollbar-hover">
    <table className="min-w-full text-sm border-collapse">
      <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white sticky top-0 z-20 shadow-md">
          <tr>
            {allKeys.map((key) => (
              <th
                key={key}
                className="border p-2 text-left font-semibold text-gray-700 capitalize"
              >
                {key.replace(/([A-Z])/g, " $1")} {/* add spacing for camelCase */}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.Id || row.fullName || i}
              className="hover:bg-green-50 transition border-b"
            >
              {allKeys.map((key) => (
                <td key={key} className="border p-2 text-gray-700">
                  {Array.isArray(row[key])
                    ? row[key].join(", ")
                    : typeof row[key] === "object" && row[key] !== null
                      ? JSON.stringify(row[key])
                      : row[key] !== undefined && row[key] !== null
                        ? String(row[key])
                        : "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
