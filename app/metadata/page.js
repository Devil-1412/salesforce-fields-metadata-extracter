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

  // ... rest of the page code (toggleMetadata, exportToCSV, table rendering) stays the same
}
