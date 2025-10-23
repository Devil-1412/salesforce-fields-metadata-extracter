'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [objects, setObjects] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [instanceUrl, setInstanceUrl] = useState("");

  useEffect(() => {
    const t = sessionStorage.getItem("accessToken");
    const url = sessionStorage.getItem("instanceUrl");

    if (!t || !url) return router.push("/"); // redirect if not logged in

    setToken(t);
    setInstanceUrl(url);

    const fetchObjects = async () => {
      try {
        const res = await fetch("/api/objects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: t, instanceUrl: url }),
        });
        const data = await res.json();
        if (data.success) setObjects(data.objects);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchObjects();
  }, [router]);

  const handleCheck = (obj) => {
    setSelected(prev =>
      prev.includes(obj) ? prev.filter(o => o !== obj) : [...prev, obj]
    );
  };

  const handleExtract = () => {
    if (selected.length === 0) return alert("Select at least one object!");
    sessionStorage.setItem("selectedObjects", JSON.stringify(selected));
    router.push("/metadata");
  };

  const filteredObjects = objects.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "20px" }}>
      <h2>📋 Select Salesforce Objects</h2>
      <input
        type="text"
        placeholder="Search objects..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: "300px", marginBottom: "10px" }}
      />
      {loading ? <p>Loading objects...</p> : (
        <div style={{ maxHeight: "400px", overflowY: "scroll", border: "1px solid #ccc", padding: "10px" }}>
          {filteredObjects.map(o => (
            <div key={o.name}>
              <label>
                <input
                  type="checkbox"
                  checked={selected.includes(o.name)}
                  onChange={() => handleCheck(o.name)}
                />
                {o.label} ({o.name})
              </label>
            </div>
          ))}
        </div>
      )}
      <button onClick={handleExtract} style={{ marginTop: "10px" }}>Extract Metadata</button>
    </div>
  );
}
