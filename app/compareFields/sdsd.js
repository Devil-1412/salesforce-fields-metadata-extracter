"use client";
import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";

export default function CompareFields() {
    const [selectedObjects, setSelectedObjects] = useState([]);
    const [selectedObject, setSelectedObject] = useState("");
    const [fieldData, setFieldData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [org1, setOrg1] = useState({});
    const [org2, setOrg2] = useState({});

    useEffect(() => {
        const selectedObjects = JSON.parse(sessionStorage.getItem("selectedObjects") || "[]");
        const org1 = JSON.parse(sessionStorage.getItem("org1") || "{}");
        const org2 = JSON.parse(sessionStorage.getItem("org2") || "{}");
        setSelectedObjects(selectedObjects);
        setOrg1(org1);
        setOrg2(org2);

        // if (!org1.accessToken || !org2.accessToken) return;

        // const fetchData = async () => {
        //   try {
        //     const res = await fetch("/api/compareFields", {
        //       method: "POST",
        //       headers: { "Content-Type": "application/json" },
        //       body: JSON.stringify({ selectedObjects, org1, org2 }),
        //     });
        //     const data = await res.json();
        //     if (data.success) setFieldData(data.data);
        //   } catch (err) {
        //     console.error("Error fetching field comparison:", err);
        //   } finally {
        //     setLoading(false);
        //   }
        // };

        // fetchData();
    }, []);

    // Compare metadata from both orgs
    useEffect(() => {
        if (!org1.accessToken || !org2.accessToken || !selectedObjects.length) return;

        const fetchComparison = async () => {
            try {
                // Fetch metadata for both orgs
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
                    toast.error("Error loading fields data!");

                // Compare both orgs' field data
                const compared = selectedObjects.map((obj) => {
                    const fields1 = data1.data[obj] || [];
                    const fields2 = data2.data[obj] || [];

                    const map1 = Object.fromEntries(
                        fields1.map((f) => [f.ApiName, { type: f.type, length: f.length }])
                    );
                    const map2 = Object.fromEntries(
                        fields2.map((f) => [f.ApiName, { type: f.type, length: f.length }])
                    );

                    const allFields = new Set([...Object.keys(map1), ...Object.keys(map2)]);
                    const fields = Array.from(allFields).map((name) => {
                        const f1 = map1[name] || {};
                        const f2 = map2[name] || {};
                        const diff = f1.type !== f2.type || f1.length !== f2.length;
                        return {
                            fieldName: name,
                            type1: f1.type ?? null,
                            type2: f2.type ?? null,
                            length1: f1.length ?? null,
                            length2: f2.length ?? null,
                            diff,
                        };
                    });

                    return { objectName: obj, fields };
                });

                setFieldData(compared);
            } catch (err) {
                console.error("Comparison error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchComparison();
    }, [org1, org2, selectedObjects]);

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 text-gray-800 py-10 px-6 flex flex-col items-center">
            <div className="w-full max-w-6xl bg-white shadow-xl rounded-3xl p-8 border border-gray-200">
                {/* Page Header */}
                <h2 className="text-3xl font-extrabold text-center bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent mb-2">
                    Salesforce Field Comparison
                </h2>
                <p className="text-center text-gray-500 mb-8">
                    Compare fields between{" "}
                    <span className="font-semibold text-blue-700">
                        {org1.orgName != "None" ? org1.orgName : "Org 1"}
                    </span>{" "}
                    and{" "}
                    <span className="font-semibold text-indigo-700">
                        {org2.orgName != "None" ? org2.orgName : "Org 2"}
                    </span>
                </p>

                {loading ? (
                    <div className="text-center text-gray-600 mt-10 animate-pulse">
                        Loading field data...
                    </div>
                ) : (
                    <>
                        {/* Object Selector */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                            <select
                                className="border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 w-full md:w-auto shadow-sm"
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
                        </div>

                        {/* Filter Controls */}
                        {selectedObject && (
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

                        )}

                        {/* Table */}
                        {selectedObject ? (
                            <div className="overflow-auto border border-gray-200 rounded-2xl shadow-inner bg-white max-h-[70vh]">
                                <table className="min-w-full text-sm border-separate border-spacing-0">
                                    <thead className="sticky top-0 z-10 bg-gradient-to-r from-blue-50 to-blue-100">
                                        <tr>
                                            {/* Top header row */}
                                            <th
                                                rowSpan="2"
                                                className="p-3 text-left font-semibold text-gray-700 border-b border-gray-200"
                                            >
                                                Field Name
                                            </th>

                                            {/* Grouped headers */}
                                            <th
                                                colSpan="2"
                                                className="p-3 text-center font-semibold text-gray-700 border-b border-gray-200"
                                            >
                                                Type
                                            </th>
                                            <th
                                                colSpan="2"
                                                className="p-3 text-center font-semibold text-gray-700 border-b border-gray-200"
                                            >
                                                Length
                                            </th>
                                            <th
                                                colSpan="2"
                                                className="p-3 text-center font-semibold text-gray-700 border-b border-gray-200"
                                            >
                                                Required
                                            </th>
                                        </tr>

                                        {/* Subheader row */}
                                        <tr>
                                            <th className="p-2 text-center text-gray-600 border-b border-gray-200">
                                                {org1.orgName != "None" ? org1.orgName : "Org 1"}
                                            </th>
                                            <th className="p-2 text-center text-gray-600 border-b border-gray-200">
                                                {org2.orgName != "None" ? org2.orgName : "Org 2"}
                                            </th>
                                            <th className="p-2 text-center text-gray-600 border-b border-gray-200">
                                                {org1.orgName != "None" ? org1.orgName : "Org 1"}
                                            </th>
                                            <th className="p-2 text-center text-gray-600 border-b border-gray-200">
                                                {org2.orgName != "None" ? org2.orgName : "Org 2"}
                                            </th>
                                            <th className="p-2 text-center text-gray-600 border-b border-gray-200">
                                                {org1.orgName != "None" ? org1.orgName : "Org 1"}
                                            </th>
                                            <th className="p-2 text-center text-gray-600 border-b border-gray-200">
                                                {org2.orgName != "None" ? org2.orgName : "Org 2"}
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredFields.map((f, idx) => (
                                            <tr
                                                key={idx}
                                                className={`transition-all ${f.diff
                                                    ? "bg-red-50 hover:bg-red-100"
                                                    : "bg-white hover:bg-blue-50"
                                                    }`}
                                            >
                                                {/* Field Name */}
                                                <td className="p-3 text-gray-800 font-medium border-b border-gray-100">
                                                    {f.fieldName}
                                                </td>

                                                {/* Type */}
                                                <td className="p-3 text-center border-b border-gray-100 text-gray-600">
                                                    {f.type1 ?? "—"}
                                                </td>
                                                <td className="p-3 text-center border-b border-gray-100 text-gray-600">
                                                    {f.type2 ?? "—"}
                                                </td>

                                                {/* Length */}
                                                <td className="p-3 text-center border-b border-gray-100 text-gray-600">
                                                    {f.length1 ?? "—"}
                                                </td>
                                                <td className="p-3 text-center border-b border-gray-100 text-gray-600">
                                                    {f.length2 ?? "—"}
                                                </td>

                                                {/* Required */}
                                                <td className="p-3 text-center border-b border-gray-100 text-gray-600">
                                                    {f.required1 ? "✅" : "—"}
                                                </td>
                                                <td className="p-3 text-center border-b border-gray-100 text-gray-600">
                                                    {f.required2 ? "✅" : "—"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>


                            </div>
                        ) : (
                            <p className="text-center text-gray-500 mt-8">
                                Please select an object to view comparison.
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
