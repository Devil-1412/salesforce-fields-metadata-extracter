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
  const [selected, setSelected] = useState([]);
  const [counts, setCounts] = useState({});
  const [countLoadingFor, setCountLoadingFor] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [lastUpdated, setLastUpdated] = useState("");

  const loadOrgs = useCallback(async () => {
    setOrgLoading(true);
    setOrgError("");
    try {
      const email = sessionStorage.getItem("email");
      if (!email) throw new Error("Please sign in again to load your organizations.");
      const res = await fetch("/api/salesforceLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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
      setSelected([]);
      setCounts({});
      sessionStorage.setItem("accessToken", org.accessToken);
      sessionStorage.setItem("instanceUrl", org.instanceUrl);
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
    const savedInstance = sessionStorage.getItem("instanceUrl");
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: token, instanceUrl }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Could not load objects.");
        }
        setObjects(Array.isArray(data.object) ? data.object : []);
        setLastUpdated(new Date().toISOString());
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

  useEffect(() => {
    setSelected((prev) =>
      prev.filter((name) => objects.some((object) => object.name === name))
    );
  }, [objects]);

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
      standard,
      selected: selected.length,
    };
  }, [objects, selected.length]);

  const handleCheck = (objectName) => {
    setSelected((prev) =>
      prev.includes(objectName)
        ? prev.filter((name) => name !== objectName)
        : [...prev, objectName]
    );
  };

  const handleSelectVisible = useCallback(() => {
    if (!filteredObjects.length) return;
    setSelected((prev) => {
      const visibleNames = filteredObjects.map((object) => object.name);
      const allVisibleSelected = visibleNames.every((name) => prev.includes(name));
      if (allVisibleSelected) {
        return prev.filter((name) => !visibleNames.includes(name));
      }
      return Array.from(new Set([...prev, ...visibleNames]));
    });
  }, [filteredObjects]);

  const clearSelection = () => setSelected([]);

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
          headers: { "Content-Type": "application/json" },
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

  const handleExtract = () => {
    if (!selected.length) {
      toast.error("Select at least one object first.");
      return;
    }
    sessionStorage.setItem("selectedObjects", JSON.stringify(selected));
    router.push("/metadata");
  };

  const allVisibleSelected =
    filteredObjects.length > 0 &&
    filteredObjects.every((object) => selected.includes(object.name));

  const formattedLastUpdated = lastUpdated
    ? new Date(lastUpdated).toLocaleString()
    : "Awaiting refresh";

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
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
            <div className="flex flex-col gap-2 text-sm">
              <div className="text-slate-200">Connected organization</div>
              <div className="flex gap-2">
                <select
                  className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/70 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/60 md:w-auto"
                  value={selectedOrgId || ""}
                  onChange={(event) => selectOrg(event.target.value)}
                  disabled={orgLoading || !orgs.length}
                >
                  <option value="" disabled>
                    {orgLoading ? "Loading orgs..." : "Select an org"}
                  </option>
                  {orgs.map((org) => (
                    <option key={org.instanceUrl} value={org.instanceUrl} className="text-black">
                      {org.orgName && org.orgName !== "None"
                        ? `${org.orgName} • ${org.instanceUrl.replace("https://", "")}`
                        : org.instanceUrl.replace("https://", "")}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => loadOrgs()}
                  className="rounded-2xl border border-white/40 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                  disabled={orgLoading}
                >
                  Refresh orgs
                </button>
              </div>
              <span className="text-xs text-white/80">
                {selectedOrgMeta?.instanceUrl
                  ? selectedOrgMeta.instanceUrl.replace("https://", "")
                  : "No org selected"}
              </span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
            <span className="rounded-full bg-white/20 px-3 py-1">
              Last fetched: {formattedLastUpdated}
            </span>
            <span className="rounded-full bg-white/20 px-3 py-1">
              Objects: {objects.length}
            </span>
            <span className="rounded-full bg-white/20 px-3 py-1">
              Selected: {selected.length}
            </span>
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
            <div>
              <p className="text-sm text-slate-500">
                Selected objects:{" "}
                <span className="font-semibold text-slate-800">
                  {stats.selected}
                </span>
              </p>
              {selected.length > 0 && (
                <p className="text-xs text-slate-400">
                  {selected.slice(0, 3).join(", ")}
                  {selected.length > 3 && ` +${selected.length - 3} more`}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSelectVisible}
                className="rounded-2xl border border-blue-500 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
              >
                {allVisibleSelected ? "Deselect page" : "Select page"}
              </button>
              <button
                onClick={clearSelection}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Clear selection
              </button>
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

          <div className="mt-4 overflow-auto rounded-2xl border border-slate-200 max-h-[480px]">
            {loading ? (
              <div className="flex h-60 items-center justify-center text-sm text-slate-500">
                Loading objects…
              </div>
            ) : filteredObjects.length ? (
              <table className="w-full min-w-[640px] divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 sticky top-0">
                  <tr>
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={handleSelectVisible}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3">Label</th>
                    <th className="px-4 py-3">API Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">ID Prefix</th>
                    <th className="px-4 py-3 text-right">Records</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                  {filteredObjects.map((object, index) => (
                    <tr
                      key={object.name}
                      className={
                        index % 2 === 0 ? "bg-white" : "bg-slate-50"
                      }
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(object.name)}
                          onChange={() => handleCheck(object.name)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {object.label || object.name}
                      </td>
                      <td className="px-4 py-3">{object.name}</td>
                      <td className="px-4 py-3">
                        {object.custom ? "Custom" : "Standard"}
                      </td>
                      <td className="px-4 py-3">{object.keyPrefix || "—"}</td>
                      <td className="px-4 py-3 text-right">
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
        </section>

        <div className="flex flex-col gap-3 rounded-3xl bg-white p-6 text-sm text-slate-500 shadow-xl md:flex-row md:items-center md:justify-between">
          <p>
            Selected objects:{" "}
            <strong className="text-slate-700">{selected.length}</strong>
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleExtract}
              disabled={!selected.length}
              className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              Extract metadata
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
