"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import { LayoutGrid, Columns } from "lucide-react";
import SearchableDropdown from "../components/SearchableDropdown";

export default function CompareFields() {
  // Removed orgSelectedObjects and orgSelectionDrafts
  const [comparisons, setComparisons] = useState([]);
  const [activeComparisonId, setActiveComparisonId] = useState("");
  const [orgObjectsMap, setOrgObjectsMap] = useState({});
  const [fieldData, setFieldData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orgs, setOrgs] = useState([]); // Array of organizations
  const [orgsData, setOrgsData] = useState([]); // Array of data for each org
  const [availableOrgs, setAvailableOrgs] = useState([]); // All available orgs from API
  const [filter, setFilter] = useState("all");
  const [metadataOptions, setMetadataOptions] = useState([]); // dynamic keys
  const [selectedMetadata, setSelectedMetadata] = useState([]);
  const [displayMode, setDisplayMode] = useState("default"); // "default" or "separate"
  const [scrollLock, setScrollLock] = useState(false); // Scroll lock for separate tables
  const scrollContainerRef = useRef(null);
  const tableScrollRefs = useRef([]);
  const scrollHandlersRef = useRef([]);
  const verticalScrollHandlersRef = useRef([]);
  const lastScrollPositionsRef = useRef([]);
  const isSyncingRef = useRef(false);
  const validOrgs = useMemo(
    () => orgs.filter((org) => org.accessToken && org.instanceUrl),
    [orgs]
  );

  const orgObjectsToLoad = useMemo(() => {
    const map = {};
    validOrgs.forEach((org) => {
      map[org.instanceUrl] = new Set();
    });

    comparisons.forEach((cmp) => {
      if (cmp.sourceOrg && cmp.sourceObject) {
        if (!map[cmp.sourceOrg]) map[cmp.sourceOrg] = new Set();
        map[cmp.sourceOrg].add(cmp.sourceObject);
      }
      (cmp.targets || []).forEach((t) => {
        if (t.orgKey && t.objectName) {
          if (!map[t.orgKey]) map[t.orgKey] = new Set();
          map[t.orgKey].add(t.objectName);
        }
      });
    });

    // Convert Sets to Arrays
    const result = {};
    Object.keys(map).forEach((key) => {
      result[key] = Array.from(map[key]);
    });
    return result;
  }, [validOrgs, comparisons]);

  // Ensure there is always at least one comparison and active selection
  useEffect(() => {
    if (!comparisons.length) {
      const defaultComparison = {
        id: "cmp-1",
        name: "Comparison 1",
        sourceOrg: validOrgs[0]?.instanceUrl || "",
        sourceObject: "",
        targets: [],
      };
      setComparisons([defaultComparison]);
      setActiveComparisonId(defaultComparison.id);
      return;
    }

    if (!comparisons.some((cmp) => cmp.id === activeComparisonId)) {
      setActiveComparisonId(comparisons[0].id);
    }
  }, [comparisons, activeComparisonId, validOrgs]);

  // Fetch available objects for each connected org
  useEffect(() => {
    if (validOrgs.length === 0) {
      setOrgObjectsMap({});
      return;
    }

    let isCancelled = false;

    const fetchOrgObjects = async () => {
      const results = await Promise.all(
        validOrgs.map(async (org) => {
          try {
            const res = await fetch("/api/objects", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                accessToken: org.accessToken,
                instanceUrl: org.instanceUrl,
              }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
              throw new Error(data.error || "Failed to load objects");
            }
            return { key: org.instanceUrl, list: data.object || [] };
          } catch (error) {
            console.error("Error fetching objects for org:", org.instanceUrl, error);
            toast.error(
              `Failed to load objects for ${org.orgName !== "None" ? org.orgName : org.instanceUrl
              }`
            );
            return { key: org.instanceUrl, list: [] };
          }
        })
      );

      if (isCancelled) return;

      const map = results.reduce((acc, { key, list }) => {
        acc[key] = list;
        return acc;
      }, {});
      setOrgObjectsMap(map);
    };

    fetchOrgObjects();

    return () => {
      isCancelled = true;
    };
  }, [validOrgs]);



  // Keep comparisons aligned with available orgs
  useEffect(() => {
    if (!comparisons.length) return;

    setComparisons((prev) => {
      let changed = false;
      const validOrgKeys = new Set(validOrgs.map((org) => org.instanceUrl));
      const orgNameMap = Object.fromEntries(
        validOrgs.map((org, idx) => [
          org.instanceUrl,
          org.orgName !== "None" ? org.orgName : `Org ${idx + 1}`,
        ])
      );

      const updated = prev.map((comparison, cmpIdx) => {
        let nextComparison = { ...comparison };

        // Source org fallback
        if (!nextComparison.sourceOrg || !validOrgKeys.has(nextComparison.sourceOrg)) {
          nextComparison.sourceOrg = validOrgs[0]?.instanceUrl || "";
          nextComparison.sourceObject = "";
          changed = true;
        }

        // Check if source object is valid in the new org list is tricky without selected objects state
        // We rely on the user to select valid objects from the dropdown. 
        // If the org changes, we might want to clear the object if it doesn't exist, 
        // but checking existence requires looking at orgObjectsMap.
        const sourceOptions = orgObjectsMap[nextComparison.sourceOrg] || [];
        if (nextComparison.sourceObject && sourceOptions.length > 0) {
          const exists = sourceOptions.some(o => o.name === nextComparison.sourceObject);
          if (!exists) {
            nextComparison.sourceObject = "";
            changed = true;
          }
        }


        const filteredTargets = (nextComparison.targets || []).filter(
          (target) =>
            target.orgKey &&
            validOrgKeys.has(target.orgKey) &&
            target.orgKey !== nextComparison.sourceOrg
        );

        const normalizedTargets = filteredTargets.map((target) => {
          const targetOptions = orgObjectsMap[target.orgKey] || [];
          let objectName = target.objectName;

          if (objectName && targetOptions.length > 0) {
            const exists = targetOptions.some(o => o.name === objectName);
            if (!exists) {
              objectName = "";
            }
          }

          return {
            orgKey: target.orgKey,
            objectName,
            orgLabel: orgNameMap[target.orgKey] || target.orgKey,
          };
        });

        if (normalizedTargets.length !== filteredTargets.length) {
          changed = true;
        }
        // Also check if any target object name changed (was cleared)
        if (JSON.stringify(normalizedTargets) !== JSON.stringify(filteredTargets)) {
          changed = true;
        }


        nextComparison.targets = normalizedTargets;

        const nameFallback = `Comparison ${cmpIdx + 1}`;
        if (!nextComparison.name) {
          nextComparison.name = nameFallback;
          changed = true;
        }

        if (
          nextComparison.sourceOrg !== comparison.sourceOrg ||
          nextComparison.sourceObject !== comparison.sourceObject ||
          nextComparison.name !== comparison.name ||
          JSON.stringify(nextComparison.targets) !== JSON.stringify(comparison.targets)
        ) {
          changed = true;
        }

        return nextComparison;
      });

      if (!changed) return prev;
      return updated;
    });
  }, [validOrgs, orgObjectsMap]);

  // Load available orgs from API
  useEffect(() => {
    const fetchOrgs = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch("/api/salesforceLogin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (data.success) {

          setAvailableOrgs(data.data);
        }
      } catch (err) {
        console.error("Error fetching orgs:", err);
      }
    };
    fetchOrgs();
  }, []);

  // Load orgs and selected objects from sessionStorage (default to 2 orgs)
  useEffect(() => {
    // Initialize with default 2 orgs if available
    const initialOrgs = [];

    // Ensure at least 2 orgs (add placeholder if needed)
    if (initialOrgs.length === 0) {
      initialOrgs.push({ orgName: "Org 1", accessToken: null, instanceUrl: null });
      initialOrgs.push({ orgName: "Org 2", accessToken: null, instanceUrl: null });
    } else if (initialOrgs.length === 1) {
      initialOrgs.push({ orgName: "Org 2", accessToken: null, instanceUrl: null });
    }

    setOrgs(initialOrgs);
  }, []);
  // Fetch fields metadata for all orgs
  useEffect(() => {
    if (validOrgs.length === 0) {
      setLoading(false);
      setOrgsData([]);
      setFieldData([]);
      return;
    }

    const hasSelection = validOrgs.some(
      (org) => (orgObjectsToLoad[org.instanceUrl] || []).length > 0
    );

    if (!hasSelection) {
      setLoading(false);
      setOrgsData([]);
      setFieldData([]);
      return;
    }

    const fetchFieldsData = async () => {
      try {
        setLoading(true);
        const responses = await Promise.all(
          validOrgs.map(async (org) => {
            const objects = orgObjectsToLoad[org.instanceUrl] || [];
            if (!objects.length) {
              return { success: true, data: {} };
            }
            const res = await fetch("/api/fields", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                accessToken: org.accessToken,
                instanceUrl: org.instanceUrl,
                objects,
              }),
            });
            const data = await res.json();
            return data;
          })
        );

        const hasError = responses.some((data) => !data.success);
        if (hasError) {
          toast.error("Error fetching fields from some organizations");
        }

        setOrgsData(responses.map((data) => data.data || {}));

        const firstSuccessData = responses.find((data) => data.success && data.data);
        if (firstSuccessData) {
          const sampleObj = Object.values(firstSuccessData.data)?.[0]?.[0] || {};
          const dynamicKeys = Object.keys(sampleObj);
          setMetadataOptions(dynamicKeys);
          setSelectedMetadata((prev) => (prev.length ? prev : dynamicKeys.slice(0, 4)));
        }
      } catch (err) {
        toast.error("Comparison error: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchFieldsData();
  }, [validOrgs, orgObjectsToLoad]);

  const orgDataMap = useMemo(() => {
    const map = {};
    validOrgs.forEach((org, idx) => {
      map[org.instanceUrl] = orgsData[idx] || {};
    });
    return map;
  }, [validOrgs, orgsData]);

  useEffect(() => {
    if (!comparisons.length) {
      setFieldData([]);
      return;
    }

    const orgLabelMap = Object.fromEntries(
      validOrgs.map((org, idx) => [
        org.instanceUrl,
        org.orgName !== "None" ? org.orgName : `Org ${idx + 1}`,
      ])
    );

    const comparisonData = comparisons.map((comparison) => {
      const participants = [];

      if (comparison.sourceOrg && comparison.sourceObject) {
        participants.push({
          orgKey: comparison.sourceOrg,
          objectName: comparison.sourceObject,
          orgLabel: orgLabelMap[comparison.sourceOrg] || comparison.sourceOrg,
          role: "source",
        });
      }

      (comparison.targets || []).forEach((target) => {
        if (target.orgKey && target.objectName) {
          participants.push({
            orgKey: target.orgKey,
            objectName: target.objectName,
            orgLabel: orgLabelMap[target.orgKey] || target.orgKey,
            role: "target",
          });
        }
      });

      const fieldMaps = participants.map(({ orgKey, objectName }) => {
        if (!objectName) return {};
        const objectFields = orgDataMap[orgKey]?.[objectName] || [];
        return Object.fromEntries(objectFields.map((f) => [f.ApiName, f]));
      });

      const allFields = new Set();
      fieldMaps.forEach((map) => {
        Object.keys(map).forEach((key) => allFields.add(key));
      });

      const fields = Array.from(allFields).map((fieldName) => {
        const fieldDataArray = fieldMaps.map((map) => map[fieldName] || {});
        const differences = selectedMetadata.reduce((acc, key) => {
          const values = fieldDataArray.map((f) =>
            f[key] === undefined ? null : f[key]
          );
          const firstValue = values[0];
          const allSame = values.every((val) => val === firstValue);
          if (!allSame) acc.push(key);
          return acc;
        }, []);

        return {
          fieldName,
          fieldDataArray,
          diff: differences.length > 0,
          diffKeys: differences,
        };
      });

      return {
        comparisonId: comparison.id,
        comparisonName: comparison.name,
        participants,
        fields,
      };
    });

    setFieldData(comparisonData);
  }, [comparisons, orgDataMap, selectedMetadata, validOrgs]);



  const activeComparison = fieldData.find(
    (f) => f.comparisonId === activeComparisonId
  );
  const activeParticipants = activeComparison?.participants || [];

  const filteredFields = useMemo(() => {
    if (!activeComparison) return [];
    return activeComparison.fields.filter((f) =>
      filter === "all" ? true : filter === "different" ? f.diff : !f.diff
    );
  }, [filter, activeComparison]);

  const matchingCount = activeComparison
    ? activeComparison.fields.filter((f) => !f.diff).length
    : 0;
  const differentCount = activeComparison
    ? activeComparison.fields.filter((f) => f.diff).length
    : 0;
  const totalCount = activeComparison ? activeComparison.fields.length : 0;
  const diffPercent =
    totalCount > 0 ? Math.round((differentCount / totalCount) * 100) : 0;
  const hasActiveData = !!activeComparison && activeParticipants.length >= 2;

  const toggleMetadata = (key) => {
    setSelectedMetadata((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };


  const handleComparisonChange = (comparisonId, updater) => {
    setComparisons((prev) =>
      prev.map((comparison) =>
        comparison.id === comparisonId
          ? typeof updater === "function"
            ? updater(comparison)
            : { ...comparison, ...updater }
          : comparison
      )
    );
  };

  const addComparison = () => {
    if (!validOrgs.length) {
      toast.error("Connect at least one org before adding comparisons");
      return;
    }
    const newComparison = {
      id: `cmp-${Date.now()}`,
      name: `Comparison ${comparisons.length + 1 || 1}`,
      sourceOrg: validOrgs[0]?.instanceUrl || "",
      sourceObject: "",
      targets: [],
    };
    setComparisons((prev) => {
      const comparison = {
        ...newComparison,
        name: `Comparison ${prev.length + 1}`,
      };
      return [...prev, comparison];
    });
    setActiveComparisonId(newComparison.id);
  };

  const removeComparison = (comparisonId) => {
    setComparisons((prev) => {
      if (prev.length <= 1) {
        toast.error("At least one comparison is required");
        return prev;
      }
      const filtered = prev.filter((cmp) => cmp.id !== comparisonId);
      if (filtered.length && activeComparisonId === comparisonId) {
        setActiveComparisonId(filtered[0].id);
      }
      return filtered;
    });
  };

  const addComparisonTarget = (comparisonId) => {
    handleComparisonChange(comparisonId, (comparison) => {
      const availableTargets = validOrgs.filter(
        (org) => org.instanceUrl !== comparison.sourceOrg
      );
      if (!availableTargets.length) {
        toast.error("No organizations available for target mapping");
        return comparison;
      }
      const nextOrgKey = availableTargets[0].instanceUrl;
      const target = {
        orgKey: nextOrgKey,
        objectName: "",
      };
      return {
        ...comparison,
        targets: [...(comparison.targets || []), target],
      };
    });
  };

  const removeComparisonTarget = (comparisonId, targetIndex) => {
    handleComparisonChange(comparisonId, (comparison) => {
      const targets = [...(comparison.targets || [])];
      targets.splice(targetIndex, 1);
      return { ...comparison, targets };
    });
  };

  const handleComparisonSourceOrgChange = (comparisonId, orgKey) => {
    handleComparisonChange(comparisonId, (comparison) => {
      if (comparison.sourceOrg === orgKey) return comparison;
      const nextSource = "";
      const filteredTargets = (comparison.targets || []).filter(
        (target) => target.orgKey !== orgKey
      );
      return {
        ...comparison,
        sourceOrg: orgKey,
        sourceObject: nextSource,
        targets: filteredTargets,
      };
    });
  };

  const handleComparisonSourceObjectChange = (comparisonId, objectName) => {
    handleComparisonChange(comparisonId, { sourceObject: objectName });
  };

  const handleComparisonTargetOrgChange = (comparisonId, targetIndex, orgKey) => {
    handleComparisonChange(comparisonId, (comparison) => {
      const targets = [...(comparison.targets || [])];
      targets[targetIndex] = {
        orgKey,
        objectName: "",
      };
      return { ...comparison, targets };
    });
  };

  const handleComparisonTargetObjectChange = (
    comparisonId,
    targetIndex,
    objectName
  ) => {
    handleComparisonChange(comparisonId, (comparison) => {
      const targets = [...(comparison.targets || [])];
      if (!targets[targetIndex]) return comparison;
      targets[targetIndex] = {
        ...targets[targetIndex],
        objectName,
      };
      return { ...comparison, targets };
    });
  };

  const handleComparisonNameChange = (comparisonId, name) => {
    handleComparisonChange(comparisonId, { name });
  };

  // Add a new org
  const addOrg = () => {
    const newOrg = {
      orgName: `Org ${orgs.length + 1}`,
      accessToken: null,
      instanceUrl: null
    };
    setOrgs([...orgs, newOrg]);
  };

  // Remove an org (minimum 2 orgs required)
  const removeOrg = (index) => {
    if (orgs.length <= 2) {
      toast.error("At least 2 organizations are required");
      return;
    }
    setOrgs(orgs.filter((_, i) => i !== index));
    // Clear orgsData to trigger re-fetch
    setOrgsData([]);
  };

  // Update an org
  const updateOrg = (index, org) => {
    const updatedOrgs = [...orgs];
    updatedOrgs[index] = org;
    setOrgs(updatedOrgs);
  };

  // Synchronize scrolling for separate tables (horizontal and vertical when scroll lock is enabled)
  useEffect(() => {
    if (displayMode !== "separate" || activeParticipants.length === 0) {
      scrollHandlersRef.current = [];
      verticalScrollHandlersRef.current = [];
      return;
    }

    const setupScrollSync = () => {
      // Clear existing horizontal handlers
      tableScrollRefs.current.forEach((ref, idx) => {
        if (ref && scrollHandlersRef.current[idx]) {
          ref.removeEventListener("scroll", scrollHandlersRef.current[idx]);
        }
      });

      // Clear existing vertical handlers
      tableScrollRefs.current.forEach((ref, idx) => {
        if (ref && verticalScrollHandlersRef.current[idx]) {
          ref.removeEventListener("scroll", verticalScrollHandlersRef.current[idx]);
        }
      });

      scrollHandlersRef.current = [];
      verticalScrollHandlersRef.current = [];

      // Initialize last scroll positions
      lastScrollPositionsRef.current = tableScrollRefs.current.map(ref =>
        ref ? { left: ref.scrollLeft, top: ref.scrollTop } : { left: 0, top: 0 }
      );

      // Create combined scroll handlers
      tableScrollRefs.current.forEach((ref, sourceIdx) => {
        if (!ref) return;

        const combinedHandler = (e) => {
          // Prevent infinite loops
          if (isSyncingRef.current) return;

          const currentScrollLeft = e.target.scrollLeft;
          const currentScrollTop = e.target.scrollTop;
          const lastPos = lastScrollPositionsRef.current[sourceIdx];

          // Sync horizontal scroll (always enabled)
          if (currentScrollLeft !== lastPos.left) {
            isSyncingRef.current = true;
            tableScrollRefs.current.forEach((otherRef, otherIdx) => {
              if (otherRef && otherIdx !== sourceIdx) {
                otherRef.scrollLeft = currentScrollLeft;
                lastScrollPositionsRef.current[otherIdx].left = currentScrollLeft;
              }
            });
            lastPos.left = currentScrollLeft;
            isSyncingRef.current = false;
          }

          // Sync vertical scroll (only when scroll lock is enabled)
          if (scrollLock && currentScrollTop !== lastPos.top) {
            isSyncingRef.current = true;
            tableScrollRefs.current.forEach((otherRef, otherIdx) => {
              if (otherRef && otherIdx !== sourceIdx) {
                otherRef.scrollTop = currentScrollTop;
                lastScrollPositionsRef.current[otherIdx].top = currentScrollTop;
              }
            });
            lastPos.top = currentScrollTop;
            isSyncingRef.current = false;
          }
        };

        scrollHandlersRef.current[sourceIdx] = combinedHandler;
        ref.addEventListener("scroll", combinedHandler);
      });
    };

    // Setup after a brief delay to ensure refs are set
    const timeoutId = setTimeout(setupScrollSync, 150);

    return () => {
      clearTimeout(timeoutId);
      tableScrollRefs.current.forEach((ref, idx) => {
        if (ref && scrollHandlersRef.current[idx]) {
          ref.removeEventListener("scroll", scrollHandlersRef.current[idx]);
        }
        if (ref && verticalScrollHandlersRef.current[idx]) {
          ref.removeEventListener("scroll", verticalScrollHandlersRef.current[idx]);
        }
      });
      scrollHandlersRef.current = [];
      verticalScrollHandlersRef.current = [];
    };
  }, [displayMode, activeParticipants.length, filteredFields.length, scrollLock]);



  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        /* Custom scrollbar styles - hidden by default, visible on hover */
        .scrollbar-hide {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Scrollbar visible on hover */
        .scrollbar-hover {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .scrollbar-hover::-webkit-scrollbar {
          width: 0px;
          height: 0px;
        }
        .scrollbar-hover:hover {
          scrollbar-width: thin;
          scrollbar-color: #94a3b8 #f1f5f9;
        }
        .scrollbar-hover:hover::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .scrollbar-hover:hover::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .scrollbar-hover:hover::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 4px;
        }
        .scrollbar-hover:hover::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}} />
      <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
        {/* Page Header */}
        <h2 className="text-3xl font-extrabold text-center bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent mb-2">
          Salesforce Field Comparison
        </h2>
        <p className="text-center text-gray-500 mb-8">
          Compare fields across{" "}
          {validOrgs.length > 0 ? (
            validOrgs.map((org, idx) => (
              <span key={idx}>
                <span className="font-semibold text-blue-700">
                  {org.orgName != "None" ? org.orgName : `Org ${idx + 1}`}
                </span>
                {idx < validOrgs.length - 1 && <span className="mx-2">, </span>}
              </span>
            ))
          ) : (
            <span className="font-semibold text-gray-400">organizations</span>
          )}
        </p>

        {/* Organization Management */}
        <section className="w-full bg-white border border-gray-200 rounded-2xl shadow-md px-8 py-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Organizations</h3>
            <button
              onClick={addOrg}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              + Add Org
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orgs.map((org, index) => (
              <div key={index} className="flex flex-col gap-2 p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Org {index + 1}
                  </label>
                  {orgs.length > 2 && (
                    <button
                      onClick={() => removeOrg(index)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <select
                  value={org.instanceUrl || ""}
                  onChange={(e) => {
                    const selectedOrg = availableOrgs.find((o) => o.instanceUrl === e.target.value);
                    if (selectedOrg) {
                      updateOrg(index, selectedOrg);
                      toast.success(
                        `Switched to ${selectedOrg.orgName !== "None" ? selectedOrg.orgName : `Org ${index + 1}`}`
                      );
                    }
                  }}
                  className="w-full bg-white text-gray-700 rounded-lg px-3 py-2 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 transition-all cursor-pointer shadow-sm"
                >
                  <option value="" disabled>
                    Select an Org
                  </option>
                  {availableOrgs.map((o, idx) => (
                    <option key={idx} value={o.instanceUrl}>
                      {o.orgName !== "None"
                        ? `${o.orgName} || (${o.instanceUrl.replace("https://", "")})`
                        : o.instanceUrl.replace("https://", "")}
                    </option>
                  ))}
                </select>
                {org.instanceUrl && (
                  <p className="text-xs text-gray-500 mt-1">
                    {org.orgName !== "None" ? org.orgName : org.instanceUrl.replace("https://", "")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Object Selection Container: only show if 2 orgs are selected */}


        {/* Comparison Container */}
        {validOrgs.length >= 2 && (
          <section className="w-full bg-white border border-gray-200 rounded-2xl shadow-md px-8 py-6 mb-8 space-y-6">
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold text-gray-700">Comparison Logic</h3>
              <p className="text-sm text-gray-500">
                Map a single source object to one or more destination objects. One-to-many comparisons are supported,
                but many-to-many mappings are not.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={addComparison}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                + Add Comparison
              </button>
            </div>

            <div className="space-y-4">
              {comparisons.map((comparison, idx) => {
                const sourceOptions = orgObjectsMap[comparison.sourceOrg] || [];
                const availableTargetOrgs = validOrgs.filter(
                  (org) => org.instanceUrl !== comparison.sourceOrg
                );
                return (
                  <div key={comparison.id} className="border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Comparison Name
                        </label>
                        <input
                          type="text"
                          value={comparison.name || ""}
                          onChange={(e) => handleComparisonNameChange(comparison.id, e.target.value)}
                          className="rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          placeholder={`Comparison ${idx + 1}`}
                        />
                      </div>
                      {comparisons.length > 1 && (
                        <button
                          onClick={() => removeComparison(comparison.id)}
                          className="text-red-600 text-sm font-medium hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Source Object</p>
                        <select
                          value={comparison.sourceOrg}
                          onChange={(e) => handleComparisonSourceOrgChange(comparison.id, e.target.value)}
                          className="rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        >
                          {validOrgs.map((org) => (
                            <option key={org.instanceUrl} value={org.instanceUrl}>
                              {org.orgName !== "None" ? org.orgName : org.instanceUrl.replace("https://", "")}
                            </option>
                          ))}
                        </select>
                        <SearchableDropdown
                          label=""
                          options={sourceOptions.map((o) => ({ label: `${o.label} (${o.name})`, value: o.name }))}
                          value={comparison.sourceObject || ""}
                          onChange={(val) => handleComparisonSourceObjectChange(comparison.id, val)}
                          placeholder={sourceOptions.length ? "Select Source Object" : "No objects available"}
                          disabled={!sourceOptions.length}
                        />
                      </div>

                      <div className="flex flex-col gap-3 rounded-2xl border border-purple-100 bg-purple-50/40 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold uppercase tracking-wide text-purple-700">Target Objects</p>
                          <button
                            onClick={() => addComparisonTarget(comparison.id)}
                            className="text-xs font-semibold text-purple-600 hover:text-purple-800"
                            disabled={!availableTargetOrgs.length}
                          >
                            + Add Target
                          </button>
                        </div>
                        {(comparison.targets || []).length === 0 ? (
                          <p className="text-xs text-gray-500">
                            Map the source object to one or more targets (one-to-many supported).
                          </p>
                        ) : (
                          (comparison.targets || []).map((target, targetIdx) => {
                            const targetOptions = orgObjectsMap[target.orgKey] || [];
                            return (
                              <div
                                key={`${comparison.id}-target-${targetIdx}`}
                                className="rounded-xl bg-white border border-gray-200 p-3 space-y-2 shadow-inner"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <select
                                    value={target.orgKey}
                                    onChange={(e) =>
                                      handleComparisonTargetOrgChange(comparison.id, targetIdx, e.target.value)
                                    }
                                    className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
                                  >
                                    {availableTargetOrgs.map((org) => (
                                      <option key={org.instanceUrl} value={org.instanceUrl}>
                                        {org.orgName !== "None"
                                          ? org.orgName
                                          : org.instanceUrl.replace("https://", "")}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => removeComparisonTarget(comparison.id, targetIdx)}
                                    className="text-xs text-red-500 hover:text-red-700"
                                  >
                                    Remove
                                  </button>
                                </div>
                                <SearchableDropdown
                                  label=""
                                  options={targetOptions.map((o) => ({ label: `${o.label} (${o.name})`, value: o.name }))}
                                  value={target.objectName || ""}
                                  onChange={(val) =>
                                    handleComparisonTargetObjectChange(comparison.id, targetIdx, val)
                                  }
                                  placeholder={targetOptions.length ? "Select Target Object" : "No objects available"}
                                  disabled={!targetOptions.length}
                                />
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mt-8 mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl shadow-lg">
              <div className="flex flex-col gap-1">
                <span className="text-lg font-bold uppercase tracking-wide text-blue-700">View Comparison</span>
                <select
                  value={activeComparisonId}
                  onChange={(e) => setActiveComparisonId(e.target.value)}
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  style={{ minWidth: 220 }}
                >
                  {comparisons.map((cmp, idx) => (
                    <option key={cmp.id} value={cmp.id}>
                      {cmp.name || `Comparison ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-4 justify-end">
                {activeParticipants.map((participant, idx) => (
                  <span
                    key={`${participant.orgKey}-${idx}`}
                    className={`inline-flex flex-col rounded-xl border-2 px-4 py-3 text-base shadow-md ${participant.role === "source"
                      ? "border-blue-400 bg-blue-100 text-blue-800"
                      : "border-purple-400 bg-purple-100 text-purple-800"
                      }`}
                  >
                    <span className="font-bold">{participant.orgLabel}</span>
                    <span className="text-gray-700 text-sm">{participant.objectName || "No object selected"}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 shadow-sm text-center">
                <p className="text-blue-700 text-xs font-medium uppercase">Total Fields</p>
                <p className="text-2xl font-bold text-blue-800">{totalCount}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 shadow-sm text-center">
                <p className="text-green-700 text-xs font-medium uppercase">Matching</p>
                <p className="text-2xl font-bold text-green-800">{matchingCount}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 shadow-sm text-center">
                <p className="text-red-700 text-xs font-medium uppercase">Different</p>
                <p className="text-2xl font-bold text-red-800">{differentCount}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2 shadow-sm text-center">
                <p className="text-yellow-700 text-xs font-medium uppercase">Difference %</p>
                <p className="text-2xl font-bold text-yellow-800">{diffPercent}%</p>
              </div>
            </div>
          </section>
        )}

        {/* Metadata Dropdown */}
        <div className="flex flex-wrap justify-between items-center gap-6 mb-4">
          {/* Metadata selection dropdown */}
          <div className="relative">
            <details className="group border border-gray-300 rounded-lg px-4 py-2 bg-white cursor-pointer w-64 shadow-sm">
              <summary className="flex justify-between items-center text-gray-700 font-medium select-none">
                Compare By ({selectedMetadata.length})
              </summary>
              <div className="absolute z-30 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-auto w-full p-2 left-0">
                {metadataOptions.map((key) => (
                  <label
                    key={key}
                    className="flex items-center text-gray-700 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMetadata.includes(key)}
                      onChange={() => toggleMetadata(key)}
                      className="mr-2 accent-blue-600"
                    />
                    {key}
                  </label>
                ))}
              </div>
            </details>
          </div>
          {/* Type filter dropdown
        <div className="relative">
          <details className="group border border-gray-300 rounded-lg px-4 py-2 bg-white cursor-pointer w-64 shadow-sm">
            <summary className="flex justify-between items-center text-gray-700 font-medium select-none">
              Filter by Field Type
              <span className="text-gray-400 text-sm">
                ({typeFilter.length || "All"})
              </span>
            </summary>
            <div className="absolute z-20 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-auto w-full p-2">
              {allTypes.map((t) => (
                <label
                  key={t}
                  className="flex items-center text-gray-700 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={typeFilter.includes(t)}
                    onChange={() => toggleSelection(t, setTypeFilter)}
                    className="mr-2 accent-blue-600"
                  />
                  {t}
                </label>
              ))}
            </div>
          </details>
        </div> */}
        </div>


        {/* Filter Buttons and Display Toggle */}
        <div className="flex justify-center items-center gap-4 mb-6">
          <div className="inline-flex bg-white border border-gray-300 rounded-xl shadow-sm overflow-hidden">
            {[
              { key: "all", label: "All Fields" },
              { key: "different", label: "Only Different" },
              { key: "same", label: "Only Matching" },
            ].map(({ key, label }) => {
              const isActive = filter === key;
              return (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-5 py-2 text-sm font-medium transition-all duration-200 ${isActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {/* Display Mode Toggle */}
          <button
            onClick={() => setDisplayMode(displayMode === "default" ? "separate" : "default")}
            className="px-4 py-2 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700"
            title={displayMode === "default" ? "Switch to separate tables view" : "Switch to side-by-side view"}
          >
            {displayMode === "default" ? (
              <>
                <Columns className="w-4 h-4" />
                <span>Separate Tables</span>
              </>
            ) : (
              <>
                <LayoutGrid className="w-4 h-4" />
                <span>Side-by-Side</span>
              </>
            )}
          </button>
          {/* Scroll Lock Checkbox (only visible in separate tables mode) */}
          {displayMode === "separate" && (
            <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={scrollLock}
                onChange={(e) => setScrollLock(e.target.checked)}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700">Scroll Lock</span>
            </label>
          )}
        </div>

        {/* Table */}
        {hasActiveData ? (
          displayMode === "default" ? (
            // Default Side-by-Side View
            <div className="overflow-auto max-h-[70vh] border-0 rounded-xl shadow-lg bg-white scrollbar-hide scrollbar-hover">
              <table className="min-w-full text-sm border-collapse">
                <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white sticky top-0 z-20 shadow-md">
                  <tr>
                    {selectedMetadata.map((key) => (
                      <th
                        key={key}
                        colSpan={activeParticipants.length || 1}
                        className="p-4 text-center font-bold text-sm uppercase tracking-wider border-b-0 border-blue-700"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-gradient-to-r from-blue-500 to-indigo-500 border-t-0">
                    {selectedMetadata.map((key) =>
                      (activeParticipants.length ? activeParticipants : [{ orgLabel: "Org", objectName: "—" }]).map(
                        (participant, participantIdx) => (
                          <th
                            key={`${key}-participant-${participantIdx}`}
                            className="p-3 text-center text-xs font-semibold border-b border-blue-400/30"
                          >
                            <div className="flex flex-col gap-1">
                              <span>{participant.orgLabel}</span>
                              <span className="text-[10px] font-normal text-blue-100">
                                {participant.objectName || "—"}
                              </span>
                            </div>
                          </th>
                        )
                      )
                    )}
                  </tr>
                </thead>

                <tbody className="border-t-1 border-gray-200">
                  {filteredFields.map((f, idx) => (
                    <tr
                      key={idx}
                      className={`transition-all duration-150 ${f.diff
                        ? "bg-red-50/50 hover:bg-red-100/70 border-l-4 border-red-400"
                        : "bg-white hover:bg-blue-50/50 border-l-4 border-transparent hover:border-blue-300"
                        }`}
                    >
                      {selectedMetadata.map((key) =>
                        activeParticipants.map((participant, participantIdx) => {
                          const fieldData = f.fieldDataArray[participantIdx] || {};
                          return (
                            <td
                              key={`${key}-${participantIdx}`}
                              className="p-4 text-center text-gray-700 font-medium"
                            >
                              <span className="inline-block px-2 py-1 rounded-md text-gray-800">
                                {String(fieldData[key] ?? "—")}
                              </span>
                            </td>
                          );
                        })
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // Separate Tables View
            <div
              ref={scrollContainerRef}
              className="overflow-y-auto max-h-[70vh] border-0 rounded-xl shadow-lg bg-white scrollbar-hide"
            >
              <div className="flex gap-6 p-6">
                {activeParticipants.map((participant, orgIdx) => (
                  <div key={`${participant.orgKey}-${orgIdx}`} className="flex-1 min-w-0 flex flex-col">
                    <div className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-lg shadow-md">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                        {participant.orgLabel}
                      </h3>
                      <p className="text-[11px] text-blue-100 font-medium truncate">
                        {participant.objectName || "No object selected"}
                      </p>
                    </div>
                    <div
                      ref={(el) => {
                        if (el) {
                          tableScrollRefs.current[orgIdx] = el;
                        }
                      }}
                      className="overflow-x-auto overflow-y-auto border-0 rounded-b-lg bg-white shadow-inner scrollbar-hide scrollbar-hover"
                      style={{ maxHeight: 'calc(70vh - 100px)' }}
                    >
                      <table className="min-w-full text-sm border-collapse">
                        <thead className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white sticky top-0 z-10 shadow-sm border-t-0">
                          <tr>
                            {selectedMetadata.map((key) => (
                              <th
                                key={key}
                                className="p-4 text-center font-bold text-xs uppercase tracking-wider whitespace-nowrap border-r border-blue-400/30 last:border-r-0"
                              >
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredFields.map((f, idx) => {
                            const fieldData = f.fieldDataArray[orgIdx] || {};
                            return (
                              <tr
                                key={idx}
                                className={`transition-all duration-150 ${f.diff
                                  ? "bg-red-50/50 hover:bg-red-100/70 border-l-4 border-red-400"
                                  : "bg-white hover:bg-blue-50/50 border-l-4 border-transparent hover:border-blue-300"
                                  }`}
                              >
                                {selectedMetadata.map((key) => (
                                  <td
                                    key={key}
                                    className="p-4 text-center text-gray-700 font-medium whitespace-nowrap border-r border-gray-100 last:border-r-0"
                                  >
                                    <span className="inline-block px-3 py-1.5 rounded-lg bg-gray-50 text-gray-800 font-medium">
                                      {String(fieldData[key] ?? "—")}
                                    </span>
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : (
          <p className="text-center text-gray-600 mt-6">
            Select a comparison with defined objects to view field data.
          </p>
        )}
      </div>
    </>
  );
}
