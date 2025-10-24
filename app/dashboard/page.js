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
    if (typeof window !== "undefined") {
      const t = sessionStorage.getItem("accessToken");
      const url = sessionStorage.getItem("instanceUrl");
    }
    if (!t || !url) return router.push("/");
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
    setSelected((prev) =>
      prev.includes(obj) ? prev.filter((o) => o !== obj) : [...prev, obj]
    );
  };

  const handleExtract = () => {
    if (selected.length === 0) return alert("Select at least one object!");
    if (typeof window !== "undefined") {
      sessionStorage.setItem("selectedObjects", JSON.stringify(selected));
    }
    router.push("/metadata");
  };

  const filteredObjects = objects.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col items-center p-6">
      <div className="w-full max-w-3xl bg-white shadow-lg rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">
          🧩 Salesforce Object Selector
        </h2>

        <div className="flex justify-between items-center mb-4">
          <input
            type="text"
            placeholder="Search objects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40 text-gray-500">
            <span className="animate-pulse">Loading objects...</span>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto bg-gray-50">
            {filteredObjects.length > 0 ? (
              filteredObjects.map((o) => (
                <div
                  key={o.name}
                  className="flex items-center justify-between px-3 py-2 hover:bg-blue-50 rounded-lg transition"
                >
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected.includes(o.name)}
                      onChange={() => handleCheck(o.name)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700 font-medium">
                      {o.label}
                    </span>
                    <span className="text-sm text-gray-500">({o.name})</span>
                  </label>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">No objects found.</p>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <button
            onClick={handleExtract}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md transition"
          >
            Extract Metadata
          </button>
        </div>
      </div>
    </div>
  );
}
