'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState("extract"); // "extract" | "compare"

  // Common state for org1
  const [username1, setUsername1] = useState("");
  const [password1, setPassword1] = useState("");
  const [token1, setToken1] = useState("");
  const [isSandbox1, setIsSandbox1] = useState(false);

  // Org2 for comparison
  const [username2, setUsername2] = useState("");
  const [password2, setPassword2] = useState("");
  const [token2, setToken2] = useState("");
  const [isSandbox2, setIsSandbox2] = useState(false);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // --- Extract Metadata Login ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username1, password: password1, token: token1, isSandbox: isSandbox1 }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      sessionStorage.setItem("accessToken", data.accessToken);
      sessionStorage.setItem("instanceUrl", data.instanceUrl);
      sessionStorage.setItem("username", data.username);
      router.push("/dashboard");
    } else {
      setMessage("Login failed: " + data.error);
    }
  };

  // --- Compare Metadata Login ---
  const handleCompareLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const [res1, res2] = await Promise.all([
        fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username1, password: password1, token: token1, isSandbox: isSandbox1 }),
        }),
        fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username2, password: password2, token: token2, isSandbox: isSandbox2 }),
        }),
      ]);

      const data1 = await res1.json();
      const data2 = await res2.json();

      if (data1.success && data2.success) {
        sessionStorage.setItem("org1_accessToken", data1.accessToken);
        sessionStorage.setItem("org1_instanceUrl", data1.instanceUrl);
        sessionStorage.setItem("org1_username", username1);
        sessionStorage.setItem("org2_accessToken", data2.accessToken);
        sessionStorage.setItem("org2_instanceUrl", data2.instanceUrl);
        sessionStorage.setItem("org2_username", username2);
        
        router.push("/compare");
      } else {
        setMessage("Login failed for one or both orgs.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error connecting to Salesforce orgs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-2xl border border-gray-200">
        <div className="flex justify-center mb-6">
          <button
            className={`px-6 py-2 font-semibold rounded-t-lg ${
              activeTab === "extract"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => setActiveTab("extract")}
          >
            Extract Metadata
          </button>
          <button
            className={`px-6 py-2 font-semibold rounded-t-lg ${
              activeTab === "compare"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => setActiveTab("compare")}
          >
            Compare Orgs
          </button>
        </div>

        {/* --- Extract Metadata Form --- */}
        {activeTab === "extract" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <h2 className="text-xl font-semibold text-center text-gray-800 mb-2">
              🔐 Connect to Salesforce
            </h2>

            <input
              type="text"
              placeholder="Username"
              className="input w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={username1}
              onChange={(e) => setUsername1(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="input w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={password1}
              onChange={(e) => setPassword1(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Security Token (optional)"
              className="input w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={token1}
              onChange={(e) => setToken1(e.target.value)}
            />
            <label className="flex items-center space-x-2 text-gray-700 text-sm">
              <input
                type="checkbox"
                checked={isSandbox1}
                onChange={(e) => setIsSandbox1(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span>Use Sandbox</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 mt-2 rounded-lg font-medium transition-colors ${
                loading
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow"
              }`}
            >
              {loading ? "Connecting..." : "Connect"}
            </button>
          </form>
        )}

        {/* --- Compare Orgs Form --- */}
        {activeTab === "compare" && (
          <form onSubmit={handleCompareLogin} className="space-y-4">
            <h2 className="text-xl font-semibold text-center text-gray-800 mb-2">
              🔄 Compare Metadata Between Two Orgs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Org 1 */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h3 className="text-center font-semibold mb-2 text-blue-700">
                  Org 1
                </h3>
                <input
                  type="text"
                  placeholder="Username"
                  className="w-full mb-2 px-3 py-2 border rounded-lg"
                  value={username1}
                  onChange={(e) => setUsername1(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full mb-2 px-3 py-2 border rounded-lg"
                  value={password1}
                  onChange={(e) => setPassword1(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Security Token"
                  className="w-full mb-2 px-3 py-2 border rounded-lg"
                  value={token1}
                  onChange={(e) => setToken1(e.target.value)}
                />
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={isSandbox1}
                    onChange={(e) => setIsSandbox1(e.target.checked)}
                    className="mr-2"
                  />
                  Sandbox
                </label>
              </div>

              {/* Org 2 */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h3 className="text-center font-semibold mb-2 text-blue-700">
                  Org 2
                </h3>
                <input
                  type="text"
                  placeholder="Username"
                  className="w-full mb-2 px-3 py-2 border rounded-lg"
                  value={username2}
                  onChange={(e) => setUsername2(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full mb-2 px-3 py-2 border rounded-lg"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Security Token"
                  className="w-full mb-2 px-3 py-2 border rounded-lg"
                  value={token2}
                  onChange={(e) => setToken2(e.target.value)}
                />
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={isSandbox2}
                    onChange={(e) => setIsSandbox2(e.target.checked)}
                    className="mr-2"
                  />
                  Sandbox
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 mt-2 rounded-lg font-medium transition-colors ${
                loading
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow"
              }`}
            >
              {loading ? "Connecting..." : "Connect Both & Compare"}
            </button>
          </form>
        )}

        {message && (
          <p className="text-red-500 text-center mt-4 text-sm">{message}</p>
        )}
      </div>

      <footer className="mt-8 text-gray-500 text-xs">
        © {new Date().getFullYear()} Salesforce Metadata Tool
      </footer>
    </div>
  );
}
