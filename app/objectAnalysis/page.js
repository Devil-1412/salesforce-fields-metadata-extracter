'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import OrgHeader from "@components/OrgHeader";
import FilterBar from "@components/FilterBar";
import VirtualTable from "@components/VirtualTable";
import EmptyState from "@components/EmptyState";

const FILTER_OPTIONS = [
  { key: "all", label: "All objects" },
  { key: "custom", label: "Custom objects" },
  { key: "standard", label: "Standard objects" },
];

const formatLargeNumber = (value) => {
  if (typeof value !== "number") return value ?? "-";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
};

export default function ObjectAnalysisPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState([]);
  const [orgLoading, setOrgLoading] = useState(true);
  const [orgError, setOrgError] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedOrgMeta, setSelectedOrgMeta] = useState(null);
  const [instanceUrl, setInstanceUrl] = useState("");
  const [token, setToken] = useState(""); // Salesforce Access Token
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [counts, setCounts] = useState({});
  const [countLoadingFor, setCountLoadingFor] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedObject, setSelectedObject] = useState(null);

  const loadOrgs = useCallback(async () => {
    setOrgLoading(true);
    setOrgError("");
    try {
      const res = await fetch("/api/listAllOrgs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      const data = await res.json();
      if (!data.success || !Array.isArray(data.organizations)) {
        throw new Error(data.error || "Could not fetch organizations.");
      }
      setOrgs(data.organizations);
    } catch (error) {
      const message = error?.message || "Unable to load organizations.";
      setOrgError(message);
      toast.error(message);
    } finally {
      setOrgLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrgs();
  }, [loadOrgs]);

  const selectOrg = useCallback(
    async (instanceValue, { silent = false } = {}) => {
      if (!instanceValue) return;
      const org = orgs.find((item) => item.instance_url === instanceValue || item.instanceUrl === instanceValue);
      if (!org) return;

      const targetInstanceUrl = org.instance_url || org.instanceUrl;

      // Login to get access token if not silent (or even if silent, we might need to refresh)
      const toastId = !silent ? toast.loading(`Logging in to ${org.org_name || "Salesforce"}...`) : null;

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
            setCounts({});
            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("instanceUrl", targetInstanceUrl);
            
            if (!silent && toastId) {
                toast.success(
                `Loaded ${data.orgName && data.orgName !== "None" ? data.orgName : "Salesforce organization"
                }`, { id: toastId }
                );
            }
        } else {
             if (toastId) toast.error(data.error || "Login failed", { id: toastId });
        }
      } catch (err) {
        console.error("Login failed", err);
        if (toastId) toast.error("Login failed", { id: toastId });
      }
    },
    [orgs]
  );

  useEffect(() => {
    // Automatic selection disabled by user request
    /*
    if (!orgs.length) return;
    const savedInstance = localStorage.getItem("instanceUrl");
    const initialOrg =
      orgs.find((org) => org.instanceUrl === savedInstance) || orgs[0];
    if (initialOrg) {
        selectOrg(initialOrg.instanceUrl || initialOrg.instance_url, { silent: true });
    }
    */
  }, [orgs, selectOrg]);

  const loadObjects = useCallback(
    async ({ showToast = false } = {}) => {
      if (!instanceUrl || !token) {
        setObjects([]);
        return;
      }
      setLoading(true);
      setFetchError("");
      try {
        const res = await fetch("/api/objects", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ accessToken: token, instanceUrl }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Could not load objects.");
        }
        setObjects(Array.isArray(data.object) ? data.object : []);
        if (showToast) {
          toast.success("Object list refreshed");
        }
      } catch (error) {
        const message = error?.message || "Unable to load objects.";
        setFetchError(message);
        setObjects([]);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [instanceUrl, token]
  );

  useEffect(() => {
    if (instanceUrl && token) {
      loadObjects();
    }
  }, [instanceUrl, token, loadObjects]);

  const filteredObjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return objects.filter((object) => {
      const label = (object.label || "").toLowerCase();
      const name = (object.name || "").toLowerCase();
      const matchesSearch =
        !query || label.includes(query) || name.includes(query);
      const matchesFilter =
        filter === "all"
          ? true
          : filter === "custom"
            ? object.custom
            : !object.custom;
      return matchesSearch && matchesFilter;
    });
  }, [objects, search, filter]);

  const stats = useMemo(() => {
    const total = objects.length;
    const custom = objects.filter((object) => object.custom).length;
    const standard = total - custom;
    return {
      total,
      custom,
      standard
    };
  }, [objects]);


  const fetchRecordCount = useCallback(
    async (objectName) => {
      if (!instanceUrl || !token) {
        toast.error("Select an organization before fetching record counts.");
        return;
      }
      setCountLoadingFor(objectName);
      try {
        const res = await fetch("/api/getRecordCount", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ instanceUrl, accessToken: token, objectName }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to fetch record count.");
        }
        const value = typeof data.count === "number" ? data.count : data.count ?? 0;
        setCounts((prev) => ({ ...prev, [objectName]: value }));
      } catch (error) {
        const message = error?.message || "Unable to fetch record count.";
        toast.error(message);
        setCounts((prev) => ({ ...prev, [objectName]: "Error" }));
      } finally {
        setCountLoadingFor("");
      }
    },
    [instanceUrl, token]
  );

  const [detailsLoading, setDetailsLoading] = useState(false);

  const handleObjectClick = async (object) => {
    if (!instanceUrl || !token) return;

    const toastId = toast.loading(`Fetching details for ${object.label}...`);

    try {
      const res = await fetch("/api/getObjectDetails", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
          accessToken: token,
          instanceUrl,
          objectName: object.name
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSelectedObject({ ...object, ...data.data });
        toast.success("Details loaded", { id: toastId });
      } else {
        throw new Error(data.error || "Failed to fetch details");
      }
    } catch (err) {
      console.error(err);
      toast.error(`Error: ${err.message}`, { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-3 sm:px-3">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <OrgHeader
          title="Salesforce Object Analysis"
          description="Browse your Salesforce sObjects, understand their origin, and quickly extract metadata for analysis."
          orgs={orgs}
          selectedOrgId={selectedOrgId}
          onSelectOrg={selectOrg}
          orgLoading={orgLoading}
          selectedOrgMeta={selectedOrgMeta}
        />

        {orgError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {orgError}{" "}
            {!orgLoading && !orgs.length && (
              <button
                onClick={() => router.push("/profile")}
                className="underline"
              >
                Add one in your profile
              </button>
            )}
          </div>
        )}

        <section className="grid gap-4 rounded-3xl bg-white p-6 shadow-xl">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Total objects</p>
              <p className="text-2xl font-semibold text-slate-900">
                {stats.total.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Custom objects</p>
              <p className="text-2xl font-semibold text-slate-900">
                {stats.custom.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Standard objects</p>
              <p className="text-2xl font-semibold text-slate-900">
                {stats.standard.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => loadObjects({ showToast: true })}
                disabled={!selectedOrgId || loading}
                className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Refreshing..." : "Refresh objects"}
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-xl">
          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by API name or label"
          >
            <div className="flex flex-wrap gap-2">
              {FILTER_OPTIONS.map((option) => {
                const active = filter === option.key;
                return (
                  <button
                    key={option.key}
                    onClick={() => setFilter(option.key)}
                    className={`rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${active
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow"
                      : "border border-slate-200 text-slate-600 hover:border-slate-400"
                      }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {/* FilterBar children endpoint */}
          </FilterBar>

          {fetchError && (
            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {fetchError}
            </div>
          )}

          {loading ? (
             <div className="flex h-60 items-center justify-center text-sm text-slate-500">
                Loading objects…
              </div>
          ) : filteredObjects.length > 0 ? (
            <VirtualTable
              data={filteredObjects}
              columns={[
                 { 
                    key: 'index', 
                    label: '#', 
                    width: '5%',
                    render: (_, i) => i + 1
                 },
                 { 
                    key: 'label', 
                    label: 'Label', 
                    width: '20%',
                    render: (object) => (
                        <button
                          onClick={() => handleObjectClick(object)}
                          className="hover:text-blue-600 hover:underline text-left font-medium"
                        >
                          {object.label || object.name}
                        </button>
                    )
                 },
                 { key: 'name', label: 'API Name', width: '20%' },
                 { 
                    key: 'custom', 
                    label: 'Type', 
                    width: '10%',
                    render: (object) => object.custom ? "Custom" : "Standard"
                 },
                 { 
                    key: 'createdDate', 
                    label: 'Created', 
                    width: '15%',
                    render: (object) => object.createdDate ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-900">
                              {new Date(object.createdDate).toLocaleDateString() == "1/1/1970" ? "—" : new Date(object.createdDate).toLocaleDateString()}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {object.createdByName || "Unknown"}
                            </span>
                          </div>
                        ) : <span className="text-gray-700">—</span>
                 },
                 { 
                    key: 'lastModifiedDate', 
                    label: 'Last Modified', 
                    width: '15%',
                    render: (object) => object.lastModifiedDate ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-900">
                              {new Date(object.lastModifiedDate).toLocaleDateString() == "1/1/1970" ? "—" : new Date(object.lastModifiedDate).toLocaleDateString()}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {object.lastModifiedByName || "Unknown"}
                            </span>
                          </div>
                        ) : <span className="text-gray-400">—</span>
                 },
                 { key: 'keyPrefix', label: 'Prefix', width: '10%' },
                 { 
                    key: 'records', 
                    label: 'Records', 
                    width: '10%',
                    render: (object) => (
                        <button
                          onClick={(e) => {
                              e.stopPropagation();
                              fetchRecordCount(object.name);
                          }}
                          disabled={countLoadingFor === object.name}
                          className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {countLoadingFor === object.name
                            ? "Fetching…"
                            : counts[object.name] !== undefined
                              ? formatLargeNumber(counts[object.name])
                              : "Get count"}
                        </button>
                    )
                 }
              ]}
            />
          ) : (
            <EmptyState 
                title="No objects found"
                description="Try adjusting your search or filter."
            />
          )}
        </section>
      </div> 

      {/* Object Details Modal */}
      {
        selectedObject && (
          <ObjectDetailsModal
            object={selectedObject}
            onClose={() => setSelectedObject(null)}
          />
        )
      }
    </div >
  );
}

function ObjectDetailsModal({ object, onClose }) {
  // Helper to format boolean flags
  const BooleanFlag = ({ label, value }) => (
    <div className={`flex items-center justify-between p-3 rounded-xl border ${value ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {value ? (
        <span className="text-green-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </span>
      ) : (
        <span className="text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </span>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gradient-to-r from-gray-50 to-white">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-gray-900">{object.label}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${object.custom ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                {object.custom ? 'Custom Object' : 'Standard Object'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{object.name}</span>
              <span>•</span>
              <span>Key Prefix: <span className="font-mono text-gray-700">{object.keyPrefix || 'N/A'}</span></span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-8">

          {/* Flags Grid */}
          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Object Capabilities</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <BooleanFlag label="Createable" value={object.createable} />
              <BooleanFlag label="Deletable" value={object.deletable} />
              <BooleanFlag label="Updateable" value={object.updateable} />
              <BooleanFlag label="Queryable" value={object.queryable} />
              <BooleanFlag label="Searchable" value={object.searchable} />
              <BooleanFlag label="Triggerable" value={object.triggerable} />
              <BooleanFlag label="Replicateable" value={object.replicateable} />
              <BooleanFlag label="Retrieveable" value={object.retrieveable} />
              <BooleanFlag label="Layoutable" value={object.layoutable} />
              <BooleanFlag label="Feed Enabled" value={object.feedEnabled} />
              <BooleanFlag label="Compact Layout" value={object.compactLayoutable} />
              <BooleanFlag label="Mergeable" value={object.mergeable} />
            </div>
          </section>

          {/* URLs */}
          {object.urls && (
            <section>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">API Resources</h3>
              <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-1 divide-y divide-gray-200">
                  {Object.entries(object.urls).map(([key, url]) => (
                    <div key={key} className="flex flex-col md:flex-row md:items-center p-3 hover:bg-gray-100 transition-colors">
                      <span className="w-40 text-sm font-semibold text-gray-600 capitalize mb-1 md:mb-0">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <code className="text-xs text-blue-600 font-mono break-all">{url}</code>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Record Types */}
          {object.recordTypeInfos && object.recordTypeInfos.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Record Types</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {object.recordTypeInfos.map((rt) => (
                  <div key={rt.recordTypeId} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-800">{rt.name}</h4>
                      {rt.master && <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">Master</span>}
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex justify-between">
                        <span>Available:</span>
                        <span className={rt.available ? "text-green-600" : "text-red-600"}>{rt.available ? "Yes" : "No"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Default:</span>
                        <span className={rt.defaultRecordTypeMapping ? "text-green-600" : "text-gray-500"}>{rt.defaultRecordTypeMapping ? "Yes" : "No"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ID:</span>
                        <span className="font-mono">{rt.recordTypeId}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Supported Scopes */}
          {object.supportedScopes && object.supportedScopes.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Supported Scopes</h3>
              <div className="flex flex-wrap gap-2">
                {object.supportedScopes.map((scope) => (
                  <div key={scope.name} className="bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg px-3 py-1.5 text-sm">
                    <span className="font-semibold">{scope.label}</span>
                    <span className="text-indigo-400 mx-1">|</span>
                    <span className="font-mono text-xs">{scope.name}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Child Relationships */}
          {object.childRelationships && object.childRelationships.length > 0 && (
            <section className="flex flex-col h-[500px]"> 
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Child Relationships</h3>
                <VirtualTable
                  data={object.childRelationships}
                  columns={[
                    { label: "Child Object", key: "childSObject", width: "25%" },
                    { label: "Field", key: "field", width: "25%" },
                    { label: "Relationship Name", key: "relationshipName", width: "25%", render: (item) => item.relationshipName || '-' },
                    { 
                      label: "Cascade Delete", 
                      key: "cascadeDelete", 
                      width: "25%",
                      render: (item) => (
                        item.cascadeDelete ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Yes</span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">No</span>
                        )
                      )
                    }
                  ]}
                  rowClassName="hover:bg-gray-50"
                  itemSize={50}
                  className="flex-1 min-h-0 h-auto"
                />
            </section>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
