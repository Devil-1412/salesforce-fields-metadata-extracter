'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

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
  const [token, setToken] = useState("");
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [counts, setCounts] = useState({});
  const [countLoadingFor, setCountLoadingFor] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedObject, setSelectedObject] = useState(null);
  const [sessionToken, setSessionToken] = useState("");
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setSessionToken(token);
    }
  }, []);

  const loadOrgs = useCallback(async () => {
    setOrgLoading(true);
    setOrgError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please sign in again to load your organizations.");
      const res = await fetch("/api/salesforceLogin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!data.success || !Array.isArray(data.data)) {
        throw new Error(data.error || "Could not fetch organizations.");
      }
      setOrgs(data.data);
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
    (instanceValue, { silent = false } = {}) => {
      if (!instanceValue) return;
      const org = orgs.find((item) => item.instanceUrl === instanceValue);
      if (!org) return;
      setSelectedOrgId(org.instanceUrl);
      setSelectedOrgMeta(org);
      setToken(org.accessToken);
      setInstanceUrl(org.instanceUrl);
      setCounts({});
      localStorage.setItem("accessToken", org.accessToken);
      localStorage.setItem("instanceUrl", org.instanceUrl);
      if (!silent) {
        toast.success(
          `Loaded ${org.orgName && org.orgName !== "None" ? org.orgName : "Salesforce organization"
          }`
        );
      }
    },
    [orgs]
  );

  useEffect(() => {
    if (!orgs.length) return;
    const savedInstance = localStorage.getItem("instanceUrl");
    const initialOrg =
      orgs.find((org) => org.instanceUrl === savedInstance) || orgs[0];
    selectOrg(initialOrg.instanceUrl, { silent: true });
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
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sessionToken}`
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
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sessionToken}`
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
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sessionToken}`
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
        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Salesforce Object Analysis
              </h1>
              <p className="mt-1 max-w-xl text-slate-100">
                Browse your Salesforce sObjects, understand their origin, and
                quickly extract metadata for analysis.
              </p>
            </div>
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
        </section>

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
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by API name or label"
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 md:max-w-md"
            />
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
          </div>

          {fetchError && (
            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {fetchError}
            </div>
          )}

          <div className="overflow-auto max-h-[70vh] border-0 rounded-xl shadow-lg bg-white scrollbar-hide scrollbar-hover">
            {loading ? (
              <div className="flex h-60 items-center justify-center text-sm text-slate-500">
                Loading objects…
              </div>
            ) : filteredObjects.length ? (
              <table className="min-w-full text-sm border-collapse">
                <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white sticky top-0 z-20 shadow-md h-fixed">
                  <tr className="bg-gradient-to-r from-blue-500 to-indigo-500 border-t-0">
                    <th className="p-3 text-center font-bold text-sm uppercase tracking-wider border-b-0 border-blue-700">
                      #
                    </th>
                    <th className="p-3 text-center font-bold text-sm uppercase tracking-wider border-b-0 border-blue-700">Label</th>
                    <th className="p-3 text-center font-bold text-sm uppercase tracking-wider border-b-0 border-blue-700">API Name</th>
                    <th className="p-3 text-center font-bold text-sm uppercase tracking-wider border-b-0 border-blue-700">Type</th>
                    <th className="p-3 text-center font-bold text-sm uppercase tracking-wider border-b-0 border-blue-700">Created</th>
                    <th className="p-3 text-center font-bold text-sm uppercase tracking-wider border-b-0 border-blue-700">Last Modified</th>
                    <th className="p-3 text-center font-bold text-sm uppercase tracking-wider border-b-0 border-blue-700">ID Prefix</th>
                    <th className="p-3 text-center font-bold text-sm uppercase tracking-wider border-b-0 border-blue-700 text-right">Records</th>
                  </tr>
                </thead>
                <tbody className="border-t-1 border-gray-200">
                  {filteredObjects.map((object, index) => (
                    <tr
                      key={object.name}
                      className={
                        index % 2 === 0 ? "bg-white border-l-4 border-transparent hover:border-blue-300" : "bg-slate-50 border-l-4 border-transparent hover:border-blue-300"
                      }
                    >
                      <td className="p-4 text-center text-gray-700">
                        {index + 1}
                      </td>
                      <td className="p-4 text-center text-gray-700 font-medium">
                        <button
                          onClick={() => handleObjectClick(object)}
                          className="hover:text-blue-600 hover:underline text-left"
                        >
                          {object.label || object.name}
                        </button>
                      </td>
                      <td className="p-4 text-center text-gray-700 font-medium">{object.name}</td>
                      <td className="p-4 text-center text-gray-700 font-medium">
                        {object.custom ? "Custom" : "Standard"}
                      </td>
                      <td className="p-4 text-center text-gray-700 font-medium">
                        {object.createdDate ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-900">
                              {new Date(object.createdDate).toLocaleDateString() == "1/1/1970" ? "—" : new Date(object.createdDate).toLocaleDateString()}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {object.createdByName || "Unknown"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-700">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center text-gray-700 font-medium">
                        {object.lastModifiedDate ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-900">
                              {new Date(object.lastModifiedDate).toLocaleDateString() == "1/1/1970" ? "—" : new Date(object.lastModifiedDate).toLocaleDateString()}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {object.lastModifiedByName || "Unknown"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center text-gray-700 font-medium">{object.keyPrefix || "—"}</td>
                      <td className="p-4 text-center text-gray-700 font-medium">
                        <button
                          onClick={() => fetchRecordCount(object.name)}
                          disabled={countLoadingFor === object.name}
                          className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {countLoadingFor === object.name
                            ? "Fetching…"
                            : counts[object.name] !== undefined
                              ? formatLargeNumber(counts[object.name])
                              : "Get count"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-slate-500">
                No objects match your search or filter.
              </div>
            )}
          </div>
        </section >
      </div >

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
            <section>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Child Relationships</h3>
              <div className="overflow-hidden border border-gray-200 rounded-xl">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Child Object</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relationship Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cascade Delete</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {object.childRelationships.map((rel, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rel.childSObject}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{rel.field}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rel.relationshipName || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {rel.cascadeDelete ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Yes</span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
