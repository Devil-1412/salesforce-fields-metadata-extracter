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
      sessionStorage.setItem("accessToken", data.accessToken);
      sessionStorage.setItem("instanceUrl", data.instanceUrl);
      router.push("/dashboard");
    } else {
      setMessage("Login failed: " + data.error);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "100px" }}>
      <h2>🔐 Connect to Salesforce</h2>
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", width: "300px", gap: "10px" }}>
        <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <input placeholder="Security Token (optional)" value={token} onChange={(e) => setToken(e.target.value)} />
        <label>
          <input type="checkbox" checked={isSandbox} onChange={(e) => setIsSandbox(e.target.checked)} /> Use Sandbox
        </label>
        <button type="submit" disabled={loading}>{loading ? "Connecting..." : "Connect"}</button>
      </form>
      {message && <p style={{ color: "red", marginTop: "10px" }}>{message}</p>}
    </div>
  );
}
