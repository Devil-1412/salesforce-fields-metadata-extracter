'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    const instanceUrl = sessionStorage.getItem("instanceUrl");

    if (!token || !instanceUrl) {
      router.push("/");
      return;
    }

    const fetchObjects = async () => {
      const res = await fetch("/api/objects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: token, instanceUrl }),
      });

      const data = await res.json();
      if (data.success) setObjects(data.objects);
      setLoading(false);
    };

    fetchObjects();
  }, [router]);

  return (
    <div style={{ padding: "40px" }}>
      <h2>📋 Salesforce Objects</h2>
      {loading ? (
        <p>Loading objects...</p>
      ) : (
        <ul>
          {objects.map((obj) => (
            <li key={obj.name}>
              <b>{obj.name}</b> - {obj.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
