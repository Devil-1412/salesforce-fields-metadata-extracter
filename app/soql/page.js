"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-sql";
import ConfirmDialog from "../components/ConfirmDialog";

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

const SOQL_KEYWORDS = [
    'SELECT', 'FROM', 'WHERE', 'ORDER BY', 'GROUP BY', 'HAVING',
    'LIMIT', 'OFFSET', 'FOR VIEW', 'FOR REFERENCE', 'UPDATE TRACKING', 'UPDATE VIEWSTAT',
    'AND', 'OR', 'NOT', 'IN', 'NOT IN', 'INCLUDES', 'EXCLUDES', 'LIKE',
    'ASC', 'DESC', 'NULLS FIRST', 'NULLS LAST',
    'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
    'TRUE', 'FALSE', 'NULL',
    'DATE', 'DATETIME', 'time',
    'YESTERDAY', 'TODAY', 'TOMORROW',
    'LAST_WEEK', 'THIS_WEEK', 'NEXT_WEEK',
    'LAST_MONTH', 'THIS_MONTH', 'NEXT_MONTH',
    'LAST_90_DAYS', 'NEXT_90_DAYS',
    'LAST_N_DAYS', 'NEXT_N_DAYS',
    'N_DAYS_AGO', 'NEXT_N_WEEKS', 'LAST_N_WEEKS',
    'NEXT_N_MONTHS', 'LAST_N_MONTHS',
    'NEXT_N_QUARTERS', 'LAST_N_QUARTERS',
    'NEXT_N_YEARS', 'LAST_N_YEARS',
    'THIS_QUARTER', 'LAST_QUARTER', 'NEXT_QUARTER',
    'THIS_YEAR', 'LAST_YEAR', 'NEXT_YEAR',
    'THIS_FISCAL_QUARTER', 'LAST_FISCAL_QUARTER', 'NEXT_FISCAL_QUARTER',
    'THIS_FISCAL_YEAR', 'LAST_FISCAL_YEAR', 'NEXT_FISCAL_YEAR',
    'TYPEOF', 'WITH', 'USING SCOPE'
];

export default function SoqlPage() {
    const router = useRouter();
    const [orgs, setOrgs] = useState([]);
    const [orgLoading, setOrgLoading] = useState(true);
    const [orgError, setOrgError] = useState("");
    const [selectedOrgId, setSelectedOrgId] = useState("");
    const [selectedOrgMeta, setSelectedOrgMeta] = useState(null);
    const [instanceUrl, setInstanceUrl] = useState("");
    // token here refers to Salesforce Access Token
    const [token, setToken] = useState(""); 
    
    // authToken refers to Supabase Session Token - REMOVED for cookie auth
    // const [authToken, setAuthToken] = useState("");

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

    // Saved Queries State
    const [savedQueries, setSavedQueries] = useState([]);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [newQueryName, setNewQueryName] = useState("");
    const [savingQuery, setSavingQuery] = useState(false);
    // const [loadingQueries, setLoadingQueries] = useState(false); // variable unused in original but keep if needed

    // Delete Confirmation State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [queryToDelete, setQueryToDelete] = useState(null);

    // Table Filtering State
    const [columnFilters, setColumnFilters] = useState({}); // { columnName: { type: 'equals', value: 'test' } }
    const [activeFilterColumn, setActiveFilterColumn] = useState(null);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filterType, setFilterType] = useState('contains');
    const [filterValue, setFilterValue] = useState('');


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

    // Load Supabase session
    // Supabase session is handled via cookies now
    /*
    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setAuthToken(session.access_token);
            } else {
                router.push("/login");
            }
        };
        getSession();
    }, [router]);
    */

    const loadOrgs = useCallback(async () => {
        setOrgLoading(true);
        setOrgError("");
        try {
            const res = await fetch("/api/salesforceLogin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({}),
            });
            const data = await res.json();
            if (!data.success || !Array.isArray(data.data)) {
                if (data.error && data.error.includes("expired")) {
                    throw new Error("Session expired. Please log in again.");
                }
                throw new Error(data.error || "Could not fetch organizations.");
            }
            setOrgs(data.data);
        } catch (error) {
            const message = error?.message || "Unable to load organizations.";
            setOrgError(message);
            // toast.error(message);
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
        if (initialOrg) {
            selectOrg(initialOrg.instanceUrl, { silent: true });
        }
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
                headers: { 
                    "Content-Type": "application/json"
                },
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

    // Apply column filters to results
    const getFilteredResults = () => {
        if (!results || !results.records) return results;

        let filteredRecords = [...results.records];

        // Apply each column filter
        Object.entries(columnFilters).forEach(([column, filter]) => {
            filteredRecords = filteredRecords.filter(record => {
                const value = record[column];
                const filterVal = filter.value;

                switch (filter.type) {
                    case 'equals':
                        return String(value).toLowerCase() === String(filterVal).toLowerCase();
                    case 'notEquals':
                        return String(value).toLowerCase() !== String(filterVal).toLowerCase();
                    case 'contains':
                        return String(value).toLowerCase().includes(String(filterVal).toLowerCase());
                    case 'startsWith':
                        return String(value).toLowerCase().startsWith(String(filterVal).toLowerCase());
                    case 'endsWith':
                        return String(value).toLowerCase().endsWith(String(filterVal).toLowerCase());
                    case 'greaterThan':
                        return Number(value) > Number(filterVal);
                    case 'lessThan':
                        return Number(value) < Number(filterVal);
                    case 'isNull':
                        return value == null || value === '';
                    case 'isNotNull':
                        return value != null && value !== '';
                    default:
                        return true;
                }
            });
        });

        return { ...results, records: filteredRecords, totalSize: filteredRecords.length };
    };

    // Get results with both sorting and filtering applied
    const getProcessedResults = () => {
        const filtered = getFilteredResults();
        if (!sortColumn) return filtered;

        const sortedRecords = [...filtered.records].sort((a, b) => {
            let aVal = a[sortColumn];
            let bVal = b[sortColumn];

            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return 1;
            if (bVal == null) return -1;

            if (typeof aVal === 'object') aVal = JSON.stringify(aVal);
            if (typeof bVal === 'object') bVal = JSON.stringify(bVal);

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

        return { ...filtered, records: sortedRecords };
    };

    // Open filter modal for a column
    const openFilterModal = (column) => {
        setActiveFilterColumn(column);
        if (columnFilters[column]) {
            setFilterType(columnFilters[column].type);
            setFilterValue(columnFilters[column].value);
        } else {
            setFilterType('contains');
            setFilterValue('');
        }
        setShowFilterModal(true);
    };

    // Apply filter to a column
    const applyColumnFilter = () => {
        if (!activeFilterColumn) return;

        const needsValue = !['isNull', 'isNotNull'].includes(filterType);
        if (needsValue && !filterValue.trim()) {
            toast.error('Please enter a filter value');
            return;
        }

        setColumnFilters(prev => ({
            ...prev,
            [activeFilterColumn]: {
                type: filterType,
                value: filterValue
            }
        }));

        setShowFilterModal(false);
        setActiveFilterColumn(null);
        setFilterValue('');
        toast.success(`Filter applied to ${activeFilterColumn}`);
    };

    // Remove filter from a column
    const removeColumnFilter = (column) => {
        setColumnFilters(prev => {
            const newFilters = { ...prev };
            delete newFilters[column];
            return newFilters;
        });
        toast.success(`Filter removed from ${column}`);
    };

    // Clear all filters
    const clearAllFilters = () => {
        setColumnFilters({});
        toast.success('All filters cleared');
    };

    // Export to CSV
    const exportToCSV = () => {
        const processedResults = getProcessedResults();
        if (!processedResults || !processedResults.records || processedResults.records.length === 0) {
            toast.error('No data to export');
            return;
        }

        const records = processedResults.records;
        const columns = Object.keys(records[0]).filter(key => key !== 'attributes');

        // Create CSV header
        const csvHeader = columns.join(',');

        // Create CSV rows
        const csvRows = records.map(record => {
            return columns.map(column => {
                const value = record[column];
                if (value == null) return '';
                if (typeof value === 'object') return JSON.stringify(value).replace(/"/g, '""');
                const stringValue = String(value);
                // Escape quotes and wrap in quotes if contains comma or newline
                if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            }).join(',');
        });

        // Combine header and rows
        const csv = [csvHeader, ...csvRows].join('\n');

        // Create download link
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `soql_results_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Exported ${records.length} records to CSV`);
    };

    // Fetch all objects metadata
    const fetchObjects = useCallback(async () => {
        if (objectsCache.length > 0 || !instanceUrl || !token) return;

        setLoadingMetadata(true);
        try {
            const res = await fetch('/api/metadata/describe', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ accessToken: token, instanceUrl, type: "objects" }),
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
            const res = await fetch('/api/metadata/describe', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ accessToken: token, instanceUrl, type: "fields", objectName }),
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

    // Saved Queries Logic
    const fetchSavedQueries = useCallback(async () => {

        try {
            const res = await fetch("/api/queries/list", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            const data = await res.json();
            if (data.success) {
                setSavedQueries(data.queries);
            }
        } catch (err) {
            console.error("Error fetching saved queries:", err);
        }
    }, []);

    useEffect(() => {
        fetchSavedQueries();
    }, [fetchSavedQueries]);

    const handleSaveQuery = async () => {
        if (!newQueryName.trim()) {
             if(!Boolean(newQueryName.trim())) toast.error("Please enter a name for the query");
             return;
        }

        setSavingQuery(true);
        try {
            const res = await fetch("/api/queries/save", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: newQueryName,
                    query: query
                }),
            });
            const data = await res.json();
            if(data.success) {
                 toast.success("Query saved successfully");
                 setIsSaveModalOpen(false);
                 setNewQueryName("");
                 fetchSavedQueries();
            } else {
                 toast.error(data.error || "Failed to save query");
            }
        } catch (err) {
             console.error(err);
             toast.error("Failed to save query");
        } finally {
             setSavingQuery(false);
        }
    };

    const handleDeleteQuery = async (id, e) => {
        e.stopPropagation();
        setQueryToDelete(savedQueries.find(q => q.id === id));
        setShowDeleteConfirm(true);
    };

    const confirmDeleteQuery = async () => {
        if (!queryToDelete) return;

        try {
            const res = await fetch("/api/queries/delete", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ id: queryToDelete.id }),
            });
            const data = await res.json();
            if(data.success) {
                 toast.success("Query deleted successfully");
                 fetchSavedQueries();
            } else {
                 toast.error(data.error || "Failed to delete query");
            }
        } catch(err) {
             console.error(err);
             toast.error("Failed to delete query");
        } finally {
             setShowDeleteConfirm(false);
             setQueryToDelete(null);
        }
    };

    const loadSavedQuery = (savedQuery) => {
        setQuery(savedQuery.query);
        toast.success(`Loaded query: ${savedQuery.name}`);
    };

    // Helper to parse query and find context
    const getQueryContext = (text, cursorPos) => {
        // Simple tokenizer
        const tokens = [];
        let currentToken = '';
        let currentStart = 0;
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (/\s/.test(char) || [',', '(', ')'].includes(char)) {
                if (currentToken) {
                    tokens.push({ text: currentToken, start: currentStart, end: i });
                    currentToken = '';
                }
                if (char !== ' ') {
                     tokens.push({ text: char, start: i, end: i + 1 });
                }
            } else {
                if (!currentToken) currentStart = i;
                currentToken += char;
            }
        }
        if (currentToken) {
            tokens.push({ text: currentToken, start: currentStart, end: text.length });
        }

        // Find token at cursor
        // We want to know the "active" word being typed
        let activeWord = '';
        
        if (cursorPos > 0 && /\s/.test(text[cursorPos - 1])) {
             // New word
        } else {
             // Find the token intersecting cursor
             const cursorTokenIndex = tokens.findIndex(t => cursorPos >= t.start && cursorPos <= t.end);
             if (cursorTokenIndex !== -1) {
                 activeWord = tokens[cursorTokenIndex].text;
             }
        }

        // Determine Clause
        let clause = 'SELECT'; // Default
        let objectName = null;
        let objectToken = null;
        
        // Scan tokens to find clauses and FROM object
        for (let i = 0; i < tokens.length; i++) {
            const t = tokens[i];
            const upper = t.text.toUpperCase();
            
            if (['SELECT', 'FROM', 'WHERE', 'ORDER', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET'].includes(upper)) {
                // If we are BEFORE the cursor, this sets the current clause
                if (t.end <= cursorPos) {
                    if (upper === 'ORDER' || upper === 'GROUP') {
                         // Check next token for BY
                         if (tokens[i+1] && tokens[i+1].text.toUpperCase() === 'BY') {
                             clause = upper + ' BY';
                             i++; // Skip BY
                         } else {
                             clause = upper;
                         }
                    } else {
                        clause = upper;
                    }
                }
            }

            // Capture Object Name from FROM clause
            // We look for FROM and take the next token as object name
            if (upper === 'FROM' && tokens[i+1]) {
                objectName = tokens[i+1].text;
                objectToken = tokens[i+1];
            }
        }

        return {
            clause,
            objectName,
            objectToken,
            activeWord
        };
    };

    // Get suggestions based on current query
    const getSuggestions = useCallback((queryText, cursorPos) => {
        const { clause, objectName, objectToken, activeWord } = getQueryContext(queryText, cursorPos);
        
        // User request: "suggestions should come after a character is typd"
        if (!activeWord || activeWord.trim().length === 0) {
            return [];
        }

        const upperWord = activeWord.toUpperCase();
        
        let suggestions = [];

        // 1. Suggest Object if in FROM clause
        if (clause === 'FROM') {
             // If we have an object token and the cursor is AFTER it (meaning we finished typing it)
             // Then we should NOT suggest objects anymore, but keywords (like WHERE, LIMIT, etc.)
             if (objectToken && cursorPos > objectToken.end) {
                 // Fall through to keyword suggestions
             } else {
                 suggestions = objectsCache
                    .filter(obj => obj.name.toLowerCase().includes(activeWord.toLowerCase()))
                    .map(obj => ({
                        text: obj.name,
                        label: obj.label,
                        type: 'object'
                    }));
                 return suggestions.slice(0, 50);
             }
        }

        // 2. Suggest Fields if we have an object and are in SELECT, WHERE, ORDER BY, GROUP BY, HAVING
        if (objectName && ['SELECT', 'WHERE', 'ORDER BY', 'GROUP BY', 'HAVING'].includes(clause)) {
            // Ensure fields are loaded
            if (!fieldsCache[objectName] && !loadingMetadata) {
                fetchFields(objectName);
            }

            const fields = fieldsCache[objectName] || [];
            const fieldSuggestions = fields
                .filter(f => f.name.toLowerCase().includes(activeWord.toLowerCase()))
                .map(f => ({
                    text: f.name,
                    label: f.label,
                    type: f.type
                }));
            
            suggestions = [...suggestions, ...fieldSuggestions];
        }

        // 3. Suggest Keywords (Context sensitive could be better, but global is okay for now)
        // Filter keywords that match
        const keywordSuggestions = SOQL_KEYWORDS
            .filter(k => k.startsWith(upperWord) && k !== upperWord) // Don't suggest if already typed exactly
            .map(k => ({ text: k, type: 'keyword' }));

        suggestions = [...suggestions, ...keywordSuggestions];

        // Sort: Exact matches first, then startsWith, then includes
        suggestions.sort((a, b) => {
            const aText = a.text.toLowerCase();
            const bText = b.text.toLowerCase();
            const word = activeWord.toLowerCase();
            
            const aStarts = aText.startsWith(word);
            const bStarts = bText.startsWith(word);
            
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            
            return aText.localeCompare(bText);
        });

        return suggestions.slice(0, 20);
    }, [objectsCache, fieldsCache, fetchFields, loadingMetadata]);

    // Handle editor key down for execution
    const handleEditorKeyDown = (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            executeQuery();
        }
    };

    // Handle query change and update suggestions
    const handleQueryChange = (newQuery) => {
        setQuery(newQuery);
    };

    // Update suggestions when query or cursor changes (debounced slightly or on effect)
    useEffect(() => {
        const textarea = document.querySelector('textarea.npm__react-simple-code-editor__textarea');
        if (textarea) {
             const pos = textarea.selectionStart;
             setCursorPosition(pos);
             const newSuggestions = getSuggestions(query, pos);
             setSuggestions(newSuggestions);
             setShowSuggestions(newSuggestions.length > 0);
             setSelectedSuggestionIndex(0); // Auto-select first suggestion
        } else {
             // Fallback
             const pos = query.length;
             setCursorPosition(pos);
             const newSuggestions = getSuggestions(query, pos);
             setSuggestions(newSuggestions);
             setShowSuggestions(newSuggestions.length > 0);
             setSelectedSuggestionIndex(0); // Auto-select first suggestion
        }
    }, [query, getSuggestions]);

    // Apply selected suggestion
    const applySuggestion = (suggestion) => {
        const suggestionText = typeof suggestion === 'string' ? suggestion : suggestion.text;
        
        // We need to replace the "active word" with the suggestion
        const { activeWord } = getQueryContext(query, cursorPosition);
        
        const beforeCursor = query.substring(0, cursorPosition);
        const afterCursor = query.substring(cursorPosition);
        
        // If we are in the middle of a word, remove the whole word
        let start = cursorPosition;
        while (start > 0 && /[a-zA-Z0-9_]/.test(query[start - 1])) {
            start--;
        }
        
        let end = cursorPosition;
        while (end < query.length && /[a-zA-Z0-9_]/.test(query[end])) {
            end++;
        }
        
        // Add a space after the suggestion
        const newQuery = query.substring(0, start) + suggestionText + ' ' + query.substring(end);
        
        setQuery(newQuery);
        setShowSuggestions(false);
    };

    // Global key listener for suggestions
    useEffect(() => {
        if (!showSuggestions) return;

        const handleGlobalKeyDown = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedSuggestionIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (suggestions.length > 0) {
                    applySuggestion(suggestions[selectedSuggestionIndex]);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setShowSuggestions(false);
            } else if (e.key === 'Tab') {
                 e.preventDefault();
                 if (suggestions.length > 0) {
                     applySuggestion(suggestions[selectedSuggestionIndex]);
                 }
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [showSuggestions, suggestions, selectedSuggestionIndex, applySuggestion]);


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

            {/* Save Query Modal */}
            {isSaveModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsSaveModalOpen(false)}>
                    <div 
                        className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-6"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Query</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Query Name</label>
                                <input
                                    type="text"
                                    value={newQueryName}
                                    onChange={(e) => setNewQueryName(e.target.value)}
                                    placeholder="e.g., Active Accounts"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsSaveModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveQuery}
                                    disabled={savingQuery}
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {savingQuery ? "Saving..." : "Save"}
                                </button>
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
                            >
                                <Editor
                                    value={query}
                                    onValueChange={handleQueryChange}
                                    onKeyDown={handleEditorKeyDown}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
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

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={executeQuery}
                                disabled={executing || !query.trim()}
                                className={`
                                    flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-200 transition-all
                                    ${executing || !query.trim()
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-300 hover:-translate-y-0.5 active:translate-y-0'
                                    }
                                `}
                            >
                                {executing ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Executing...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Execute Query
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setIsSaveModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                </svg>
                                Save Query
                            </button>
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                            <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200">Ctrl + Enter</span> to execute
                        </div>
                    </div>

                    {/* Saved Queries Section */}
                    {savedQueries.length > 0 && (
                        <div className="border-t border-gray-100 pt-6 mt-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                                Saved Queries
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {savedQueries.map((sq) => (
                                    <div 
                                        key={sq.id}
                                        onClick={() => loadSavedQuery(sq)}
                                        className="group relative flex items-start justify-between p-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
                                    >
                                        <div className="flex-1 min-w-0 mr-2">
                                            <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                                                {sq.name}
                                            </h4>
                                            <p className="text-xs text-gray-500 font-mono truncate mt-1 opacity-70">
                                                {sq.query}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteQuery(sq.id, e)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            title="Delete query"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700 font-mono whitespace-pre-wrap">
                        {error}
                    </div>
                )}

                {results && (
                    <section className="rounded-3xl bg-white p-6 shadow-xl overflow-hidden">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <h2 className="text-lg font-bold text-gray-900">Query Results</h2>
                                <span className="text-sm text-gray-500">Total Records: {getProcessedResults().totalSize}</span>
                            </div>
                            <button
                                onClick={exportToCSV}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Export CSV
                            </button>
                        </div>

                        {/* Active Filters */}
                        {Object.keys(columnFilters).length > 0 && (
                            <div className="mb-4 flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-medium text-gray-600">Active Filters:</span>
                                {Object.entries(columnFilters).map(([column, filter]) => (
                                    <div key={column} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-medium text-indigo-700">
                                        <span className="font-semibold">{column}</span>
                                        <span className="text-indigo-500">·</span>
                                        <span className="capitalize">{filter.type.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        {filter.value && (
                                            <>
                                                <span className="text-indigo-500">·</span>
                                                <span className="max-w-[100px] truncate">{filter.value}</span>
                                            </>
                                        )}
                                        <button
                                            onClick={() => removeColumnFilter(column)}
                                            className="ml-1 p-0.5 rounded-full hover:bg-indigo-100 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={clearAllFilters}
                                    className="text-xs text-red-600 hover:text-red-700 font-medium underline"
                                >
                                    Clear All
                                </button>
                            </div>
                        )}

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
                                                        className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider group relative"
                                                    >
                                                        <div className="flex items-center gap-2 justify-between">
                                                            <div 
                                                                onClick={() => handleSort(key)}
                                                                className="flex items-center gap-2 cursor-pointer hover:text-blue-100 transition-colors"
                                                            >
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
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openFilterModal(key);
                                                                }}
                                                                className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/20 transition-all ${columnFilters[key] ? '!opacity-100 bg-white/20' : ''}`}
                                                                title="Filter column"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${columnFilters[key] ? 'text-yellow-300' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </th>
                                                ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {getProcessedResults().records.map((record, idx) => (
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

                {/* Filter Modal */}
                {showFilterModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowFilterModal(false)}>
                        <div 
                            className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Column: {activeFilterColumn}</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Filter Type</label>
                                    <select
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="contains">Contains</option>
                                        <option value="equals">Equals</option>
                                        <option value="notEquals">Not Equals</option>
                                        <option value="startsWith">Starts With</option>
                                        <option value="endsWith">Ends With</option>
                                        <option value="greaterThan">Greater Than</option>
                                        <option value="lessThan">Less Than</option>
                                        <option value="isNull">Is Null/Empty</option>
                                        <option value="isNotNull">Is Not Null/Empty</option>
                                    </select>
                                </div>

                                {!['isNull', 'isNotNull'].includes(filterType) && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Filter Value</label>
                                        <input
                                            type="text"
                                            value={filterValue}
                                            onChange={(e) => setFilterValue(e.target.value)}
                                            placeholder="Enter value..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            autoFocus
                                        />
                                    </div>
                                )}

                                <div className="flex justify-between gap-3 pt-2">
                                    <div>
                                        {columnFilters[activeFilterColumn] && (
                                            <button
                                                onClick={() => {
                                                    removeColumnFilter(activeFilterColumn);
                                                    setShowFilterModal(false);
                                                }}
                                                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                Remove Filter
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowFilterModal(false)}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={applyColumnFilter}
                                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                                        >
                                            Apply Filter
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Dialog */}
                <ConfirmDialog
                    isOpen={showDeleteConfirm}
                    onClose={() => {
                        setShowDeleteConfirm(false);
                        setQueryToDelete(null);
                    }}
                    onConfirm={confirmDeleteQuery}
                    title="Delete Saved Query"
                    message="Are you sure you want to delete this saved query? This action cannot be undone."
                    confirmText="Delete"
                    cancelText="Cancel"
                    confirmButtonClass="bg-red-600 hover:bg-red-700"
                />
            </div>
        </div>
    );
}
