'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MetadataPage() {
  const router = useRouter();

  // All metadata fields you want to extract
  const allMetadataKeys = [
    "label",
    "APIName",
    "type",
    "length",
    "precision",
    "scale",
    "digits",
    "byteLength",
    "DBOrder",
    "soapType",
    "extraTypeInfo",
    "defaultValue",
    "defaultValueFormula",
    "compoundFieldName",
    "controllerName",
    "filteredLookupInfo",
    "mask",
    "maskType",
    "referenceTo",
    "referenceTargetField",
    "relationshipName",
    "relationshipOrder",
    "aggregatable",
    "aiPredictionField",
    "autoNumber",
    "calculated",
    "cascadeDelete",
    "cascadeDeleteSpecified",
    "caseSensitive",
    "custom",
    "dataTranslationEnabled",
    "dataTranslationEnabledSpecified",
    "defaultedOnCreate",
    "dependentPicklist",
    "dependentPicklistSpecified",
    "deprecatedAndHidden",
    "displayLocationInDecimal",
    "displayLocationInDecimalSpecified",
    "encrypted",
    "encryptedSpecified",
    "externalId",
    "externalIdSpecified",
    "filterable",
    "formulaTreatNullNumberAsZero",
    "formulaTreatNullNumberAsZeroSpecified",
    "groupable",
    "highScaleNumber",
    "highScaleNumberSpecified",
    "htmlFormatted",
    "htmlFormattedSpecified",
    "idLookup",
    "nameField",
    "namePointing",
    "namePointingSpecified",
    "permissionable",
    "polymorphicForeignKey",
    "queryByDistance",
    "relationshipOrderSpecified",
    "restrictedDelete",
    "restrictedDeleteSpecified",
    "restrictedPicklist",
    "searchPrefilterable",
    "sortable",
    "sortableSpecified",
    "unique",
    "writeRequiresMasterRead",
    "writeRequiresMasterReadSpecified",
    "Salesforce Data Type",
    "MSSQL Data Type",
    "Oracle Data Type",
    "MySQL Data Type",
    "Properties",
    "Nullable",
    "Createable",
    "Updateable",
    "On Page Layout",
    "PicklistValues",
    "Category",
    "Description",
    "Help Text",
    "Formula"
  ];

  const defaultSelected = ["label", "APIName", "type", "length", "required", "PicklistValues"];

  const [metadata, setMetadata] = useState(defaultSelected);
  const [fieldsData, setFieldsData] = useState({});
  const [selectedObject, setSelectedObject] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedObjects, setSelectedObjects] = useState([]);
  const [token, setToken] = useState("");
  const [instanceUrl, setInstanceUrl] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const t = sessionStorage.getItem("accessToken");
    const url = sessionStorage.getItem("instanceUrl");
    const selObjs = JSON.parse(sessionStorage.getItem("selectedObjects") || "[]");

    if (!t || !url || selObjs.length === 0) return router.push("/");

    setToken(t);
    setInstanceUrl(url);
    setSelectedObjects(selObjs);

    const fetchFields = async () => {
      try {
        const res = await fetch("/api/fields", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: t, instanceUrl: url, objects: selObjs }),
        });
        const data = await res.json();
        if (data.success) {
          setFieldsData(data.data);
          setSelectedObject(selObjs[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, [router]);

  const toggleMetadata = (meta) => {
    setMetadata((prev) =>
      prev.includes(meta) ? prev.filter((m) => m !== meta) : [...prev, meta]
    );
  };

  const exportToCSV = () => {
    const rows = [];
    const header = ["Object", "Field", ...metadata];
    rows.push(header.join(","));

    for (const [obj, fields] of Object.entries(fieldsData)) {
      for (const f of fields) {
        const row = [obj, f.name];
        metadata.forEach((m) => {
          row.push(f[m] !== undefined ? (Array.isArray(f[m]) ? f[m].join("; ") : f[m]) : "");
        });
        rows.push(row.join(","));
      }
    }

    const csvContent = "data:text/csv;charset=utf-8," + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "metadata.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <p className="animate-pulse text-lg font-medium">Loading metadata...</p>
      </div>
    );

  // Order metadata: checked first in the order of allMetadataKeys, then unchecked if selected
  const orderedMetadata = [
    ...allMetadataKeys.filter((m) => metadata.includes(m)),
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-6 flex flex-col items-center">
      <div className="w-full max-w-[95%] bg-white shadow-lg rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-blue-700 mb-6 text-center">
          📝 Salesforce Field Metadata Viewer
        </h2>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Left: Metadata checkboxes */}
          <div className="md:w-1/4 bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-auto max-h-[800px]">
            <h4 className="text-lg font-semibold mb-3 text-gray-700">
              Show Metadata
            </h4>
            {allMetadataKeys.map((m) => (
              <div key={m} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={metadata.includes(m)}
                  onChange={() => toggleMetadata(m)}
                  className="mr-2 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label
                  className={`text-gray-700 capitalize cursor-pointer ${
                    defaultSelected.includes(m) ? "font-semibold text-blue-600" : ""
                  }`}
                >
                  {m}
                </label>
              </div>
            ))}
          </div>

          {/* Right: Fields table */}
          <div className="flex-1 border border-gray-200 rounded-lg overflow-auto max-h-[800px]">
            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-blue-100 sticky top-0">
                <tr>
                  <th className="border border-gray-300 p-2 text-left font-semibold text-gray-700">
                    Object Name
                  </th>
                  {orderedMetadata.map((m) => (
                    <th
                      key={m}
                      className="border border-gray-300 p-2 text-left font-semibold text-gray-700 capitalize"
                    >
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(fieldsData[selectedObject] || []).map((f) => (
                  <tr
                    key={selectedObject}
                    className="hover:bg-blue-50 transition border-b border-gray-100"
                  >
                    <td className="border border-gray-200 p-2 font-medium text-gray-800">
                      {selectedObject}
                    </td>
                    {orderedMetadata.map((m) => (
                      <td key={m} className="border border-gray-200 p-2 text-gray-700">
                        {f[m] === null
                          ? "null"
                          : Array.isArray(f[m])
                          ? f[m].join("; ")
                          : f[m] !== undefined
                          ? String(f[m])
                          : ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom: Object selector + export */}
        <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <select
            value={selectedObject}
            onChange={(e) => setSelectedObject(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {selectedObjects.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>

          <button
            onClick={exportToCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md transition"
          >
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}
