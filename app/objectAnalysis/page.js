'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function Dashboard() {
  const router = useRouter();
  const [orgs, setOrgs] = useState([]);
  const [objects, setObjects] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [instanceUrl, setInstanceUrl] = useState("");
  const [counts, setCounts] = useState({});


  // 1️⃣ Load from sessionStorage
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

  // 2️⃣ Run API call *only after* both are set
  useEffect(() => {
    if (!token || !instanceUrl) return; // wait until available

    const fetchObjects = async () => {
      try {
        const res = await fetch("/api/objects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: token, instanceUrl }),
        });
        const data = await res.json();
        if (data.success) setObjects(data.object);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchObjects();
  }, [token, instanceUrl]); // 👈 runs when both are loaded


  const handleCheck = (obj) => {
    setSelected((prev) =>
      prev.includes(obj) ? prev.filter((o) => o !== obj) : [...prev, obj]
    );
  };

  const fetchRecordCount = async (objectName) => {
    const instanceUrl = sessionStorage.getItem("instanceUrl");
    const accessToken = sessionStorage.getItem("accessToken");

    const res = await fetch("/api/getRecordCount", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instanceUrl, accessToken, objectName }),
    });

    const data = await res.json();
    setCounts((prev) => ({ ...prev, [objectName]: data.count ?? "Error" }));
  };

  const handleExtract = () => {
    if (selected.length === 0) return alert("Select at least one object!");
    sessionStorage.setItem("selectedObjects", JSON.stringify(selected));
    router.push("/metadata");
  };

  const filteredObjects = objects.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.label.toLowerCase().includes(search.toLowerCase())
  );

  // if (!token || !instanceUrl) {
  //   return (
  //     <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-6">
  //       <div className="max-w-md bg-white shadow-lg rounded-2xl p-8 border border-gray-200">
  //         <h2 className="text-2xl font-bold text-gray-800 mb-4">
  //           🚀 Connect Your Salesforce Organization
  //         </h2>
  //         <p className="text-gray-600 mb-6">
  //           You haven’t connected a Salesforce org yet. Please go to your profile to add one.
  //         </p>
  //         <button
  //           onClick={() => router.push("/profile")}
  //           className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-md transition"
  //         >
  //           Go to Profile
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col items-center p-6">
      <div className="w-full max-w-5xl bg-white shadow-lg rounded-2xl p-8">
        <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-8 px-5 rounded-3xl shadow-lg mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-1">
                Salesforce Object Analysis
              </h1>
              <p className="text-blue-100 text-sm">
                Analyze objects, fields, and automation in your Salesforce org.
              </p>
            </div>

            <div className="mt-4 md:mt-0 text-right">
              <label className="text-sm text-blue-100 block mb-1">
                Connected Instance:
              </label>

              <select
                className="bg-white text-blue-700 font-semibold rounded-lg px-3 py-1 shadow-sm border border-blue-200 focus:ring-2 focus:ring-blue-400 outline-none cursor-pointer"
                value={instanceUrl || ""}
                onChange={(e) => {
                  const selectedOrg = orgs.find((o) => o.instanceUrl === e.target.value);
                  if (selectedOrg) {
                    sessionStorage.setItem("accessToken", selectedOrg.accessToken);
                    sessionStorage.setItem("instanceUrl", selectedOrg.instanceUrl);
                    setToken(selectedOrg.accessToken);
                    setInstanceUrl(selectedOrg.instanceUrl);
                    toast.success(`Switched to ${selectedOrg.orgName != "None" ? selectedOrg.orgName : "Selected Org"}`);
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
          <div className="flex justify-center items-center h-48 text-gray-500">
            <span className="animate-pulse">Loading objects...</span>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg p-4 max-h-[600px] overflow-y-auto bg-gray-50">
            {filteredObjects.length > 0 ? (
              <table className="min-w-full text-left border-collapse">
                <thead className="bg-blue-100 sticky top-0">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 font-semibold">Select</th>
                    <th className="border border-gray-300 px-4 py-2 font-semibold">ID Prefix</th>
                    <th className="border border-gray-300 px-4 py-2 font-semibold">API Name</th>
                    <th className="border border-gray-300 px-4 py-2 font-semibold">Object Label</th>
                    <th className="border border-gray-300 px-4 py-2 font-semibold">Records Count</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredObjects.map((o) => (
                    <tr key={o.name} className="hover:bg-blue-50 transition">
                      <td className="border border-gray-200 px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selected.includes(o.name)}
                          onChange={() => handleCheck(o.name)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-gray-500">
                        {o.keyPrefix || "-"}
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-gray-700 font-medium">
                        {o.label}
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-gray-500">
                        {o.name}
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-gray-500">
                        <div className="flex items-center justify-between">

                          <button
                            onClick={() => fetchRecordCount(o.name)}
                            className="ml-3 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition"
                          >
                            {counts[o.name] !== undefined ? counts[o.name] : "Get Count"}
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
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
