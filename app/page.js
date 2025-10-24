'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [isSandbox, setIsSandbox] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, token, isSandbox }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("accessToken", data.accessToken);
        sessionStorage.setItem("instanceUrl", data.instanceUrl);
      }
      router.push("/dashboard");
    } else {
      setMessage("Login failed: " + data.error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md border border-gray-200">
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
          🔐 Connect to Salesforce
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Username"
              className="input w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              className="input w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Security Token (optional)"
              className="input w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>

          <label className="flex items-center space-x-2 text-gray-700 text-sm">
            <input
              type="checkbox"
              checked={isSandbox}
              onChange={(e) => setIsSandbox(e.target.checked)}
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

        {message && (
          <p className="text-red-500 text-center mt-4 text-sm">{message}</p>
        )}
      </div>

      <footer className="mt-8 text-gray-500 text-xs">
        © {new Date().getFullYear()} Salesforce Metadata Extractor
      </footer>
    </div>
  );
}
