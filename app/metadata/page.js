'use client';
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import SearchableDropdown from "@components/SearchableDropdown";
import OrgHeader from "@components/OrgHeader";
import VirtualTable from "@components/VirtualTable";
import EmptyState from "@components/EmptyState";
import FilterBar from "@components/FilterBar";
import FieldDetailsPanel from "../components/FieldDetailsPanel";
import FieldAnalysisTable from "../components/FieldAnalysisTable";

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

  const TABS = ["Fields", "Field Analysis", "Validation Rules", "Triggers", "Apex Classes", "Workflows"];
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
  // Supabase Auth Token - REMOVED for cookie auth
  // const [sessionToken, setSessionToken] = useState("");

  // Session check handled by middleware/cookies/backend
  /*
  useEffect(() => {
    const getSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            setSessionToken(session.access_token);
        }
    };
    getSession();
  }, []);
  */
  // Load Orgs on Mount
  const loadOrgs = useCallback(async () => {
    setOrgLoading(true);
    try {
      const res = await fetch("/api/listAllOrgs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.organizations)) {
        setOrgs(data.organizations);
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
  const selectOrg = useCallback(async (instanceValue) => {
    const org = orgs.find((item) => item.instance_url === instanceValue || item.instanceUrl === instanceValue);
    if (!org) return;

    const targetInstanceUrl = org.instance_url || org.instanceUrl;

    // Login to get access token
    const toastId = toast.loading(`Logging in to ${org.org_name || "Salesforce"}...`);
    try {
        const res = await fetch("/api/salesforceLogin", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ instanceUrl: targetInstanceUrl }),
        });
        const data = await res.json();

        if (data.success) {
            setSelectedOrgId(targetInstanceUrl);
            setSelectedOrgMeta({ ...org, accessToken: data.accessToken, instanceUrl: targetInstanceUrl });
            setToken(data.accessToken);
            setInstanceUrl(targetInstanceUrl);

            // Reset object state
            setObjects([]);
            setSelectedObject("");
            setFieldsData({});
            setValidationRules([]);
            setTriggers([]);
            setApexClasses([]);
            setWorkflows([]);
            setRecordCounts({});

            toast.success(`Connected to ${data.orgName || "Salesforce Org"}`, { id: toastId });
        } else {
             toast.error(data.error || "Login failed", { id: toastId });
        }
    } catch (err) {
        console.error("Login Error:", err);
        toast.error("Login failed", { id: toastId });
    }
  }, [orgs]);

  // Auto-select previously used org
  useEffect(() => {
    if (orgs.length > 0 && !selectedOrgId) {
      // Disabled auto-select as per user request history
      // const savedInstance = localStorage.getItem("instanceUrl");
      // const initialOrg = orgs.find((org) => org.instanceUrl === savedInstance) || orgs[0];
      // if (initialOrg) {
      //   selectOrg(initialOrg.instanceUrl);
      // }
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
          headers: { 
            "Content-Type": "application/json"
          },
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
          headers: { 
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ accessToken: token, instanceUrl, objects: [selectedObject] }),
        });
        const fieldsPayload = await fieldsRes.json();
        if (fieldsPayload.success) {
          setFieldsData(prev => ({ ...prev, ...fieldsPayload.data }));
        }

        // Fetch record count
        const countRes = await fetch("/api/getRecordCount", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json"
          },
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
        headers: { 
          "Content-Type": "application/json"
        },
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
        <div className="mb-8">
          <OrgHeader
            title="Salesforce Metadata Explorer"
            description="Analyze objects, fields, and automation in your Salesforce org."
            orgs={orgs}
            selectedOrgId={selectedOrgId}
            onSelectOrg={selectOrg}
            orgLoading={orgLoading}
            selectedOrgMeta={selectedOrgMeta}
          />
        </div>

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
            <div className="h-[600px] flex flex-col w-full">
                {activeTab === "Fields" && (
                <FieldsTable
                    selectedObject={selectedObject}
                    selectedObjects={[selectedObject]} // Pass as array for compatibility
                    fieldsData={fieldsData}
                    allMetadataKeys={allMetadataKeys}
                    objects={objects}
                    token={token}
                    instanceUrl={instanceUrl}
                />
                )}

                {activeTab === "Field Analysis" && (
                    <FieldAnalysisTable 
                        fields={fieldsData[selectedObject] || []}
                        objectName={selectedObject}
                        token={token}
                        instanceUrl={instanceUrl}
                    />
                )}

                {activeTab === "Validation Rules" && (
                    <ValidationRulesTable data={validationRules} />
                )}
                
                {activeTab === "Triggers" && (
                    <TriggersTable data={triggers} />
                )}

                {activeTab === "Apex Classes" && (
                    <ApexClassesTable data={apexClasses} />
                )}

                {activeTab === "Workflows" && (
                     <WorkflowsTable data={workflows} />
                )}
            </div>
          </>
        )}

        {!selectedObject && !objectsLoading && (
           <div className="mt-10">
               <EmptyState 
                 title="No Object Selected"
                 description="Select an object from the dropdown above to view its metadata, fields, and rules."
                 icon="box"
               />
           </div>
        )}
      </div>
    </div>
  );
}


/* ---------------------------
 ✅ Sub-components
----------------------------*/

export function FieldsTable({ selectedObject, selectedObjects, fieldsData, allMetadataKeys, objects, token, instanceUrl }) {
  const [selectedMetadata, setSelectedMetadata] = useState(["label", "ApiName", "type", "length", "description"]);
  const [typeFilter, setTypeFilter] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [selectedField, setSelectedField] = useState(null);
  const fields = fieldsData[selectedObject] || [];

  useEffect(() => {
    setSelectedField(null);
  }, [selectedObject]);

  // 🔍 Get all unique field types dynamically
  const allTypes = useMemo(() => [...new Set(fields.map((f) => f.type).filter(Boolean))], [fields]);

  // 🔄 Filtered fields based on selected types and search term
  const filteredFields = useMemo(() => {
    let result = fields;

    // Filter by type
    if (typeFilter.length > 0) {
      result = result.filter((f) => typeFilter.includes(f.type));
    }

    // Filter by search term
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(f => 
        (f.label && f.label.toLowerCase().includes(lowerTerm)) ||
        (f.ApiName && f.ApiName.toLowerCase().includes(lowerTerm)) || 
        (f.name && f.name.toLowerCase().includes(lowerTerm))
      );
    }

    return result;
  }, [fields, typeFilter, searchTerm]);

  // Construct columns for VirtualTable based on selectedMetadata
  const columns = useMemo(() => {
    const widthPercentage = selectedMetadata.length > 0 ? (100 / selectedMetadata.length) : 0;
    const cols = selectedMetadata.map(key => ({
        label: key,
        key: key,
        width: `${widthPercentage}%`, 
        render: (item) => {
            const val = item[key];
            
            if (key === 'label') {
                return (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedField(item);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium hover:underline text-left block w-full truncate"
                    >
                        {val || "—"}
                    </button>
                );
            }

            if (val === undefined || val === null || val === "") return "—";
            if (Array.isArray(val)) return val.join(", ");
            return String(val);
        }
    }));
    return cols;
  }, [selectedMetadata]);

  const exportSelectedToCSV = (selectedObjs) => {
    if (selectedObjs.length === 0) {
      alert("Please select at least one object to export.");
      return;
    }

    const rows = [];
    const header = ["Object"];
    header.push(...selectedMetadata); // Use spread to add individual metadata keys
    rows.push(header.map(h => `"${String(h).replace(/"/g, '""')}"`).join(",")); // Quote all headers

    selectedObjs.forEach((obj) => {
      const fields = fieldsData[obj];
      if (fields && fields.length > 0) {
        fields.forEach((f) => {
          const row = [obj];
          selectedMetadata.forEach((m) => {
            const value = f[m];
            let formattedValue = "";
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    formattedValue = value.join("; ");
                } else {
                    formattedValue = String(value);
                }
            }
            row.push(`"${formattedValue.replace(/"/g, '""')}"`); // Quote and escape values
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
    <>
    <div className="flex flex-col gap-4 h-full">
      {/* Search and Filters */}
      <FilterBar 
        searchValue={searchTerm} 
        onSearchChange={setSearchTerm} 
        searchPlaceholder="Search fields..."
      >
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
      </FilterBar>

      <div className="flex-1 min-h-0">
          <VirtualTable 
            data={filteredFields}
            columns={columns}
            itemSize={50}
            emptyMessage="No fields found matching your criteria."
          />
      </div>
    </div>
    
    {/* Field Details Panel */}
    {selectedField && (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/20 z-50 backdrop-blur-sm transition-opacity"
                onClick={() => setSelectedField(null)}
            />
            <FieldDetailsPanel 
                field={selectedField}
                onClose={() => setSelectedField(null)}
                instanceUrl={instanceUrl}
                token={token}
                objectName={selectedObject}
            />
        </>
    )}
    </>
  );
}

export function ValidationRulesTable({ data }) {
  if (!data || data.length === 0) return <div className="text-center py-10 text-gray-500">No Validation Rules found.</div>;
  return (
    <VirtualTable 
        data={data}
        columns={[
            { label: "Name", key: "fullName", width: "25%" },
            { label: "Active", key: "active", width: "10%", render: (item) => item.active ? "✅" : "❌" },
            { label: "Description", key: "description", width: "30%", render: (item) => item.description || "—" },
            { label: "Error Message", key: "errorMessage", width: "35%", className: "text-red-600" }
        ]}
        emptyMessage="No Validation Rules found."
    />
  );
}

export function TriggersTable({ data }) {
  if (!data || data.length === 0) return <div className="text-center py-10 text-gray-500">No Triggers found.</div>;
  return (
    <VirtualTable 
        data={data}
        columns={[
            { label: "Name", key: "Name", width: "40%" },
            { label: "Status", key: "Status", width: "20%" },
            { label: "Usage", key: "Usage", width: "40%", 
              render: (item) => {
                const usageParts = [];
                if (item.UsageBeforeDelete) usageParts.push("Before Delete");
                if (item.UsageAfterInsert) usageParts.push("After Insert");
                // Add other usage types as needed
                return usageParts.length > 0 ? usageParts.join(", ") : "—";
              }
            }
        ]}
        emptyMessage="No Triggers found."
    />
  );
}

export function ApexClassesTable({ data }) {
  if (!data || data.length === 0) return <div className="text-center py-10 text-gray-500">No Apex Classes found.</div>;
  return (
    <VirtualTable 
        data={data}
        columns={[
            { label: "Name", key: "Name", width: "40%" },
            { label: "API Version", key: "ApiVersion", width: "20%" },
            { label: "Status", key: "Status", width: "40%" }
        ]}
        emptyMessage="No Apex Classes found."
    />
  );
}

export function WorkflowsTable({ data }) {
  if (!data || data.length === 0) return <div className="text-center py-10 text-gray-500">No Workflows found.</div>;
  return (
    <VirtualTable 
        data={data}
        columns={[
            { label: "Name", key: "fullName", width: "40%" },
            { label: "Trigger Type", key: "triggerType", width: "30%" },
            { label: "Actions", key: "actions", width: "30%", render: (item) => `${item.actions?.length || 0} Actions` }
        ]}
        emptyMessage="No Workflows found."
    />
  );
}

