'use client';
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import SearchableDropdown from "../components/SearchableDropdown";

export default function MetadataPage() {

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

  // Org State
  const [orgs, setOrgs] = useState([]);
  const [orgLoading, setOrgLoading] = useState(true);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedOrgMeta, setSelectedOrgMeta] = useState(null);
  const [token, setToken] = useState("");
  const [instanceUrl, setInstanceUrl] = useState("");

  // Object State
  const [objects, setObjects] = useState([]); // List of all objects from API
  const [objectsLoading, setObjectsLoading] = useState(false);
  const [selectedObject, setSelectedObject] = useState(""); // Currently selected object name

  // Metadata State
  const [recordCounts, setRecordCounts] = useState({});
  const [fieldsData, setFieldsData] = useState({});
  const [validationRules, setValidationRules] = useState([]);
  const [triggers, setTriggers] = useState([]);
  const [apexClasses, setApexClasses] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // Load Orgs on Mount
  const loadOrgs = useCallback(async () => {
    setOrgLoading(true);
    try {
      const email = sessionStorage.getItem("email");
      if (!email) {
        // If no email, maybe redirect to login or just show empty
        // But let's try to load anyway or handle error
        return;
      }
      const res = await fetch("/api/salesforceLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setOrgs(data.data);
      }
    } catch (error) {
      console.error("Failed to load orgs", error);
      toast.error("Failed to load organizations");
    } finally {
      setOrgLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrgs();
  }, [loadOrgs]);

  // Select Org Logic
  const selectOrg = useCallback((instanceValue) => {
    const org = orgs.find((item) => item.instanceUrl === instanceValue);
    if (!org) return;

    setSelectedOrgId(org.instanceUrl);
    setSelectedOrgMeta(org);
    setToken(org.accessToken);
    setInstanceUrl(org.instanceUrl);

    // Reset object state
    setObjects([]);
    setSelectedObject("");
    setFieldsData({});
    setValidationRules([]);
    setTriggers([]);
    setApexClasses([]);
    setWorkflows([]);
    setRecordCounts({});

    toast.success(`Connected to ${org.orgName || "Salesforce Org"}`);
  }, [orgs]);

  // Auto-select previously used org
  useEffect(() => {
    if (orgs.length > 0 && !selectedOrgId) {
      const savedInstance = sessionStorage.getItem("instanceUrl");
      const initialOrg = orgs.find((org) => org.instanceUrl === savedInstance) || orgs[0];
      if (initialOrg) {
        selectOrg(initialOrg.instanceUrl);
      }
    }
  }, [orgs, selectedOrgId, selectOrg]);

  // Fetch Objects when Org is Selected
  useEffect(() => {
    const fetchObjects = async () => {
      if (!instanceUrl || !token) return;
      setObjectsLoading(true);
      try {
        const res = await fetch("/api/objects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: token, instanceUrl }),
        });
        const data = await res.json();
        if (data.success) {
          setObjects(data.object);
        } else {
          toast.error("Failed to fetch objects");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error fetching objects");
      } finally {
        setObjectsLoading(false);
      }
    };

    fetchObjects();
  }, [instanceUrl, token]);

  // Fetch Metadata when Object is Selected
  useEffect(() => {
    if (!selectedObject || !instanceUrl || !token) return;

    const fetchFields = async () => {
      // If we already have fields for this object, don't re-fetch
      if (fieldsData[selectedObject]) return;

      setLoadingMetadata(true);
      try {
        // Fetch fields
        const fieldsRes = await fetch("/api/fields", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: token, instanceUrl, object: [selectedObject] }),
        });
        const fieldsPayload = await fieldsRes.json();
        if (fieldsPayload.success) {
          setFieldsData(prev => ({ ...prev, ...fieldsPayload.data }));
        }

        // Fetch record count
        const countRes = await fetch("/api/getRecordCount", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: token, instanceUrl, objectName: selectedObject }),
        });
        const countData = await countRes.json();
        setRecordCounts(prev => ({
          ...prev,
          [selectedObject]: countData.success ? countData.count : "N/A"
        }));

      } catch (err) {
        console.error(err);
        toast.error("Error fetching metadata");
      } finally {
        setLoadingMetadata(false);
      }
    };

    fetchFields();

    // Clear other tabs data when object changes
    setValidationRules([]);
    setTriggers([]);
    setApexClasses([]);
    setWorkflows([]);
    setActiveTab("Fields");

  }, [selectedObject, instanceUrl, token]);

  // Fetch other metadata types on tab switch
  const fetchMetadataByType = async (type) => {
    if (!token || !instanceUrl || !selectedObject) return;

    // Check if already loaded
    if (type === "validationRules" && validationRules.length > 0) return;
    if (type === "triggers" && triggers.length > 0) return;
    if (type === "apexClasses" && apexClasses.length > 0) return;
    if (type === "workflows" && workflows.length > 0) return;

    try {
      const res = await fetch(`/api/objectMetadata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: token, instanceUrl, selectedObject, type }),
      });
      const data = await res.json();
      if (data.success) {
        switch (type) {
          case "validationRules": setValidationRules(data.data); break;
          case "triggers": setTriggers(data.data); break;
          case "apexClasses": setApexClasses(data.data); break;
          case "workflows": setWorkflows(data.data); break;
        }
      }
    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
    }
  };

  useEffect(() => {
    if (activeTab === "Validation Rules") fetchMetadataByType("validationRules");
    else if (activeTab === "Triggers") fetchMetadataByType("triggers");
    else if (activeTab === "Apex Classes") fetchMetadataByType("apexClasses");
    else if (activeTab === "Workflows") fetchMetadataByType("workflows");
  }, [activeTab, selectedObject]);


  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 flex flex-col items-center p-8">
      <div className="w-full max-w-[98%] bg-white shadow-2xl rounded-3xl p-10 border border-gray-200 min-h-[90vh] overflow-visible">

        {/* 🌈 HEADER SECTION */}
        <header className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-6 px-10 rounded-3xl shadow-lg mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-1">
                Salesforce Metadata Explorer
              </h1>
              <p className="text-blue-100 text-sm">
                Analyze objects, fields, and automation in your Salesforce org.
              </p>
            </div>

            {/* Org Selector */}
            <div className="flex flex-col items-end gap-3">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-50 transition duration-500"></div>
                <div className="relative flex items-center bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-1 shadow-lg">
                  <div className="hidden sm:block px-3 text-xs font-bold text-blue-100 uppercase tracking-wider select-none">
                    Active Org
                  </div>
                  <div className="hidden sm:block h-6 w-px bg-white/20 mx-1"></div>
                  <div className="relative">
                    <select
                      className="bg-transparent text-white text-sm font-semibold focus:outline-none cursor-pointer py-2 pl-3 pr-10 appearance-none min-w-[220px] hover:text-blue-50 transition-colors"
                      value={selectedOrgId || ""}
                      onChange={(event) => selectOrg(event.target.value)}
                      disabled={orgLoading || !orgs.length}
                    >
                      <option value="" disabled className="text-gray-500 bg-white">
                        {orgLoading ? "Loading..." : "Select Organization"}
                      </option>
                      {orgs.map((org) => (
                        <option key={org.instanceUrl} value={org.instanceUrl} className="text-gray-900 bg-white py-2">
                          {org.orgName && org.orgName !== "None" ? org.orgName : "Salesforce Org"}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/80">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {selectedOrgMeta?.instanceUrl && (
                <div className="flex items-center gap-2 text-xs text-blue-50 bg-black/20 px-3 py-1.5 rounded-full border border-white/10 shadow-sm backdrop-blur-sm transition-all hover:bg-black/30">
                  <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]"></div>
                  <span className="font-mono tracking-tight opacity-90">
                    {selectedOrgMeta.instanceUrl.replace("https://", "").replace(".my.salesforce.com", "")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 🧩 OBJECT SELECTION + INFO SECTION */}
        <section className="w-full bg-white border border-gray-200 rounded-2xl shadow-md px-8 py-6 mb-8 flex flex-col md:flex-row justify-between items-center">
          {/* Dropdown */}
          <div className="flex flex-col items-start gap-2 w-full max-w-md">
            <SearchableDropdown
              label="Select Object"
              options={objects.map((o) => ({ label: `${o.label} (${o.name})`, value: o.name }))}
              value={selectedObject}
              onChange={setSelectedObject}
              placeholder={objectsLoading ? "Loading Objects..." : "— Choose Object —"}
              disabled={!selectedOrgId || objectsLoading}
            />
          </div>


          {/* Object Info Summary */}
          {selectedObject && (
            <div className="flex items-center gap-6 flex-wrap justify-center md:justify-end mt-4 md:mt-0">
              <div className="bg-blue-50 rounded-xl px-5 py-3 border border-blue-100 shadow-sm text-center">
                <p className="text-xs uppercase text-gray-500 font-medium">Key Prefix</p>
                <p className="text-base font-semibold text-blue-700">
                  {objects.find((o) => o.name === selectedObject)?.keyPrefix || "—"}
                </p>
              </div>

              <div className="bg-indigo-50 rounded-xl px-5 py-3 border border-indigo-100 shadow-sm text-center">
                <p className="text-xs uppercase text-gray-500 font-medium">Fields</p>
                <p className="text-base font-semibold text-indigo-700">
                  {fieldsData[selectedObject]?.length || (loadingMetadata ? "..." : 0)}
                </p>
              </div>

              <div className="bg-green-50 rounded-xl px-5 py-3 border border-green-100 shadow-sm text-center">
                <p className="text-xs uppercase text-gray-500 font-medium">Records</p>
                <p className="text-base font-semibold text-green-700">
                  {recordCounts[selectedObject] || (loadingMetadata ? "..." : "—")}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* 🔹 Tabs */}
        {selectedObject && (
          <>
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
                selectedObjects={[selectedObject]} // Pass as array for compatibility
                fieldsData={fieldsData}
                allMetadataKeys={allMetadataKeys}
                objects={objects}
              />
            )}

            {activeTab === "Validation Rules" && <ValidationRulesTable data={validationRules} />}
            {activeTab === "Triggers" && <TriggersTable data={triggers} />}
            {activeTab === "Apex Classes" && <ApexClassesTable data={apexClasses} />}
            {activeTab === "Workflows" && <WorkflowsTable data={workflows} />}
          </>
        )}

        {!selectedObject && !objectsLoading && selectedOrgId && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-xl">Select an object to view metadata</p>
          </div>
        )}
      </div>
    </div>
  );
}


/* ---------------------------
 ✅ Sub-components for tables
----------------------------*/


export function FieldsTable({ selectedObject, selectedObjects, fieldsData, allMetadataKeys, objects }) {
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
        <div className="w-64">
          <SearchableDropdown
            label="Metadata Columns"
            options={allMetadataKeys.map((k) => ({ label: k, value: k }))}
            value={selectedMetadata}
            onChange={setSelectedMetadata}
            multiple={true}
            placeholder="Select columns..."
          />
        </div>


        {/* Type filter dropdown */}
        <div className="w-64">
          <SearchableDropdown
            label="Filter by Field Type"
            options={allTypes.map((t) => ({ label: t, value: t }))}
            value={typeFilter}
            onChange={setTypeFilter}
            multiple={true}
            placeholder="Select types..."
          />
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
        <div className="w-full max-w-md">
          <SearchableDropdown
            label="Select Objects for CSV Export"
            options={objects.map((o) => ({ label: o.label, value: o.name }))}
            value={exportObjects}
            onChange={setExportObjects}
            multiple={true}
            placeholder="Select objects..."
          />
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
