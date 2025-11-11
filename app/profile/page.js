"use client";
import { useState, useEffect } from "react";
import {
    User,
    Building2,
    Shield,
    Settings,
    LifeBuoy,
    LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ProfilePage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("profile");
    const [user, setUser] = useState({});
    const [organization, setOrganization] = useState(null);
    const [loading, setLoading] = useState(true);
    const [orgForm, setOrgForm] = useState({
        orgEmail: "",
        orgPassword: "",
        securityToken: "",
        isSandbox: false
    });

    useEffect(() => {
        const email = sessionStorage.getItem("email");
        if (!email) return router.push("/login");

        const fetchProfile = async () => {
            try {
                const res = await fetch("/api/profile", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                });
                const data = await res.json();
                if (data.success) {
                    setUser(data.user);
                    setOrganization(data.organization);
                }
                else {
                    toast.error(`${data.error || "User not found."}`);
                }
            } catch (err) {
                console.error("Fetch profile error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    const handleLogout = () => {
        sessionStorage.clear();
        router.push("/");
        window.location.reload();
    };

    const handleAddOrg = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/addOrg", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: user.email,
                    ...orgForm,
                }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success("Org added successfully.");
                setOrganization({
                    org_email: orgForm.orgEmail,
                    instance_url: "Not Set",
                });
            } else {
                toast.error(`${data.error || "Org could not be added."}`);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const tabs = [
        { id: "profile", label: "Profile", icon: <User size={18} /> },
        { id: "organization", label: "Organization", icon: <Building2 size={18} /> },
        { id: "security", label: "Security", icon: <Shield size={18} /> },
        { id: "preferences", label: "Preferences", icon: <Settings size={18} /> },
        { id: "support", label: "Support", icon: <LifeBuoy size={18} /> },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case "profile":
                return (
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">👤 User Profile</h2>
                        <p className="text-gray-600">Email: {user.email}</p>
                        <p className="text-gray-600 mt-2">
                            Full Name: {user.full_name || "Not available"}
                        </p>
                    </div>
                );

            case "organization":
                return (
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                            🏢 Connected Organizations
                        </h2>

                        {/* Existing Organizations Section */}
                        {organization ? (
                            <div className="space-y-4">
                                <div className="border border-gray-200 rounded-2xl p-6 bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm hover:shadow-md transition-all max-w-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-lg font-semibold text-gray-800">Primary Organization</h3>
                                        <span
                                            className={`px-3 py-1 text-xs font-medium rounded-full ${organization.is_sandbox
                                                ? "bg-yellow-100 text-yellow-700"
                                                : "bg-green-100 text-green-700"
                                                }`}
                                        >
                                            {organization.is_sandbox ? "Sandbox" : "Production"}
                                        </span>
                                    </div>

                                    <div className="text-sm text-gray-700 space-y-1">
                                        <p>
                                            <strong>Email:</strong> {organization.org_email}
                                        </p>
                                        <p>
                                            <strong>Instance URL:</strong>{" "}
                                            {organization.instance_url || "—"}
                                        </p>
                                        <p className="text-green-600 font-medium mt-2">
                                            ✅ Connected Successfully
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <h4 className="text-gray-700 font-medium mb-3">
                                        ➕ Add Another Organization
                                    </h4>
                                    <OrganizationForm
                                        orgForm={orgForm}
                                        setOrgForm={setOrgForm}
                                        handleAddOrg={handleAddOrg}
                                    />
                                </div>
                            </div>
                        ) : (
                            // If no org exists yet
                            <OrganizationForm
                                orgForm={orgForm}
                                setOrgForm={setOrgForm}
                                handleAddOrg={handleAddOrg}
                            />
                        )}
                    </div>
                );


            case "security":
                return (
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">🔒 Security Settings</h2>
                        <p className="text-gray-600">
                            Manage your password, 2FA, and active sessions.
                        </p>
                    </div>
                );

            case "preferences":
                return (
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">⚙️ Preferences</h2>
                        <p className="text-gray-600">
                            Choose themes, notification preferences, and more.
                        </p>
                    </div>
                );

            case "support":
                return (
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">💬 Support</h2>
                        <p className="text-gray-600">
                            Need help? Reach out to <strong>support@salesmeta.ai</strong>
                        </p>
                    </div>
                );

            default:
                return null;
        }
    };

    if (loading)
        return (
            <div className="flex h-screen items-center justify-center text-gray-600">
                <p className="animate-pulse text-lg font-medium">Loading profile...</p>
            </div>
        );

    return (
        <div className="min-h-[90vh] flex bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 shadow-md flex flex-col justify-between">
                <div>
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800">My Account</h2>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                    <nav className="flex-1 p-4 space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                    ? "bg-blue-100 text-blue-700"
                                    : "text-gray-600 hover:bg-gray-100"
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full text-left text-red-600 font-medium px-3 py-2 hover:bg-red-50 rounded-lg transition"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 p-8 bg-white shadow-inner rounded-l-3xl">
                {renderContent()}
            </main>
        </div>
    );
}

function OrganizationForm({ orgForm, setOrgForm, handleAddOrg }) {
    return (
        <form
            onSubmit={handleAddOrg}
            className="border border-gray-200 rounded-2xl p-6 bg-gradient-to-br from-white to-gray-50 shadow-md hover:shadow-lg transition-all max-w-md"
        >
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                🧩 Connect Salesforce Org
            </h4>

            <div className="space-y-3">
                <input
                    type="email"
                    placeholder="Organization Email"
                    value={orgForm.orgEmail}
                    onChange={(e) =>
                        setOrgForm({ ...orgForm, orgEmail: e.target.value })
                    }
                    required
                    className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                    type="password"
                    placeholder="Organization Password"
                    value={orgForm.orgPassword}
                    onChange={(e) =>
                        setOrgForm({ ...orgForm, orgPassword: e.target.value })
                    }
                    required
                    className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                    type="text"
                    placeholder="Security Token"
                    value={orgForm.securityToken}
                    onChange={(e) =>
                        setOrgForm({ ...orgForm, securityToken: e.target.value })
                    }
                    required
                    className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
                />

                {/* ✅ Sandbox Toggle */}
                <label className="flex items-center gap-2 text-gray-700 mt-2 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={orgForm.isSandbox}
                        onChange={(e) =>
                            setOrgForm({ ...orgForm, isSandbox: e.target.checked })
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm">This is a Sandbox Organization</span>
                </label>

                <button
                    type="submit"
                    className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg shadow-md hover:bg-blue-700 transition w-full"
                >
                    Connect Organization
                </button>
            </div>
        </form>
    );
}

