"use client";
import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";

export default function CompareFields() {
  const [selectedObjects, setSelectedObjects] = useState([]);
  const [selectedObject, setSelectedObject] = useState("");
  const [fieldData, setFieldData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [org1, setOrg1] = useState({});
  const [org2, setOrg2] = useState({});
  const [org1Data, setOrg1Data] = useState({});
  const [org2Data, setOrg2Data] = useState({});
  const [filter, setFilter] = useState("all");
  const [metadataOptions, setMetadataOptions] = useState([]); // dynamic keys
  const [selectedMetadata, setSelectedMetadata] = useState([]);

  // Load orgs and selected objects
  useEffect(() => {
    const objs = JSON.parse(sessionStorage.getItem("selectedObjects") || "[]");
    const org1 = JSON.parse(sessionStorage.getItem("org1"));
    const org2 = JSON.parse(sessionStorage.getItem("org2"));
    setSelectedObjects(objs);
    setOrg1(org1);
    setOrg2(org2);
  }, []);

  // Fetch fields metadata for both orgs
  useEffect(() => {
    if (!org1.accessToken || !org2.accessToken || !selectedObjects.length) return;

    const fetchFieldsData = async () => {
      try {
        const [res1, res2] = await Promise.all([
          fetch("/api/fields", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accessToken: org1.accessToken,
              instanceUrl: org1.instanceUrl,
              objects: selectedObjects,
            }),
          }),
          fetch("/api/fields", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accessToken: org2.accessToken,
              instanceUrl: org2.instanceUrl,
              objects: selectedObjects,
            }),
          }),
        ]);

        const data1 = await res1.json();
        const data2 = await res2.json();

        if (!data1.success || !data2.success)
          toast.error("Error fetching fields");

        setOrg1Data(data1.data);
        setOrg2Data(data2.data);

        // extract all metadata keys dynamically
        const sampleObj = Object.values(data1.data)?.[0]?.[0] || {};
        const dynamicKeys = Object.keys(sampleObj);

        setMetadataOptions(dynamicKeys);
        setSelectedMetadata(dynamicKeys.slice(0, 4)); // default: first 4

      } catch (err) {
        toast.error("Comparison error:", err);
      }
    };
    fetchFieldsData();
    setLoading(false);
  }, [org1, org2, selectedObjects]);

  useEffect(() => {
    const fetchComparison = () => {
      // build comparison structure
      const compared = selectedObjects.map((obj) => {
        const fields1 = org1Data[obj] || [];
        const fields2 = org2Data[obj] || [];

        const map1 = Object.fromEntries(fields1.map((f) => [f.ApiName, f]));
        const map2 = Object.fromEntries(fields2.map((f) => [f.ApiName, f]));

        const allFields = new Set([...Object.keys(map1), ...Object.keys(map2)]);

        const fields = Array.from(allFields).map((name) => {
          const f1 = map1[name] || {};
          const f2 = map2[name] || {};

          const differences = selectedMetadata.reduce((acc, key) => {
            if (f1[key] !== f2[key]) acc.push(key);
            return acc;
          }, []);

          return {
            fieldName: name,
            f1,
            f2,
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
  }, [org1Data, org2Data, selectedObjects, selectedMetadata]);



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



  return (
    <div className="p-6 space-y-8 overflow-y-auto max-h-screen bg-gray-50 min-h-screen">
      {/* Page Header */}
      <h2 className="text-3xl font-extrabold text-center bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent mb-2">
        Salesforce Field Comparison
      </h2>
      <p className="text-center text-gray-500 mb-8">
        Compare fields between{" "}
        <span className="font-semibold text-blue-700">
          {org1?.orgName != "None" ? org1?.orgName : "Org 1"}
        </span>{" "}
        and{" "}
        <span className="font-semibold text-indigo-700">
          {org2?.orgName != "None" ? org2?.orgName : "Org 2"}
        </span>
      </p>

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
                <div className="absolute z-20 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-auto w-full p-2">
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


          {/* Filter Buttons */}
          <div className="flex justify-center mb-6">
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
          </div>

          {/* Table */}
          {selectedObject ? (
            <div className="overflow-auto max-h-[70vh] border border-gray-200 rounded-lg shadow bg-white">
              <table className="min-w-full text-sm border-separate border-spacing-0">
                <thead className="bg-blue-100 sticky top-0 z-10">
                  <tr>
                    {selectedMetadata.map((key) => (
                      <th key={key} colSpan="2" className="p-3 text-center font-semibold text-gray-700 border-b border-gray-200">
                        {key}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    {selectedMetadata.map((key) => (
                      <>
                        <th key={`${key}-org1`} className="p-2 text-center border-b border-gray-200 text-gray-600">
                          {org1?.orgName != "None" ? org1?.orgName : "Org 1"}
                        </th>
                        <th key={`${key}-org2`} className="p-2 text-center border-b border-gray-200 text-gray-600">
                          {org2?.orgName != "None" ? org2?.orgName : "Org 2"}
                        </th>
                      </>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredFields.map((f, idx) => (
                    <tr
                      key={idx}
                      className={`transition-all ${f.diff ? "bg-red-50 hover:bg-red-100" : "bg-white hover:bg-blue-50"
                        }`}
                    >
                      {selectedMetadata.map((key) => (
                        <>
                          <td key={`${key}-1`} className="p-3 text-center border-b border-gray-100">
                            {String(f.f1[key] ?? "—")}
                          </td>
                          <td key={`${key}-2`} className="p-3 text-center border-b border-gray-100">
                            {String(f.f2[key] ?? "—")}
                          </td>
                        </>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-600 mt-6">
              Please select an object to view field comparison.
            </p>
          )}
        </>
      )}
    </div>
  );
}
