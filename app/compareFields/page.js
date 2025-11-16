"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import { LayoutGrid, Columns } from "lucide-react";

export default function CompareFields() {
  const [selectedObjects, setSelectedObjects] = useState([]);
  const [selectedObject, setSelectedObject] = useState("");
  const [fieldData, setFieldData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orgs, setOrgs] = useState([]); // Array of organizations
  const [orgsData, setOrgsData] = useState([]); // Array of data for each org
  const [availableOrgs, setAvailableOrgs] = useState([]); // All available orgs from API
  const [filter, setFilter] = useState("all");
  const [metadataOptions, setMetadataOptions] = useState([]); // dynamic keys
  const [selectedMetadata, setSelectedMetadata] = useState([]);
  const [displayMode, setDisplayMode] = useState("default"); // "default" or "separate"
  const [scrollLock, setScrollLock] = useState(false); // Scroll lock for separate tables
  const scrollContainerRef = useRef(null);
  const tableScrollRefs = useRef([]);
  const scrollHandlersRef = useRef([]);
  const verticalScrollHandlersRef = useRef([]);
  const lastScrollPositionsRef = useRef([]);
  const isSyncingRef = useRef(false);

  // Load available orgs from API
  useEffect(() => {
    const fetchOrgs = async () => {
      const email = sessionStorage.getItem('email');
      if (!email) return;

      try {
        const res = await fetch("/api/salesforceLogin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (data.success) {
          setAvailableOrgs(data.data);
        }
      } catch (err) {
        console.error("Error fetching orgs:", err);
      }
    };
    fetchOrgs();
  }, []);

  // Load orgs and selected objects from sessionStorage (default to 2 orgs)
  useEffect(() => {
    const objs = JSON.parse(sessionStorage.getItem("selectedObjects") || "[]");
    const org1 = JSON.parse(sessionStorage.getItem("org1"));
    const org2 = JSON.parse(sessionStorage.getItem("org2"));

    setSelectedObjects(objs);

    // Initialize with default 2 orgs if available
    const initialOrgs = [];
    if (org1 && org1.accessToken) initialOrgs.push(org1);
    if (org2 && org2.accessToken) initialOrgs.push(org2);

    // Ensure at least 2 orgs (add placeholder if needed)
    if (initialOrgs.length === 0) {
      initialOrgs.push({ orgName: "Org 1", accessToken: null, instanceUrl: null });
      initialOrgs.push({ orgName: "Org 2", accessToken: null, instanceUrl: null });
    } else if (initialOrgs.length === 1) {
      initialOrgs.push({ orgName: "Org 2", accessToken: null, instanceUrl: null });
    }

    setOrgs(initialOrgs);
  }, []);

  // Fetch fields metadata for all orgs
  useEffect(() => {
    const validOrgs = orgs.filter(org => org.accessToken && org.instanceUrl);
    if (validOrgs.length === 0 || !selectedObjects.length) {
      setLoading(false);
      return;
    }

    const fetchFieldsData = async () => {
      try {
        setLoading(true);
        const responses = await Promise.all(
          validOrgs.map(org =>
            fetch("/api/fields", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                accessToken: org.accessToken,
                instanceUrl: org.instanceUrl,
                objects: selectedObjects,
              }),
            })
          )
        );

        const dataArray = await Promise.all(responses.map(res => res.json()));

        const hasError = dataArray.some(data => !data.success);
        if (hasError) {
          toast.error("Error fetching fields from some organizations");
        }

        setOrgsData(dataArray.map(data => data.data || {}));

        // extract all metadata keys dynamically from first successful response
        const firstSuccessData = dataArray.find(data => data.success && data.data);
        if (firstSuccessData) {
          const sampleObj = Object.values(firstSuccessData.data)?.[0]?.[0] || {};
          const dynamicKeys = Object.keys(sampleObj);
          setMetadataOptions(dynamicKeys);
          setSelectedMetadata(dynamicKeys.slice(0, 4)); // default: first 4
        }

      } catch (err) {
        toast.error("Comparison error: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchFieldsData();
  }, [orgs, selectedObjects]);

  useEffect(() => {
    const fetchComparison = () => {
      if (orgsData.length === 0) return;

      // build comparison structure
      const compared = selectedObjects.map((obj) => {
        // Get fields from all orgs
        const fieldsMaps = orgsData.map(orgData => {
          const fields = orgData[obj] || [];
          return Object.fromEntries(fields.map((f) => [f.ApiName, f]));
        });

        // Get all unique field names across all orgs
        const allFields = new Set();
        fieldsMaps.forEach(map => {
          Object.keys(map).forEach(key => allFields.add(key));
        });

        const fields = Array.from(allFields).map((name) => {
          // Get field data from each org
          const fieldDataArray = fieldsMaps.map(map => map[name] || {});

          // Check for differences across all orgs
          const differences = selectedMetadata.reduce((acc, key) => {
            const values = fieldDataArray.map(f => f[key]);
            // Check if all values are the same
            const allSame = values.every(val => val === values[0]);
            if (!allSame) acc.push(key);
            return acc;
          }, []);

          return {
            fieldName: name,
            fieldDataArray, // Array of field data for each org
            diff: differences.length > 0,
            diffKeys: differences,
          };
        });
        return { objectName: obj, fields };
      });
      console.log(compared);
      setFieldData(compared);
    }
    fetchComparison();
  }, [orgsData, selectedObjects, selectedMetadata]);



  const currentObjectData = fieldData.find((f) => f.objectName === selectedObject);

  const filteredFields = useMemo(() => {
    return (
      currentObjectData?.fields?.filter((f) =>
        filter === "all" ? true : filter === "different" ? f.diff : !f.diff
      ) || []
    );
  }, [filter, currentObjectData]);

  const matchingCount = currentObjectData
    ? currentObjectData.fields.filter((f) => !f.diff).length
    : 0;
  const differentCount = currentObjectData
    ? currentObjectData.fields.filter((f) => f.diff).length
    : 0;
  const totalCount = currentObjectData ? currentObjectData.fields.length : 0;
  const diffPercent =
    totalCount > 0 ? Math.round((differentCount / totalCount) * 100) : 0;

  const toggleMetadata = (key) => {
    setSelectedMetadata((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Add a new org
  const addOrg = () => {
    const newOrg = {
      orgName: `Org ${orgs.length + 1}`,
      accessToken: null,
      instanceUrl: null
    };
    setOrgs([...orgs, newOrg]);
  };

  // Remove an org (minimum 2 orgs required)
  const removeOrg = (index) => {
    if (orgs.length <= 2) {
      toast.error("At least 2 organizations are required");
      return;
    }
    setOrgs(orgs.filter((_, i) => i !== index));
    // Clear orgsData to trigger re-fetch
    setOrgsData([]);
  };

  // Update an org
  const updateOrg = (index, org) => {
    const updatedOrgs = [...orgs];
    updatedOrgs[index] = org;
    setOrgs(updatedOrgs);
  };

  // Get valid orgs (with access tokens)
  const validOrgs = orgs.filter(org => org.accessToken && org.instanceUrl);

  // Synchronize scrolling for separate tables (horizontal and vertical when scroll lock is enabled)
  useEffect(() => {
    if (displayMode !== "separate" || validOrgs.length === 0) {
      scrollHandlersRef.current = [];
      verticalScrollHandlersRef.current = [];
      return;
    }

    const setupScrollSync = () => {
      // Clear existing horizontal handlers
      tableScrollRefs.current.forEach((ref, idx) => {
        if (ref && scrollHandlersRef.current[idx]) {
          ref.removeEventListener("scroll", scrollHandlersRef.current[idx]);
        }
      });

      // Clear existing vertical handlers
      tableScrollRefs.current.forEach((ref, idx) => {
        if (ref && verticalScrollHandlersRef.current[idx]) {
          ref.removeEventListener("scroll", verticalScrollHandlersRef.current[idx]);
        }
      });

      scrollHandlersRef.current = [];
      verticalScrollHandlersRef.current = [];

      // Initialize last scroll positions
      lastScrollPositionsRef.current = tableScrollRefs.current.map(ref =>
        ref ? { left: ref.scrollLeft, top: ref.scrollTop } : { left: 0, top: 0 }
      );

      // Create combined scroll handlers
      tableScrollRefs.current.forEach((ref, sourceIdx) => {
        if (!ref) return;

        const combinedHandler = (e) => {
          // Prevent infinite loops
          if (isSyncingRef.current) return;

          const currentScrollLeft = e.target.scrollLeft;
          const currentScrollTop = e.target.scrollTop;
          const lastPos = lastScrollPositionsRef.current[sourceIdx];

          // Sync horizontal scroll (always enabled)
          if (currentScrollLeft !== lastPos.left) {
            isSyncingRef.current = true;
            tableScrollRefs.current.forEach((otherRef, otherIdx) => {
              if (otherRef && otherIdx !== sourceIdx) {
                otherRef.scrollLeft = currentScrollLeft;
                lastScrollPositionsRef.current[otherIdx].left = currentScrollLeft;
              }
            });
            lastPos.left = currentScrollLeft;
            isSyncingRef.current = false;
          }

          // Sync vertical scroll (only when scroll lock is enabled)
          if (scrollLock && currentScrollTop !== lastPos.top) {
            isSyncingRef.current = true;
            tableScrollRefs.current.forEach((otherRef, otherIdx) => {
              if (otherRef && otherIdx !== sourceIdx) {
                otherRef.scrollTop = currentScrollTop;
                lastScrollPositionsRef.current[otherIdx].top = currentScrollTop;
              }
            });
            lastPos.top = currentScrollTop;
            isSyncingRef.current = false;
          }
        };

        scrollHandlersRef.current[sourceIdx] = combinedHandler;
        ref.addEventListener("scroll", combinedHandler);
      });
    };

    // Setup after a brief delay to ensure refs are set
    const timeoutId = setTimeout(setupScrollSync, 150);

    return () => {
      clearTimeout(timeoutId);
      tableScrollRefs.current.forEach((ref, idx) => {
        if (ref && scrollHandlersRef.current[idx]) {
          ref.removeEventListener("scroll", scrollHandlersRef.current[idx]);
        }
        if (ref && verticalScrollHandlersRef.current[idx]) {
          ref.removeEventListener("scroll", verticalScrollHandlersRef.current[idx]);
        }
      });
      scrollHandlersRef.current = [];
      verticalScrollHandlersRef.current = [];
    };
  }, [displayMode, validOrgs.length, filteredFields.length, scrollLock]);



  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        /* Custom scrollbar styles - hidden by default, visible on hover */
        .scrollbar-hide {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Scrollbar visible on hover */
        .scrollbar-hover {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .scrollbar-hover::-webkit-scrollbar {
          width: 0px;
          height: 0px;
        }
        .scrollbar-hover:hover {
          scrollbar-width: thin;
          scrollbar-color: #94a3b8 #f1f5f9;
        }
        .scrollbar-hover:hover::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .scrollbar-hover:hover::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .scrollbar-hover:hover::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 4px;
        }
        .scrollbar-hover:hover::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}} />
      <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
        {/* Page Header */}
        <h2 className="text-3xl font-extrabold text-center bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent mb-2">
          Salesforce Field Comparison
        </h2>
        <p className="text-center text-gray-500 mb-8">
          Compare fields across{" "}
          {validOrgs.length > 0 ? (
            validOrgs.map((org, idx) => (
              <span key={idx}>
                <span className="font-semibold text-blue-700">
                  {org.orgName != "None" ? org.orgName : `Org ${idx + 1}`}
                </span>
                {idx < validOrgs.length - 1 && <span className="mx-2">, </span>}
              </span>
            ))
          ) : (
            <span className="font-semibold text-gray-400">organizations</span>
          )}
        </p>

        {/* Organization Management */}
        <section className="w-full bg-white border border-gray-200 rounded-2xl shadow-md px-8 py-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Organizations</h3>
            <button
              onClick={addOrg}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              + Add Org
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orgs.map((org, index) => (
              <div key={index} className="flex flex-col gap-2 p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Org {index + 1}
                  </label>
                  {orgs.length > 2 && (
                    <button
                      onClick={() => removeOrg(index)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <select
                  value={org.instanceUrl || ""}
                  onChange={(e) => {
                    const selectedOrg = availableOrgs.find((o) => o.instanceUrl === e.target.value);
                    if (selectedOrg) {
                      updateOrg(index, selectedOrg);
                      toast.success(
                        `Switched to ${selectedOrg.orgName !== "None" ? selectedOrg.orgName : `Org ${index + 1}`}`
                      );
                    }
                  }}
                  className="w-full bg-white text-gray-700 rounded-lg px-3 py-2 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 transition-all cursor-pointer shadow-sm"
                >
                  <option value="" disabled>
                    Select an Org
                  </option>
                  {availableOrgs.map((o, idx) => (
                    <option key={idx} value={o.instanceUrl}>
                      {o.orgName !== "None"
                        ? `${o.orgName} || (${o.instanceUrl.replace("https://", "")})`
                        : o.instanceUrl.replace("https://", "")}
                    </option>
                  ))}
                </select>
                {org.instanceUrl && (
                  <p className="text-xs text-gray-500 mt-1">
                    {org.orgName !== "None" ? org.orgName : org.instanceUrl.replace("https://", "")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {loading ? (
          <div className="text-center text-gray-600 mt-10">Loading field data...</div>
        ) : (
          <>
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
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              {/* Summary Cards */}
              {selectedObject && (
                <div className="flex flex-wrap justify-center gap-3 text-center">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 min-w-[120px] shadow-sm">
                    <p className="text-blue-700 text-sm font-medium">Total Fields</p>
                    <p className="text-xl font-bold text-blue-800">{totalCount}</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 min-w-[120px] shadow-sm">
                    <p className="text-green-700 text-sm font-medium">Matching</p>
                    <p className="text-xl font-bold text-green-800">{matchingCount}</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 min-w-[120px] shadow-sm">
                    <p className="text-red-700 text-sm font-medium">Different</p>
                    <p className="text-xl font-bold text-red-800">{differentCount}</p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2 min-w-[120px] shadow-sm">
                    <p className="text-yellow-700 text-sm font-medium">Difference %</p>
                    <p className="text-xl font-bold text-yellow-800">{diffPercent}%</p>
                  </div>
                </div>
              )}
            </section>

            {/* Metadata Dropdown */}
            <div className="flex flex-wrap justify-between items-center gap-6 mb-4">
              {/* Metadata selection dropdown */}
              <div className="relative">
                <details className="group border border-gray-300 rounded-lg px-4 py-2 bg-white cursor-pointer w-64 shadow-sm">
                  <summary className="flex justify-between items-center text-gray-700 font-medium select-none">
                    Compare By ({selectedMetadata.length})
                  </summary>
                  <div className="absolute z-30 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-auto w-full p-2 left-0">
                    {metadataOptions.map((key) => (
                      <label
                        key={key}
                        className="flex items-center text-gray-700 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMetadata.includes(key)}
                          onChange={() => toggleMetadata(key)}
                          className="mr-2 accent-blue-600"
                        />
                        {key}
                      </label>
                    ))}
                  </div>
                </details>
              </div>
              {/* Type filter dropdown
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
            </div> */}
            </div>


            {/* Filter Buttons and Display Toggle */}
            <div className="flex justify-center items-center gap-4 mb-6">
              <div className="inline-flex bg-white border border-gray-300 rounded-xl shadow-sm overflow-hidden">
                {[
                  { key: "all", label: "All Fields" },
                  { key: "different", label: "Only Different" },
                  { key: "same", label: "Only Matching" },
                ].map(({ key, label }) => {
                  const isActive = filter === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={`px-5 py-2 text-sm font-medium transition-all duration-200 ${isActive
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {/* Display Mode Toggle */}
              <button
                onClick={() => setDisplayMode(displayMode === "default" ? "separate" : "default")}
                className="px-4 py-2 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700"
                title={displayMode === "default" ? "Switch to separate tables view" : "Switch to side-by-side view"}
              >
                {displayMode === "default" ? (
                  <>
                    <Columns className="w-4 h-4" />
                    <span>Separate Tables</span>
                  </>
                ) : (
                  <>
                    <LayoutGrid className="w-4 h-4" />
                    <span>Side-by-Side</span>
                  </>
                )}
              </button>
              {/* Scroll Lock Checkbox (only visible in separate tables mode) */}
              {displayMode === "separate" && (
                <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scrollLock}
                    onChange={(e) => setScrollLock(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">Scroll Lock</span>
                </label>
              )}
            </div>

            {/* Table */}
            {selectedObject ? (
              displayMode === "default" ? (
                // Default Side-by-Side View
                <div className="overflow-auto max-h-[70vh] border-0 rounded-xl shadow-lg bg-white scrollbar-hide scrollbar-hover">
                  <table className="min-w-full text-sm border-collapse">
                    <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white sticky top-0 z-20 shadow-md">
                      <tr>
                        {selectedMetadata.map((key) => (
                          <th key={key} colSpan={validOrgs.length} className="p-4 text-center font-bold text-sm uppercase tracking-wider border-b-0 border-blue-700">
                            {key}
                          </th>
                        ))}
                      </tr>
                      <tr className="bg-gradient-to-r from-blue-500 to-indigo-500 border-t-0">
                        {selectedMetadata.map((key) =>
                          validOrgs.map((org, orgIdx) => (
                            <th key={`${key}-org${orgIdx}`} className="p-3 text-center text-xs font-semibold border-b border-blue-400/30">
                              {org.orgName != "None" ? org.orgName : `Org ${orgIdx + 1}`}
                            </th>
                          ))
                        )}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {filteredFields.map((f, idx) => (
                        <tr
                          key={idx}
                          className={`transition-all duration-150 ${f.diff
                            ? "bg-red-50/50 hover:bg-red-100/70 border-l-4 border-red-400"
                            : "bg-white hover:bg-blue-50/50 border-l-4 border-transparent hover:border-blue-300"
                            }`}
                        >
                          {selectedMetadata.map((key) =>
                            validOrgs.map((org, orgIdx) => {
                              const fieldData = f.fieldDataArray[orgIdx] || {};
                              return (
                                <td key={`${key}-${orgIdx}`} className="p-4 text-center text-gray-700 font-medium">
                                  <span className="inline-block px-2 py-1 rounded-md bg-gray-50 text-gray-800">
                                    {String(fieldData[key] ?? "—")}
                                  </span>
                                </td>
                              );
                            })
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                // Separate Tables View
                <div
                  ref={scrollContainerRef}
                  className="overflow-y-auto max-h-[70vh] border-0 rounded-xl shadow-lg bg-white scrollbar-hide"
                >
                  <div className="flex gap-6 p-6">
                    {validOrgs.map((org, orgIdx) => (
                      <div key={orgIdx} className="flex-1 min-w-0 flex flex-col">
                        <div className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-lg shadow-md">
                          <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                            {org.orgName != "None" ? org.orgName : `Org ${orgIdx + 1}`}
                          </h3>
                        </div>
                        <div
                          ref={(el) => {
                            if (el) {
                              tableScrollRefs.current[orgIdx] = el;
                            }
                          }}
                          className="overflow-x-auto overflow-y-auto border-0 rounded-b-lg bg-white shadow-inner scrollbar-hide scrollbar-hover"
                          style={{ maxHeight: 'calc(70vh - 100px)' }}
                        >
                          <table className="min-w-full text-sm border-collapse">
                            <thead className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white sticky top-0 z-10 shadow-sm border-t-0">
                              <tr>
                                {selectedMetadata.map((key) => (
                                  <th key={key} className="p-4 text-center font-bold text-xs uppercase tracking-wider whitespace-nowrap border-r border-blue-400/30 last:border-r-0">
                                    {key}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {filteredFields.map((f, idx) => {
                                const fieldData = f.fieldDataArray[orgIdx] || {};
                                return (
                                  <tr
                                    key={idx}
                                    className={`transition-all duration-150 ${f.diff
                                      ? "bg-red-50/50 hover:bg-red-100/70 border-l-4 border-red-400"
                                      : "bg-white hover:bg-blue-50/50 border-l-4 border-transparent hover:border-blue-300"
                                      }`}
                                  >
                                    {selectedMetadata.map((key) => (
                                      <td key={key} className="p-4 text-center text-gray-700 font-medium whitespace-nowrap border-r border-gray-100 last:border-r-0">
                                        <span className="inline-block px-3 py-1.5 rounded-lg bg-gray-50 text-gray-800 font-medium">
                                          {String(fieldData[key] ?? "—")}
                                        </span>
                                      </td>
                                    ))}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : (
              <p className="text-center text-gray-600 mt-6">
                Please select an object to view field comparison.
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}
