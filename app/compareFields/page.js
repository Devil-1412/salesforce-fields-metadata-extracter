"use client";
import { useEffect, useState } from "react";

export default function CompareFields() {
  const [selectedObjects, setSelectedObjects] = useState([]);
  const [selectedObject, setSelectedObject] = useState("");
  const [fieldData, setFieldData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [org1Name, setOrg1Name] = useState("");
  const [org2Name, setOrg2Name] = useState("");

  useEffect(() => {
    const objs = JSON.parse(sessionStorage.getItem("selectedObjects") || "[]");
    const org1 = {
      username: sessionStorage.getItem("org1_username"),
      accessToken: sessionStorage.getItem("org1_accessToken"),
      instanceUrl: sessionStorage.getItem("org1_instanceUrl"),
    };
    const org2 = {
      username: sessionStorage.getItem("org2_username"),
      accessToken: sessionStorage.getItem("org2_accessToken"),
      instanceUrl: sessionStorage.getItem("org2_instanceUrl"),
    };

    if (!org1.accessToken || !org2.accessToken) {
      alert("Missing org connections. Please connect both orgs first.");
      return;
    }

    setSelectedObjects(objs);
    setOrg1Name(org1.username?.split("@")[1]?.split(".")[0] || "Org 1");
    setOrg2Name(org2.username?.split("@")[1]?.split(".")[0] || "Org 2");

    const fetchData = async () => {
      try {
        const res = await fetch("/api/compareFields", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selectedObjects: objs, org1, org2 }),
        });
        const data = await res.json();
        if (data.success) setFieldData(data.data);
      } catch (err) {
        console.error("Error fetching field comparison:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const currentObjectData = fieldData.find((f) => f.objectName === selectedObject);

  const filteredFields =
    currentObjectData?.fields?.filter((f) =>
      filter === "all" ? true : filter === "different" ? f.diff : !f.diff
    ) || [];

  return (
    <div className="p-6 space-y-8 overflow-y-auto max-h-screen bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-semibold text-center text-blue-700">
        Compare Fields — {org1Name} vs {org2Name}
      </h2>

      {loading ? (
        <div className="text-center text-gray-600 mt-10">Loading field data...</div>
      ) : (
        <>
          {/* Object Dropdown */}
          <div className="flex justify-center mb-4">
            <select
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              value={selectedObject}
              onChange={(e) => setSelectedObject(e.target.value)}
            >
              <option value="">Select an Object</option>
              {selectedObjects.map((obj) => (
                <option key={obj} value={obj}>
                  {obj}
                </option>
              ))}
            </select>
          </div>

          {/* Filter options */}
          <div className="flex justify-center gap-6 mb-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="filter"
                checked={filter === "all"}
                onChange={() => setFilter("all")}
              />
              All Fields
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="filter"
                checked={filter === "different"}
                onChange={() => setFilter("different")}
              />
              Only Different
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="filter"
                checked={filter === "same"}
                onChange={() => setFilter("same")}
              />
              Only Matching
            </label>
          </div>

          {/* Fields table */}
          {selectedObject ? (
            <div className="overflow-auto max-h-[70vh] border border-gray-200 rounded-lg shadow bg-white">
              <table className="min-w-full text-sm border-collapse">
                <thead className="bg-blue-100 sticky top-0 z-10">
                  <tr>
                    <th className="border p-2 text-left">Field Name</th>
                    <th className="border p-2 text-left">{org1Name} Type</th>
                    <th className="border p-2 text-left">{org2Name} Type</th>
                    <th className="border p-2 text-left">{org1Name} Length</th>
                    <th className="border p-2 text-left">{org2Name} Length</th>
                    <th className="border p-2 text-left">{org1Name} Required</th>
                    <th className="border p-2 text-left">{org2Name} Required</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFields.map((f, idx) => (
                    <tr
                      key={idx}
                      className={`${
                        f.diff ? "bg-red-50" : "bg-green-50"
                      } hover:bg-gray-100`}
                    >
                      <td className="border p-2 font-medium">{f.fieldName}</td>
                      <td className="border p-2">{f.type1 ?? "null"}</td>
                      <td className="border p-2">{f.type2 ?? "null"}</td>
                      <td className="border p-2">{f.length1 ?? "null"}</td>
                      <td className="border p-2">{f.length2 ?? "null"}</td>
                      <td className="border p-2">{f.required1 ? "Yes" : "No"}</td>
                      <td className="border p-2">{f.required2 ? "Yes" : "No"}</td>
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
