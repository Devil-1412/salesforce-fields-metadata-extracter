'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ComparePage() {
  const router = useRouter();
  const [comparison, setComparison] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedObjects, setSelectedObjects] = useState([]);
  const [org1, setOrg1] = useState([]);
  const [org2, setOrg2] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    both: false,
    onlyOrg1: false,
    onlyOrg2: false,
  });

  useEffect(() => {
    const fetchOrgs = async () => {
      const email = sessionStorage.getItem('email');
      const res = await fetch("/api/salesforceLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        setOrgs(data.data);
      } else {
        toast.error("Couldn't login to the organisation!");
      }
    };
    fetchOrgs();
  }, []);

  useEffect(() => {
    if (!org1.accessToken || !org2.accessToken) return;
    const fetchComparison = async () => {
      try {
        if (!org1.accessToken || !org2.accessToken) {
          toast.error("Missing Salesforce session info. Please log in to both orgs first.");
          setLoading(false);
          return;
        }

        const res = await fetch("/api/compareObjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ org1, org2 }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to compare objects.");

        setComparison(data.comparison);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchComparison();
  }, [org1, org2]);

  const toggleSelect = (name) => {
    setSelectedObjects(prev =>
      prev.includes(name)
        ? prev.filter(n => n !== name)
        : [...prev, name]
    );
  };

  const filtered = comparison.filter(obj =>
    obj.objectName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-8 px-5 rounded-3xl shadow-lg mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-1">
            Salesforce Org Compare
          </h1>
          <p className="text-blue-100 text-sm">
            Compare objects, fields in mutliple Salesforce org.
          </p>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center py-5">
          <div className="mt-4 md:mt-0 text-left">
            <label className="text-sm text-blue-100 block mb-1">
              Connected Org1:
            </label>

            <select
              className="bg-white text-blue-700 font-semibold rounded-lg px-3 py-1 shadow-sm border border-blue-200 focus:ring-2 focus:ring-blue-400 outline-none cursor-pointer"
              value={org1 || ""}
              onChange={(e) => {
                const selectedOrg = orgs.find((o) => o.instanceUrl === e.target.value);
                if (selectedOrg) {
                  sessionStorage.setItem("org1", JSON.stringify(selectedOrg));
                  setOrg1(selectedOrg)
                  toast.success(`Switched to ${selectedOrg.orgName != "None" ? selectedOrg.orgName : "Selected Org1"}`);
                }
              }}
            >
              <option value="" disabled>
                Select an Org
              </option>
              {orgs.map((o, idx) => (
                <option key={idx} value={o.instanceUrl}>
                  {o.orgName != "None"
                    ? `${o.orgName} || (${o.instanceUrl.replace("https://", "")})`
                    : o.instanceUrl.replace("https://", "")}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4 md:mt-0 text-left">
            <label className="text-sm text-blue-100 block mb-1">
              Connected Org2:
            </label>

            <select
              className="bg-white text-blue-700 font-semibold rounded-lg px-3 py-1 shadow-sm border border-blue-200 focus:ring-2 focus:ring-blue-400 outline-none cursor-pointer"
              value={org2 || ""}
              onChange={(e) => {
                const selectedOrg = orgs.find((o) => o.instanceUrl === e.target.value);
                if (selectedOrg) {
                  sessionStorage.setItem("org2", JSON.stringify(selectedOrg));
                  setOrg2(selectedOrg);
                  toast.success(`Switched to ${selectedOrg.orgName != "None" ? selectedOrg.orgName : "Selected Org2"}`);
                }
              }}
            >
              <option value="" disabled>
                Select an Org
              </option>
              {orgs.map((o, idx) => (
                <option key={idx} value={o.instanceUrl}>
                  {o.orgName != "None"
                    ? `${o.orgName} || (${o.instanceUrl.replace("https://", "")})`
                    : o.instanceUrl.replace("https://", "")}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {
        loading ? (
          <div className="text-gray-600 text-center mt-20">Fetching objects from both orgs...</div>
        ) : error ? (
          <div className="text-red-600 text-center mt-10 font-medium">{error}</div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-6">
              <input
                type="text"
                placeholder="Search object..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 w-1/3 focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="overflow-auto max-h-[600px] border border-gray-300 rounded-lg shadow bg-white">
              <table className="min-w-full border-collapse">
                <thead className="bg-blue-100 sticky top-0 z-10">
                  <tr>
                    <th className="border border-gray-300 p-2">Select</th>
                    <th className="border border-gray-300 p-2">Key Prefix</th>
                    <th className="border border-gray-300 p-2">Object Name</th>
                    <th className="border border-gray-300 p-2">{org1.orgName != 'None' ? org1.orgName : "Org 1"}</th>
                    <th className="border border-gray-300 p-2">{org2.orgName != 'None' ? org2.orgName : "Org 2"}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered
                    .filter((obj) => {
                      if (!filters.both && !filters.onlyOrg1 && !filters.onlyOrg2) return true; // no filter → show all
                      if (filters.both && obj.org1Present && obj.org2Present) return true;
                      if (filters.onlyOrg1 && obj.org1Present && !obj.org2Present) return true;
                      if (filters.onlyOrg2 && !obj.org1Present && obj.org2Present) return true;
                      return false;
                    }).map(obj => (
                      <tr key={obj.objectName} className="hover:bg-gray-50">
                        <td className="border p-2 text-center">
                          <input
                            type="checkbox"
                            checked={selectedObjects.includes(obj.objectName)}
                            onChange={() => toggleSelect(obj.objectName)}
                          />
                        </td>
                        <td className="border p-2">{obj.keyPrefix}</td>
                        <td className="border p-2 font-medium">{obj.objectName}</td>
                        <td className="border p-2 text-center">
                          {obj.org1Present ? "True" : "False"}
                        </td>
                        <td className="border p-2 text-center">
                          {obj.org2Present ? "True" : "False"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 flex justify-start">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="filter"
                    checked={filters.both}
                    onChange={() => setFilters({ both: true, onlyOrg1: false, onlyOrg2: false })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">Objects in both orgs</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="filter"
                    checked={filters.onlyOrg1}
                    onChange={() => setFilters({ both: false, onlyOrg1: true, onlyOrg2: false })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">Objects only in Org 1</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="filter"
                    checked={filters.onlyOrg2}
                    onChange={() => setFilters({ both: false, onlyOrg1: false, onlyOrg2: true })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">Objects only in Org 2</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="filter"
                    checked={!filters.both && !filters.onlyOrg1 && !filters.onlyOrg2}
                    onChange={() => setFilters({ both: false, onlyOrg1: false, onlyOrg2: false })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">Show All</span>
                </label>
              </div>
            </div>



            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  sessionStorage.setItem("selectedObjects", JSON.stringify(selectedObjects));
                  router.push("/compareFields");
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                disabled={selectedObjects.length === 0}
              >
                Compare Fields →
              </button>
            </div>
          </>
        )
      }
    </div >
  );
}

