'use client';

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-sql";
// import "prismjs/themes/prism-tomorrow.css"; // Dynamic loading instead

const THEMES = [
    { id: "prism-tomorrow.css", label: "Tomorrow Night" },
    { id: "prism-coy.css", label: "Coy" },
    { id: "prism-dark.css", label: "Dark" },
    { id: "prism-funky.css", label: "Funky" },
    { id: "prism-okaidia.css", label: "Okaidia" },
    { id: "prism-solarizedlight.css", label: "Solarized Light" },
    { id: "prism-twilight.css", label: "Twilight" },
    { id: "prism-atom-dark.css", label: "Atom Dark" },
    { id: "prism-dracula.css", label: "Dracula" },
    { id: "prism-gruvbox-dark.css", label: "Gruvbox Dark" },
    { id: "prism-material-dark.css", label: "Material Dark" },
    { id: "prism-material-light.css", label: "Material Light" },
    { id: "prism-material-oceanic.css", label: "Material Oceanic" },
    { id: "prism-night-owl.css", label: "Night Owl" },
    { id: "prism-nord.css", label: "Nord" },
    { id: "prism-one-dark.css", label: "One Dark" },
    { id: "prism-one-light.css", label: "One Light" },
    { id: "prism-shades-of-purple.css", label: "Shades of Purple" },
    { id: "prism-synthwave84.css", label: "Synthwave '84" },
    { id: "prism-vs.css", label: "VS Code" },
    { id: "prism-vsc-dark-plus.css", label: "VSC Dark Plus" },
    { id: "prism.css", label: "Default" },
];

export default function SoqlPage() {
    const router = useRouter();
    const [orgs, setOrgs] = useState([]);
    const [orgLoading, setOrgLoading] = useState(true);
    const [orgError, setOrgError] = useState("");
    const [selectedOrgId, setSelectedOrgId] = useState("");
    const [selectedOrgMeta, setSelectedOrgMeta] = useState(null);
    const [instanceUrl, setInstanceUrl] = useState("");
    const [token, setToken] = useState("");

    const [query, setQuery] = useState("SELECT Id, Name, CreatedDate FROM Account LIMIT 10");
    const [results, setResults] = useState(null);
    const [executing, setExecuting] = useState(false);
    const [error, setError] = useState("");
    const [theme, setTheme] = useState("prism-tomorrow.css");

    // Theme Picker State
    const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
    const [originalTheme, setOriginalTheme] = useState("");

    // Table Sorting State
    const [sortColumn, setSortColumn] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

    // Autocomplete State
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [objectsCache, setObjectsCache] = useState([]);
    const [fieldsCache, setFieldsCache] = useState({});
    const [loadingMetadata, setLoadingMetadata] = useState(false);

    // SOQL Keywords for autocomplete
    const SOQL_KEYWORDS = [
        'SELECT', 'FROM', 'WHERE', 'ORDER BY', 'GROUP BY',
        'LIMIT', 'OFFSET', 'AND', 'OR', 'NOT', 'LIKE',
        'IN', 'NOT IN', 'INCLUDES', 'EXCLUDES',
        'ASC', 'DESC', 'NULLS FIRST', 'NULLS LAST',
        'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
        'HAVING', 'TRUE', 'FALSE', 'NULL'
    ];

    useEffect(() => {
        const linkId = 'prism-theme-link';
        let link = document.getElementById(linkId);

        if (!link) {
            link = document.createElement('link');
            link.id = linkId;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }

        link.href = `/themes/${theme}`;
    }, [theme]);

    const openThemePicker = () => {
        setOriginalTheme(theme);
        setIsThemePickerOpen(true);
    };

    const closeThemePicker = (save = false) => {
        if (!save) {
            setTheme(originalTheme);
        }
        setIsThemePickerOpen(false);
    };

    const loadOrgs = useCallback(async () => {
        setOrgLoading(true);
        setOrgError("");
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Please sign in again to load your organizations.");
            const res = await fetch("/api/salesforceLogin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({}),
            });
            const data = await res.json();
            if (!data.success || !Array.isArray(data.data)) {
                throw new Error(data.error || "Could not fetch organizations.");
            }
            setOrgs(data.data);
        } catch (error) {
            const message = error?.message || "Unable to load organizations.";
            setOrgError(message);
            toast.error(message);
        } finally {
            setOrgLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOrgs();
    }, [loadOrgs]);

    const selectOrg = useCallback(
        (instanceValue, { silent = false } = {}) => {
            if (!instanceValue) return;
            const org = orgs.find((item) => item.instanceUrl === instanceValue);
            if (!org) return;
            setSelectedOrgId(org.instanceUrl);
            setSelectedOrgMeta(org);
            setToken(org.accessToken);
            setInstanceUrl(org.instanceUrl);
            localStorage.setItem("accessToken", org.accessToken);
            localStorage.setItem("instanceUrl", org.instanceUrl);
            if (!silent) {
                toast.success(
                    `Loaded ${org.orgName && org.orgName !== "None" ? org.orgName : "Salesforce organization"
                    }`
                );
            }
        },
        [orgs]
    );

    useEffect(() => {
        if (!orgs.length) return;
        const savedInstance = localStorage.getItem("instanceUrl");
        const initialOrg =
            orgs.find((org) => org.instanceUrl === savedInstance) || orgs[0];
        selectOrg(initialOrg.instanceUrl, { silent: true });
    }, [orgs, selectOrg]);

    const executeQuery = async () => {
        if (!instanceUrl || !token) {
            toast.error("Please select an organization first.");
            return;
        }
        if (!query.trim()) {
            toast.error("Please enter a SOQL query.");
            return;
        }

        setExecuting(true);
        setError("");
        setResults(null);

        try {
            const res = await fetch("/api/soql", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accessToken: token, instanceUrl, query }),
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Query execution failed.");
            }

            setResults(data.data);
            toast.success(`Query executed. Found ${data.data.totalSize} records.`);
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setExecuting(false);
        }
    };

    const handleSort = (column) => {
        if (sortColumn === column) {
            // Toggle direction if same column
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // New column, default to ascending
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const getSortedResults = () => {
        if (!results || !results.records || !sortColumn) return results;

        const sortedRecords = [...results.records].sort((a, b) => {
            let aVal = a[sortColumn];
            let bVal = b[sortColumn];

            // Handle null/undefined
            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return 1;
            if (bVal == null) return -1;

            // Handle objects
            if (typeof aVal === 'object') aVal = JSON.stringify(aVal);
            if (typeof bVal === 'object') bVal = JSON.stringify(bVal);

            // Compare
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortDirection === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            } else {
                return sortDirection === 'asc'
                    ? (aVal > bVal ? 1 : -1)
                    : (bVal > aVal ? 1 : -1);
            }
        });

        return { ...results, records: sortedRecords };
    };

    // Fetch all objects metadata
    const fetchObjects = useCallback(async () => {
        if (objectsCache.length > 0 || !instanceUrl || !token) return;

        setLoadingMetadata(true);
        try {
            const res = await fetch('/api/metadata/objects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken: token, instanceUrl }),
            });
            const data = await res.json();
            if (data.success) {
                setObjectsCache(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch objects:', err);
        } finally {
            setLoadingMetadata(false);
        }
    }, [instanceUrl, token, objectsCache.length]);

    // Fetch fields for a specific object
    const fetchFields = useCallback(async (objectName) => {
        if (fieldsCache[objectName] || !instanceUrl || !token) return;

        try {
            const res = await fetch('/api/metadata/fields', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken: token, instanceUrl, objectName }),
            });
            const data = await res.json();
            if (data.success) {
                setFieldsCache(prev => ({
                    ...prev,
                    [objectName]: data.data.fields
                }));
            }
        } catch (err) {
            console.error(`Failed to fetch fields for ${objectName}:`, err);
        }
    }, [instanceUrl, token, fieldsCache]);

    // Load objects when org is selected
    useEffect(() => {
        if (instanceUrl && token) {
            fetchObjects();
        }
    }, [instanceUrl, token, fetchObjects]);

    // Get suggestions based on current query
    const getSuggestions = useCallback((queryText, cursorPos) => {
        const beforeCursor = queryText.substring(0, cursorPos);
        const words = beforeCursor.trim().split(/\s+/);
        const currentWord = words[words.length - 1] || '';
        const upperQuery = beforeCursor.toUpperCase();

        let suggestions = [];

        // Determine context
        const hasSelect = upperQuery.includes('SELECT');
        const hasFrom = upperQuery.includes('FROM');
        const fromMatch = upperQuery.match(/FROM\s+(\w+)/);
        const objectName = fromMatch ? fromMatch[1] : null;

        if (!hasSelect) {
            // Suggest SELECT first
            suggestions = ['SELECT'].filter(k => k.startsWith(currentWord.toUpperCase()));
        } else if (hasSelect && !hasFrom) {
            // Between SELECT and FROM - suggest fields or FROM
            if (currentWord.toUpperCase() === 'FROM' || 'FROM'.startsWith(currentWord.toUpperCase())) {
                suggestions.push('FROM');
            }
            // Also suggest aggregate functions
            const functions = ['COUNT()', 'SUM()', 'AVG()', 'MIN()', 'MAX()'];
            suggestions.push(...functions.filter(f => f.startsWith(currentWord.toUpperCase())));
        } else if (hasFrom && currentWord && !objectName) {
            // Right after FROM - suggest objects
            suggestions = objectsCache
                .filter(obj => obj.name.toLowerCase().startsWith(currentWord.toLowerCase()))
                .map(obj => ({
                    text: obj.name,
                    label: obj.label,
                    type: 'object'
                }));
        } else if (objectName) {
            // After object name - suggest WHERE, ORDER BY, etc or fields
            const keywords = ['WHERE', 'ORDER BY', 'GROUP BY', 'LIMIT', 'OFFSET']
                .filter(k => k.startsWith(currentWord.toUpperCase()));

            // Load fields for this object if not cached
            if (!fieldsCache[objectName]) {
                fetchFields(objectName);
            }

            // Add field suggestions
            const fields = fieldsCache[objectName] || [];
            const fieldSuggestions = fields
                .filter(f => f.name.toLowerCase().startsWith(currentWord.toLowerCase()))
                .map(f => ({
                    text: f.name,
                    label: f.label,
                    type: f.type
                }));

            suggestions = [
                ...keywords.map(k => ({ text: k, type: 'keyword' })),
                ...fieldSuggestions
            ];
        } else {
            // General - suggest SOQL keywords
            suggestions = SOQL_KEYWORDS
                .filter(k => k.startsWith(currentWord.toUpperCase()))
                .map(k => ({ text: k, type: 'keyword' }));
        }

        return suggestions.slice(0, 10); // Limit to 10 suggestions
    }, [objectsCache, fieldsCache, SOQL_KEYWORDS, fetchFields]);

    // Handle query change and update suggestions
    const handleQueryChange = (newQuery) => {
        setQuery(newQuery);

        // Get cursor position (end of text for now)
        const cursorPos = newQuery.length;
        setCursorPosition(cursorPos);

        // Get and show suggestions
        const newSuggestions = getSuggestions(newQuery, cursorPos);
        setSuggestions(newSuggestions);
        setShowSuggestions(newSuggestions.length > 0);
        setSelectedSuggestionIndex(0);
    };

    // Handle keyboard navigation in suggestions
    const handleKeyDown = (e) => {
        if (!showSuggestions) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedSuggestionIndex(prev =>
                prev < suggestions.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
        } else if (e.key === 'Enter' && suggestions.length > 0) {
            e.preventDefault();
            applySuggestion(suggestions[selectedSuggestionIndex]);
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    // Apply selected suggestion
    const applySuggestion = (suggestion) => {
        const suggestionText = typeof suggestion === 'string' ? suggestion : suggestion.text;
        const beforeCursor = query.substring(0, cursorPosition);
        const afterCursor = query.substring(cursorPosition);

        // Find the word being completed
        const words = beforeCursor.split(/\s+/);
        const currentWord = words[words.length - 1] || '';
        const beforeWord = beforeCursor.substring(0, beforeCursor.length - currentWord.length);

        // Insert suggestion
        const newQuery = beforeWord + suggestionText + ' ' + afterCursor;
        setQuery(newQuery);
        setShowSuggestions(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 py-6 px-3 sm:px-3 relative">
            {/* Theme Picker Modal */}
            {isThemePickerOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => closeThemePicker(false)}>
                    <div
                        className="w-full max-w-5xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-slate-200 bg-slate-50">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold text-gray-900">Select Color Theme</h3>
                                <button
                                    onClick={() => closeThemePicker(false)}
                                    className="text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <input
                                type="text"
                                placeholder="Search themes..."
                                className="w-full bg-white text-gray-900 px-3 py-2 rounded border border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm"
                                autoFocus
                            />
                        </div>

                        {/* Two Column Layout */}
                        <div className="flex flex-1 overflow-hidden">
                            {/* Theme List */}
                            <div className="w-1/3 border-r border-slate-200 overflow-y-auto bg-slate-50">
                                {THEMES.map(t => (
                                    <button
                                        key={t.id}
                                        className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between group hover:bg-slate-100 transition-colors outline-none border-l-2 ${theme === t.id ? 'border-l-indigo-500 bg-indigo-50 text-indigo-900' : 'border-l-transparent text-gray-700'}`}
                                        onMouseEnter={() => setTheme(t.id)}
                                        onClick={() => closeThemePicker(true)}
                                    >
                                        <span className="font-medium">{t.label}</span>
                                        {theme === t.id && (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Preview Pane */}
                            <div className="flex-1 bg-white p-6 overflow-y-auto">
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-xs text-gray-500 mb-2 font-mono uppercase tracking-wider">Preview</div>
                                        <div className="rounded-lg border border-slate-200 overflow-hidden">
                                            <Editor
                                                value={`SELECT Id, Name, Email, CreatedDate\nFROM Account\nWHERE IsActive = true\n  AND Industry IN ('Technology', 'Finance')\nORDER BY CreatedDate DESC\nLIMIT 100`}
                                                onValueChange={() => { }}
                                                highlight={code => highlight(code, languages.sql)}
                                                padding={16}
                                                style={{
                                                    fontFamily: '"Fira code", "Fira Mono", monospace',
                                                    fontSize: 13,
                                                    backgroundColor: "#f8f9fa",
                                                    minHeight: "200px",
                                                    pointerEvents: "none"
                                                }}
                                                disabled
                                                className="min-h-[200px]"
                                            />
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        <p className="mb-1">Current theme: <span className="text-indigo-600 font-mono">{THEMES.find(t => t.id === theme)?.label}</span></p>
                                        <p>Hover over a theme to preview it. Click to apply.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="mx-auto flex max-w-7xl flex-col gap-6">
                <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white shadow-2xl">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight">
                                SOQL Query Editor
                            </h1>
                            <p className="mt-1 max-w-xl text-slate-100">
                                Execute SOQL queries directly against your Salesforce organization.
                            </p>
                            <div className="mt-4 flex items-center gap-2">
                                <button
                                    onClick={openThemePicker}
                                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-medium rounded-lg px-3 py-1.5 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                    </svg>
                                    Change Theme
                                </button>
                                <span className="text-xs text-blue-100 opacity-70">
                                    Current: {THEMES.find(t => t.id === theme)?.label}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-50 transition duration-500"></div>
                                <div className="relative flex items-center bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-1 shadow-lg">
                                    <div className="hidden sm:block px-3 text-xs font-bold text-blue-100 uppercase tracking-wider select-none">
                                        Active Org
                                    </div>
                                    <div className="hidden sm:block h-6 w-px bg-white/20 mx-1"></div>
                                    <div className="relative">
                                        <select
                                            className="bg-transparent text-white text-sm font-semibold focus:outline-none cursor-pointer py-2 pl-3 pr-10 appearance-none min-w-[220px] hover:text-blue-50 transition-colors"
                                            value={selectedOrgId || ""}
                                            onChange={(event) => selectOrg(event.target.value)}
                                            disabled={orgLoading || !orgs.length}
                                        >
                                            <option value="" disabled className="text-gray-500 bg-white">
                                                {orgLoading ? "Loading..." : "Select Organization"}
                                            </option>
                                            {orgs.map((org) => (
                                                <option key={org.instanceUrl} value={org.instanceUrl} className="text-gray-900 bg-white py-2">
                                                    {org.orgName && org.orgName !== "None" ? org.orgName : "Salesforce Org"}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/80">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {selectedOrgMeta?.instanceUrl && (
                                <div className="flex items-center gap-2 text-xs text-blue-50 bg-black/20 px-3 py-1.5 rounded-full border border-white/10 shadow-sm backdrop-blur-sm transition-all hover:bg-black/30">
                                    <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]"></div>
                                    <span className="font-mono tracking-tight opacity-90">
                                        {selectedOrgMeta.instanceUrl.replace("https://", "").replace(".my.salesforce.com", "")}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {orgError && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {orgError}{" "}
                        {!orgLoading && !orgs.length && (
                            <button
                                onClick={() => router.push("/profile")}
                                className="underline"
                            >
                                Add one in your profile
                            </button>
                        )}
                    </div>
                )}

                <section className="rounded-3xl bg-white p-6 shadow-xl space-y-4">
                    <div>
                        <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                            SOQL Query
                        </label>
                        <div className="relative">
                            <div
                                className="rounded-xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-500"
                                onKeyDown={handleKeyDown}
                            >
                                <Editor
                                    value={query}
                                    onValueChange={handleQueryChange}
                                    highlight={code => highlight(code, languages.sql)}
                                    padding={16}
                                    style={{
                                        fontFamily: '"Fira code", "Fira Mono", monospace',
                                        fontSize: 14,
                                        backgroundColor: "#f8f9fa",
                                        minHeight: "150px"
                                    }}
                                    className="min-h-[150px]"
                                />
                            </div>

                            {/* Autocomplete Dropdown */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {suggestions.map((suggestion, index) => {
                                        const suggestionText = typeof suggestion === 'string' ? suggestion : suggestion.text;
                                        const suggestionType = typeof suggestion === 'object' ? suggestion.type : 'keyword';
                                        const suggestionLabel = typeof suggestion === 'object' ? suggestion.label : null;

                                        return (
                                            <div
                                                key={index}
                                                onClick={() => applySuggestion(suggestion)}
                                                className={`px-4 py-2 cursor-pointer transition-colors ${index === selectedSuggestionIndex
                                                    ? 'bg-indigo-50 border-l-2 border-l-indigo-500'
                                                    : 'hover:bg-gray-50 border-l-2 border-l-transparent'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-mono text-gray-900">
                                                            {suggestionText}
                                                        </span>
                                                        {suggestionLabel && (
                                                            <span className="text-xs text-gray-500">
                                                                {suggestionLabel}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-400 uppercase">
                                                        {suggestionType === 'object' && '📦 Object'}
                                                        {suggestionType === 'keyword' && '🔤 Keyword'}
                                                        {suggestionType && suggestionType !== 'object' && suggestionType !== 'keyword' && `📝 ${suggestionType}`}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={executeQuery}
                            disabled={executing || !selectedOrgId}
                            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {executing ? "Executing..." : "Execute Query"}
                        </button>
                    </div>
                </section>

                {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700 font-mono whitespace-pre-wrap">
                        {error}
                    </div>
                )}

                {results && (
                    <section className="rounded-3xl bg-white p-6 shadow-xl overflow-hidden">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900">Query Results</h2>
                            <span className="text-sm text-gray-500">Total Records: {results.totalSize}</span>
                        </div>

                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto border border-gray-200 rounded-lg">
                            {results.records && results.records.length > 0 ? (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 sticky top-0 z-10">
                                        <tr>
                                            {Object.keys(results.records[0])
                                                .filter(key => key !== 'attributes')
                                                .map((key) => (
                                                    <th
                                                        key={key}
                                                        scope="col"
                                                        onClick={() => handleSort(key)}
                                                        className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors select-none"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span>{key}</span>
                                                            {sortColumn === key && (
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    className={`h-4 w-4 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                >
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </th>
                                                ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {getSortedResults().records.map((record, idx) => (
                                            <tr key={idx} className="hover:bg-indigo-50 transition-colors">
                                                {Object.keys(record)
                                                    .filter(key => key !== 'attributes')
                                                    .map((key) => {
                                                        const value = record[key];
                                                        let displayValue = value;
                                                        if (typeof value === 'object' && value !== null) {
                                                            displayValue = JSON.stringify(value);
                                                        }
                                                        return (
                                                            <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                                {displayValue}
                                                            </td>
                                                        );
                                                    })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No records found.
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
