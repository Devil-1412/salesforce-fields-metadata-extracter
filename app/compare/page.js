'use client';
import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";

export default function ComparePage() {
  const [comparison, setComparison] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [orgs, setOrgs] = useState([]);
  const [availableOrgs, setAvailableOrgs] = useState([]); // All available orgs from API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const validOrgs = useMemo(
    () => orgs.filter((org) => org.accessToken && org.instanceUrl),
    [orgs]
  );

  // Load available orgs from API
  useEffect(() => {
    const fetchOrgs = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch("/api/salesforceLogin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({}),
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


  useEffect(() => {
    // Initialize with default 2 orgs if available
    const initialOrgs = [];

    // Ensure at least 2 orgs (add placeholder if needed)
    if (initialOrgs.length === 0) {
      initialOrgs.push({ orgName: "Org 1", accessToken: null, instanceUrl: null });
      initialOrgs.push({ orgName: "Org 2", accessToken: null, instanceUrl: null });
    } else if (initialOrgs.length === 1) {
      initialOrgs.push({ orgName: "Org 2", accessToken: null, instanceUrl: null });
    }

    setOrgs(initialOrgs);
  }, []);


  useEffect(() => {
    const fetchObjectsForOrg = async (org) => {
      if (!org.accessToken || !org.instanceUrl) return [];
      try {
        const res = await fetch("/api/objects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: org.accessToken, instanceUrl: org.instanceUrl })
        });
        const data = await res.json();
        if (data.success) return data.object;
        else throw new Error(data.error || "Failed to fetch objects.");
      } catch (err) {
        toast.error(`Error fetching objects for ${org.orgName || org.instanceUrl}: ${err.message}`);
        return [];
      }
    };

    const fetchAndCompareObjects = async () => {
      setLoading(true);
      setError("");
      if (orgs.length < 2 || orgs.some(o => !o.accessToken || !o.instanceUrl)) {
        setLoading(false);
        return;
      }
      try {
        // Fetch objects for all selected orgs
        const orgObjectsList = await Promise.all(orgs.map(fetchObjectsForOrg));
        // Get all unique object names
        const allNames = Array.from(new Set(orgObjectsList.flat().map(o => o.name)));
        // Build comparison data: each row is an object, each column is an org
        const comparisonData = allNames.map(name => {
          const row = {
            objectName: name,
            keyPrefix: orgObjectsList.find(list => list.some(o => o.name === name))?.find(o => o.name === name)?.keyPrefix || "",
            orgs: orgs.map((org, idx) => {
              const obj = orgObjectsList[idx].find(o => o.name === name);
              return {
                present: !!obj,
                label: obj?.label || name,
                custom: obj?.custom || false
              };
            })
          };
          return row;
        });
        setComparison(comparisonData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAndCompareObjects();
  }, [orgs]);


  // Add Org feature
  const addOrg = () => {
    setOrgs(prev => [
      ...prev,
      {
        orgName: `Org ${prev.length + 1}`,
        accessToken: null,
        instanceUrl: null
      }
    ]);
  };

  // Remove Org (minimum 2 orgs required)
  const removeOrg = (index) => {
    if (orgs.length > 2) {
      setOrgs(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateOrg = (index, org) => {
    const updatedOrgs = [...orgs];
    updatedOrgs[index] = org;
    setOrgs(updatedOrgs);
  };

  const filtered = comparison.filter(obj =>
    obj.objectName.toLowerCase().includes(search.toLowerCase())
  );

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
          Salesforce Object Comparison
        </h2>
        <section className="w-full bg-white border border-gray-200 rounded-2xl shadow-md px-8 py-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Select Organizations</h3>
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


        {validOrgs.length < 2 ? (
          <div className="text-gray-600 text-center mt-20">Select orgs...</div>
        ) : loading ? (
          <div className="text-gray-600 text-center mt-20">Fetching objects from orgs...</div>
        ) : error ? (
          <div className="text-red-600 text-center mt-10 font-medium">{error}</div>
        ) : (
          <>

            <div className="flex justify-between items-center gap-4 mb-6">
              <input
                type="text"
                placeholder="Search object..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 w-1/3 focus:ring-2 focus:ring-blue-400"
              />
              <div className="inline-flex bg-white border border-gray-300 rounded-xl shadow-sm overflow-hidden">
                {[
                  { key: "all", label: "Show All" },
                  { key: "both", label: "Objects in all orgs" },
                  { key: "different", label: "Only Different" },
                  { key: "custom", label: "Only Custom" }
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
            </div>
            <div className="overflow-auto max-h-[70vh] border-0 rounded-xl shadow-lg bg-white scrollbar-hide scrollbar-hover">
              <table className="min-w-full text-sm border-collapse">
                <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white sticky top-0 z-20 shadow-md h-fixed">
                  <tr className="bg-gradient-to-r from-blue-500 to-indigo-500 border-t-0">
                    <th className="p-3 text-center font-bold text-sm uppercase tracking-wider border-b-0 border-blue-700">Object Name</th>
                    <th className="p-3 text-center font-bold text-sm uppercase tracking-wider border-b-0 border-blue-700">Key Prefix</th>
                    {orgs.map((org, idx) => (
                      <th key={idx} className="p-3 text-center font-bold text-sm uppercase tracking-wider border-b-0 border-blue-700">
                        {org.orgName !== "None" ? org.orgName : `Org ${idx + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="border-t-1 border-gray-200">
                  {comparison
                    .filter(obj => {
                      // Search filter
                      if (search && !obj.objectName.toLowerCase().includes(search.toLowerCase())) return false;
                      // Radio filter logic
                      if (filter === "both") {
                        return obj.orgs.every(o => o.present);
                      }
                      if (filter === "different") {
                        // Show objects not present in all orgs
                        return obj.orgs.some(o => !o.present);
                      }
                      if (filter === "custom") {
                        return obj.orgs.some(o => o.custom);
                      }
                      return true;
                    })
                    .map((obj) => (
                      <tr
                        key={obj.objectName}
                        className={`transition-all duration-150 ${obj.orgs.map(o => o.present).includes(false)
                          ? "bg-red-50/50 hover:bg-red-100/70 border-l-4 border-red-400"
                          : "bg-white hover:bg-blue-50/50 border-l-4 border-transparent hover:border-blue-300"
                          }`}>
                        <td className="p-4 text-center text-gray-700 font-medium">{obj.objectName}</td>
                        <td className="p-4 text-center text-gray-700 font-medium">{obj.keyPrefix}</td>
                        {obj.orgs.map((o, orgIdx) => (
                          <td key={orgIdx} className="p-4 text-center text-gray-700 font-medium">
                            {o.present ? <span className="inline-block px-2 py-1 rounded-md text-gray-800">{o.label}</span> : <span className="inline-block px-2 py-1 rounded-md text-gray-800">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div >
    </>
  );
}

