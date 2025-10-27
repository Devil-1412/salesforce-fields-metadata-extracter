'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ComparePage() {
  const router = useRouter();
  const [comparison, setComparison] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedObjects, setSelectedObjects] = useState([]);
  const [orgNames, setOrgNames] = useState({ org1: "", org2: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    both: false, 
    onlyOrg1: false,
    onlyOrg2: false,
  });


  useEffect(() => {
    const fetchComparison = async () => {
      try {
        const org1 = {
          accessToken: sessionStorage.getItem("org1_accessToken"),
          instanceUrl: sessionStorage.getItem("org1_instanceUrl"),
          username: sessionStorage.getItem("org1_username"),
        };
        const org2 = {
          accessToken: sessionStorage.getItem("org2_accessToken"),
          instanceUrl: sessionStorage.getItem("org2_instanceUrl"),
          username: sessionStorage.getItem("org2_username"),
        };

        if (!org1.accessToken || !org2.accessToken) {
          setError("Missing Salesforce session info. Please log in to both orgs first.");
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
        setOrgNames({ org1: data.org1Name, org2: data.org2Name });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, []);

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
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">
        🔍 Compare Salesforce Objects
      </h1>

      {loading ? (
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
                <th className="border border-gray-300 p-2">{orgNames.org1 || "Org 1"}</th>
                <th className="border border-gray-300 p-2">{orgNames.org2 || "Org 2"}</th>
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
                    type="checkbox"
                    checked={filters.both}
                    onChange={() => setFilters((f) => ({ ...f, both: !f.both }))}
                    className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700">Objects in both orgs</span>
                </label>

                <label className="flex items-center space-x-2">
                    <input
                    type="checkbox"
                    checked={filters.onlyOrg1}
                    onChange={() => setFilters((f) => ({ ...f, onlyOrg1: !f.onlyOrg1 }))}
                    className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700">Objects only in Org 1</span>
                </label>

                <label className="flex items-center space-x-2">
                    <input
                    type="checkbox"
                    checked={filters.onlyOrg2}
                    onChange={() => setFilters((f) => ({ ...f, onlyOrg2: !f.onlyOrg2 }))}
                    className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700">Objects only in Org 2</span>
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
      )}
    </div>
  );
}
