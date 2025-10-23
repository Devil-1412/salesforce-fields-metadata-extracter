'use client';  // MUST be first line
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MetadataPage() {
  const router = useRouter();
  const [metadata, setMetadata] = useState(["label","type","length","required"]);
  const [fieldsData, setFieldsData] = useState({});
  const [selectedObject, setSelectedObject] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedObjects, setSelectedObjects] = useState([]);
  const [token, setToken] = useState("");
  const [instanceUrl, setInstanceUrl] = useState("");

  // Only run in browser
  useEffect(() => {
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
    setMetadata(prev => prev.includes(meta) ? prev.filter(m => m !== meta) : [...prev, meta]);
  };

  const exportToCSV = () => {
    const rows = [];
    const header = ["Object", "Field", ...metadata];
    rows.push(header.join(","));

    for (const [obj, fields] of Object.entries(fieldsData)) {
      for (const f of fields) {
        const row = [obj, f.name];
        metadata.forEach(m => {
          if (m === "label") row.push(f.label);
          else if (m === "type") row.push(f.type);
          else if (m === "length") row.push(f.length ?? "");
          else if (m === "required") row.push(f.required ? "Yes" : "No");
          else if (m === "picklistValues") row.push((f.picklistValues || []).join(";"));
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

  if (loading) return <p>Loading metadata...</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "20px" }}>
      <h2>📝 Field Metadata Viewer</h2>
      <div style={{ display: "flex", gap: "20px" }}>
        {/* Left: Metadata checkboxes */}
        <div>
          <h4>Show Metadata:</h4>
          {["label","type","length","required","picklistValues"].map(m => (
            <div key={m}>
              <label>
                <input
                  type="checkbox"
                  checked={metadata.includes(m)}
                  onChange={() => toggleMetadata(m)}
                /> {m}
              </label>
            </div>
          ))}
        </div>

        {/* Right: Fields table */}
        <div style={{ overflow: "auto", flex: 1, border: "1px solid #ccc", maxHeight: "500px" }}>
          <table style={{ borderCollapse: "collapse", minWidth: "800px" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #ccc", padding: "4px" }}>Field Name</th>
                {metadata.map(m => <th key={m} style={{ border: "1px solid #ccc", padding: "4px" }}>{m}</th>)}
              </tr>
            </thead>
            <tbody>
              {(fieldsData[selectedObject] || []).map(f => (
                <tr key={f.name}>
                  <td style={{ border: "1px solid #ccc", padding: "4px" }}>{f.name}</td>
                  {metadata.map(m => <td key={m} style={{ border: "1px solid #ccc", padding: "4px" }}>
                    {m === "label" ? f.label :
                     m === "type" ? f.type :
                     m === "length" ? f.length :
                     m === "required" ? (f.required ? "Yes" : "No") :
                     m === "picklistValues" ? f.picklistValues.join(";") : ""}
                  </td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dropdown + Export button */}
      <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "20px" }}>
        <select value={selectedObject} onChange={e => setSelectedObject(e.target.value)}>
          {selectedObjects.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <button onClick={exportToCSV}>Export CSV</button>
      </div>
    </div>
  );
}

