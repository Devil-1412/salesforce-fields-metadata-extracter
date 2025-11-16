"use client";
import { useState, useEffect } from "react";
import {
    User,
    Building2,
    Shield,
    Settings,
    LifeBuoy,
    LogOut,
    Mail,
    Calendar,
    CheckCircle2,
    Key,
    Bell,
    Moon,
    Sun,
    Globe,
    Lock,
    Eye,
    EyeOff,
    Copy,
    ExternalLink,
    HelpCircle,
    FileText,
    MessageSquare,
    Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ProfilePage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("profile");
    const [user, setUser] = useState({});
    const [organizations, setOrganizations] = useState(null);
    const [loading, setLoading] = useState(true);
    const [orgForm, setOrgForm] = useState({
        orgEmail: "",
        orgPassword: "",
        securityToken: "",
        isSandbox: false
    });
    const [showPassword, setShowPassword] = useState(false);
    const [preferences, setPreferences] = useState({
        theme: "light",
        notifications: true,
        emailUpdates: true,
        language: "en"
    });
    const [securitySettings, setSecuritySettings] = useState({
        twoFactorEnabled: false,
        profileVisible: true,
        dataSharing: false
    });
    const [sessions, setSessions] = useState([]);
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({ full_name: "" });
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [showPasswordFields, setShowPasswordFields] = useState({
        current: false,
        new: false,
        confirm: false
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
                    setOrganizations(data.organization);
                    setProfileForm({ full_name: data.user.full_name || "" });
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

        const fetchPreferences = async () => {
            try {
                const res = await fetch("/api/userPreferences", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: sessionStorage.getItem("email"),
                        action: "get"
                    }),
                });
                const data = await res.json();
                if (data.success && data.preferences) {
                    setPreferences(data.preferences);
                }
            } catch (err) {
                console.error("Fetch preferences error:", err);
            }
        };

        const fetchSecuritySettings = async () => {
            try {
                const res = await fetch("/api/securitySettings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: sessionStorage.getItem("email"),
                        action: "getSecuritySettings"
                    }),
                });
                const data = await res.json();
                if (data.success && data.data) {
                    setSecuritySettings({
                        twoFactorEnabled: data.data.two_factor_enabled || false,
                        profileVisible: data.data.profile_visible ?? true,
                        dataSharing: data.data.data_sharing ?? false
                    });
                }
            } catch (err) {
                console.error("Fetch security settings error:", err);
            }
        };

        const fetchSessions = async () => {
            try {
                const res = await fetch("/api/securitySettings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: sessionStorage.getItem("email"),
                        action: "getSessions"
                    }),
                });
                const data = await res.json();
                if (data.success && data.data?.sessions) {
                    setSessions(data.data.sessions);
                }
            } catch (err) {
                console.error("Fetch sessions error:", err);
            }
        };

        fetchProfile();
        fetchPreferences();
        fetchSecuritySettings();
        fetchSessions();
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
                // Refresh organizations
                const profileRes = await fetch("/api/profile", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: user.email }),
                });
                const profileData = await profileRes.json();
                if (profileData.success) {
                    setOrganizations(profileData.organization);
                }
                // Reset form
                setOrgForm({
                    orgEmail: "",
                    orgPassword: "",
                    securityToken: "",
                    isSandbox: false
                });
            } else {
                toast.error(`${data.error || "Org could not be added."}`);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to add organization");
        }
    };

    const handleDeleteOrg = async (orgId) => {
        if (!confirm("Are you sure you want to delete this organization?")) return;

        try {
            const res = await fetch("/api/deleteOrg", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: user.email,
                    orgId: orgId
                }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success("Organization deleted successfully");
                // Refresh organizations
                const profileRes = await fetch("/api/profile", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: user.email }),
                });
                const profileData = await profileRes.json();
                if (profileData.success) {
                    setOrganizations(profileData.organization);
                }
            } else {
                toast.error(data.error || "Failed to delete organization");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete organization");
        }
    };

    const handleUpdateProfile = async () => {
        try {
            const res = await fetch("/api/updateProfile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: user.email,
                    full_name: profileForm.full_name
                }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success("Profile updated successfully");
                setUser(data.user);
                setEditingProfile(false);
            } else {
                toast.error(data.error || "Failed to update profile");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to update profile");
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        try {
            const res = await fetch("/api/changePassword", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: user.email,
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword
                }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success("Password changed successfully");
                setShowPasswordChange(false);
                setPasswordForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: ""
                });
            } else {
                toast.error(data.error || "Failed to change password");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to change password");
        }
    };

    const handleToggle2FA = async (enabled) => {
        try {
            const res = await fetch("/api/securitySettings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: user.email,
                    action: "toggle2FA",
                    data: { enabled }
                }),
            });

            const data = await res.json();
            if (data.success) {
                setSecuritySettings(prev => ({
                    ...prev,
                    twoFactorEnabled: data.data.two_factor_enabled
                }));
                toast.success(`2FA ${enabled ? 'enabled' : 'disabled'} successfully`);
            } else {
                toast.error(data.error || "Failed to update 2FA settings");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to update 2FA settings");
        }
    };

    const handleUpdatePrivacy = async (field, value) => {
        try {
            const updateData = {};
            if (field === "profileVisible") {
                updateData.profileVisible = value;
            } else if (field === "dataSharing") {
                updateData.dataSharing = value;
            }

            const res = await fetch("/api/securitySettings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: user.email,
                    action: "updatePrivacy",
                    data: updateData
                }),
            });

            const data = await res.json();
            if (data.success) {
                setSecuritySettings(prev => ({
                    ...prev,
                    ...updateData
                }));
                toast.success("Privacy settings updated");
            } else {
                toast.error(data.error || "Failed to update privacy settings");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to update privacy settings");
        }
    };

    const handleRevokeAllSessions = async () => {
        if (!confirm("Are you sure you want to sign out from all devices?")) return;

        try {
            const res = await fetch("/api/securitySettings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: user.email,
                    action: "revokeAllSessions"
                }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success("Signed out from all devices");
                setSessions([]);
            } else {
                toast.error(data.error || "Failed to revoke sessions");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to revoke sessions");
        }
    };

    const handleUpdatePreferences = async (updatedPrefs) => {
        try {
            const res = await fetch("/api/userPreferences", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: user.email,
                    action: "update",
                    preferences: updatedPrefs
                }),
            });

            const data = await res.json();
            if (data.success) {
                setPreferences(data.preferences);
                toast.success("Preferences saved successfully");
            } else {
                toast.error(data.error || "Failed to update preferences");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to update preferences");
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
                    <div className="space-y-6">
                        {/* Profile Header */}
                        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-white/20 rounded-full blur-xl"></div>
                                    <div className="relative w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30">
                                        <User className="w-12 h-12 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-3xl font-bold mb-2">
                                        {user.full_name || "User Profile"}
                                    </h1>
                                    <div className="flex items-center gap-2 text-blue-100">
                                        <Mail className="w-4 h-4" />
                                        <span>{user.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 text-blue-100">
                                        <Calendar className="w-4 h-4" />
                                        <span>Member since {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-600">Organizations</span>
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                </div>
                                <p className="text-3xl font-bold text-gray-900">
                                    {organizations ? (Array.isArray(organizations) ? organizations.length : 1) : 0}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Connected orgs</p>
                            </div>
                            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-600">Status</span>
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                </div>
                                <p className="text-3xl font-bold text-gray-900">Active</p>
                                <p className="text-xs text-gray-500 mt-1">Account verified</p>
                            </div>
                            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-600">Last Login</span>
                                    <Calendar className="w-5 h-5 text-indigo-600" />
                                </div>
                                <p className="text-3xl font-bold text-gray-900">Today</p>
                                <p className="text-xs text-gray-500 mt-1">Just now</p>
                            </div>
                        </div>

                        {/* Profile Details */}
                        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
                                {!editingProfile && (
                                    <button
                                        onClick={() => setEditingProfile(true)}
                                        className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>
                            {editingProfile ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={profileForm.full_name}
                                            onChange={(e) => setProfileForm({ full_name: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 py-3 border-b border-gray-100">
                                        <Mail className="w-5 h-5 text-gray-400" />
                                        <span className="text-sm font-medium text-gray-600">Email Address</span>
                                        <span className="ml-auto text-sm text-gray-900">{user.email}</span>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleUpdateProfile}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                        >
                                            Save Changes
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingProfile(false);
                                                setProfileForm({ full_name: user.full_name || "" });
                                            }}
                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <Mail className="w-5 h-5 text-gray-400" />
                                            <span className="text-sm font-medium text-gray-600">Email Address</span>
                                        </div>
                                        <span className="text-sm text-gray-900">{user.email}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <User className="w-5 h-5 text-gray-400" />
                                            <span className="text-sm font-medium text-gray-600">Full Name</span>
                                        </div>
                                        <span className="text-sm text-gray-900">{user.full_name || "Not set"}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-3">
                                        <div className="flex items-center gap-3">
                                            <Shield className="w-5 h-5 text-gray-400" />
                                            <span className="text-sm font-medium text-gray-600">Account Type</span>
                                        </div>
                                        <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">Standard</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case "organization":
                return (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Connected Organizations</h2>
                                <p className="text-sm text-gray-500 mt-1">Manage your Salesforce organization connections</p>
                            </div>
                            <button
                                onClick={() => {
                                    const form = document.getElementById('org-form');
                                    form?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                            >
                                <Building2 className="w-4 h-4" />
                                Add Organization
                            </button>
                        </div>

                        {/* Existing Organizations Section */}
                        {organizations && (Array.isArray(organizations) ? organizations.length > 0 : organizations) ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(Array.isArray(organizations) ? organizations : [organizations]).map((org, idx) => (
                                    <div key={org.id || idx} className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-3 rounded-lg ${org.is_sandbox ? 'bg-yellow-100' : 'bg-green-100'}`}>
                                                    <Building2 className={`w-6 h-6 ${org.is_sandbox ? 'text-yellow-600' : 'text-green-600'}`} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900">Organization {idx + 1}</h3>
                                                    <p className="text-xs text-gray-500">Connected</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`px-3 py-1 text-xs font-semibold rounded-full ${org.is_sandbox
                                                        ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                                        : "bg-green-100 text-green-700 border border-green-200"
                                                        }`}
                                                >
                                                    {org.is_sandbox ? "Sandbox" : "Production"}
                                                </span>
                                                {org.id && (
                                                    <button
                                                        onClick={() => handleDeleteOrg(org.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete organization"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-3 mb-4">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Mail className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-600">{org.org_email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Globe className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-600 truncate">{org.instance_url || "—"}</span>
                                                {org.instance_url && (
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(org.instance_url);
                                                            toast.success("URL copied to clipboard");
                                                        }}
                                                        className="p-1 hover:bg-gray-100 rounded"
                                                    >
                                                        <Copy className="w-3 h-3 text-gray-400" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                                            <span className="text-sm text-green-600 font-medium">Connected Successfully</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
                                <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Organizations Connected</h3>
                                <p className="text-sm text-gray-500 mb-6">Connect your first Salesforce organization to get started</p>
                            </div>
                        )}

                        {/* Add Organization Form */}
                        <div id="org-form" className="mt-8">
                            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                    Connect New Organization
                                </h3>
                                <OrganizationForm
                                    orgForm={orgForm}
                                    setOrgForm={setOrgForm}
                                    handleAddOrg={handleAddOrg}
                                    showPassword={showPassword}
                                    setShowPassword={setShowPassword}
                                />
                            </div>
                        </div>
                    </div>
                );


            case "security":
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Security Settings</h2>
                            <p className="text-sm text-gray-500 mt-1">Manage your account security and privacy</p>
                        </div>

                        {/* Password Section */}
                        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Key className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Password</h3>
                                    <p className="text-sm text-gray-500">Update your account password</p>
                                </div>
                            </div>
                            {showPasswordChange ? (
                                <form onSubmit={handleChangePassword} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Current Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPasswordFields.current ? "text" : "password"}
                                                value={passwordForm.currentPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                                required
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswordFields({ ...showPasswordFields, current: !showPasswordFields.current })}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            >
                                                {showPasswordFields.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPasswordFields.new ? "text" : "password"}
                                                value={passwordForm.newPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                required
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswordFields({ ...showPasswordFields, new: !showPasswordFields.new })}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            >
                                                {showPasswordFields.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Confirm New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPasswordFields.confirm ? "text" : "password"}
                                                value={passwordForm.confirmPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                required
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswordFields({ ...showPasswordFields, confirm: !showPasswordFields.confirm })}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            >
                                                {showPasswordFields.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                        >
                                            Update Password
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowPasswordChange(false);
                                                setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                                            }}
                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <button
                                    onClick={() => setShowPasswordChange(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                >
                                    Change Password
                                </button>
                            )}
                        </div>

                        {/* Two-Factor Authentication */}
                        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-100 rounded-lg">
                                        <Shield className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
                                        <p className="text-sm text-gray-500">Add an extra layer of security</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={securitySettings.twoFactorEnabled}
                                        onChange={(e) => handleToggle2FA(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                            <p className="text-xs text-gray-500">Enable 2FA to protect your account from unauthorized access</p>
                        </div>

                        {/* Active Sessions */}
                        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Globe className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Active Sessions</h3>
                                    <p className="text-sm text-gray-500">Manage your active login sessions</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {sessions.length > 0 ? (
                                    sessions.map((session) => (
                                        <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {session.device_info || "Unknown Device"}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {session.user_agent || "Unknown Browser"} • {new Date(session.last_activity).toLocaleString()}
                                                </p>
                                                {session.ip_address && (
                                                    <p className="text-xs text-gray-400 mt-1">IP: {session.ip_address}</p>
                                                )}
                                            </div>
                                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Active</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Current Session</p>
                                            <p className="text-xs text-gray-500">Chrome on Windows • {new Date().toLocaleString()}</p>
                                        </div>
                                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Active</span>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleRevokeAllSessions}
                                className="mt-4 text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                                Sign out from all devices
                            </button>
                        </div>

                        {/* Privacy Settings */}
                        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Lock className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Privacy</h3>
                                    <p className="text-sm text-gray-500">Control your data visibility</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Profile Visibility</p>
                                        <p className="text-xs text-gray-500">Make your profile visible to others</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={securitySettings.profileVisible}
                                        onChange={(e) => handleUpdatePrivacy("profileVisible", e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                </label>
                                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Data Sharing</p>
                                        <p className="text-xs text-gray-500">Allow analytics data collection</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={securitySettings.dataSharing}
                                        onChange={(e) => handleUpdatePrivacy("dataSharing", e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                );

            case "preferences":
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Preferences</h2>
                            <p className="text-sm text-gray-500 mt-1">Customize your experience</p>
                        </div>

                        {/* Theme Settings */}
                        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-yellow-100 rounded-lg">
                                    <Sun className="w-5 h-5 text-yellow-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Theme</h3>
                                    <p className="text-sm text-gray-500">Choose your preferred theme</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleUpdatePreferences({ ...preferences, theme: 'light' })}
                                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${preferences.theme === 'light'
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <Sun className={`w-6 h-6 mx-auto mb-2 ${preferences.theme === 'light' ? 'text-blue-600' : 'text-gray-400'}`} />
                                    <p className={`text-sm font-medium ${preferences.theme === 'light' ? 'text-blue-600' : 'text-gray-600'}`}>Light</p>
                                </button>
                                <button
                                    onClick={() => handleUpdatePreferences({ ...preferences, theme: 'dark' })}
                                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${preferences.theme === 'dark'
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <Moon className={`w-6 h-6 mx-auto mb-2 ${preferences.theme === 'dark' ? 'text-blue-600' : 'text-gray-400'}`} />
                                    <p className={`text-sm font-medium ${preferences.theme === 'dark' ? 'text-blue-600' : 'text-gray-600'}`}>Dark</p>
                                </button>
                            </div>
                        </div>

                        {/* Notifications */}
                        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Bell className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                                    <p className="text-sm text-gray-500">Manage your notification preferences</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                                        <p className="text-xs text-gray-500">Receive updates via email</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={preferences.emailUpdates}
                                        onChange={(e) => handleUpdatePreferences({ ...preferences, emailUpdates: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                </label>
                                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Push Notifications</p>
                                        <p className="text-xs text-gray-500">Receive browser notifications</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={preferences.notifications}
                                        onChange={(e) => handleUpdatePreferences({ ...preferences, notifications: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Language */}
                        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Globe className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Language</h3>
                                    <p className="text-sm text-gray-500">Select your preferred language</p>
                                </div>
                            </div>
                            <select
                                value={preferences.language}
                                onChange={(e) => handleUpdatePreferences({ ...preferences, language: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                                <option value="de">German</option>
                            </select>
                        </div>
                    </div>
                );

            case "support":
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Support & Help</h2>
                            <p className="text-sm text-gray-500 mt-1">Get help and contact our support team</p>
                        </div>

                        {/* Support Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 hover:shadow-lg transition-all cursor-pointer">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-blue-600 rounded-lg">
                                        <MessageSquare className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">Contact Support</h3>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">Get in touch with our support team for assistance</p>
                                <a
                                    href="mailto:support@salesmeta.ai"
                                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                                >
                                    support@salesmeta.ai
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>

                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 hover:shadow-lg transition-all cursor-pointer">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-green-600 rounded-lg">
                                        <FileText className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">Documentation</h3>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">Browse our comprehensive documentation</p>
                                <a
                                    href="/docs"
                                    className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm"
                                >
                                    View Docs
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>

                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100 hover:shadow-lg transition-all cursor-pointer">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-purple-600 rounded-lg">
                                        <HelpCircle className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">FAQs</h3>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">Find answers to frequently asked questions</p>
                                <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                                    View FAQs
                                </button>
                            </div>

                            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100 hover:shadow-lg transition-all cursor-pointer">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-orange-600 rounded-lg">
                                        <LifeBuoy className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">Live Chat</h3>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">Chat with our support team in real-time</p>
                                <button className="text-orange-600 hover:text-orange-700 font-medium text-sm">
                                    Start Chat
                                </button>
                            </div>
                        </div>

                        {/* Quick Help */}
                        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Help</h3>
                            <div className="space-y-3">
                                <button className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <p className="font-medium text-gray-900">How to connect a Salesforce organization?</p>
                                    <p className="text-sm text-gray-500 mt-1">Learn how to add and manage your Salesforce orgs</p>
                                </button>
                                <button className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <p className="font-medium text-gray-900">Troubleshooting connection issues</p>
                                    <p className="text-sm text-gray-500 mt-1">Common issues and their solutions</p>
                                </button>
                                <button className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <p className="font-medium text-gray-900">Understanding metadata extraction</p>
                                    <p className="text-sm text-gray-500 mt-1">Learn about our metadata tools</p>
                                </button>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    if (loading)
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-lg font-medium text-gray-600">Loading profile...</p>
                </div>
            </div>
        );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar */}
                    <aside className="lg:w-64 w-full">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                            {/* Profile Header in Sidebar */}
                            <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-6 text-white">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-lg font-bold truncate">{user.full_name || "User"}</h2>
                                        <p className="text-xs text-blue-100 truncate">{user.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation */}
                            <nav className="p-4 space-y-1">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id
                                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                                            : "text-gray-700 hover:bg-gray-100"
                                            }`}
                                    >
                                        {tab.icon}
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>

                            {/* Logout */}
                            <div className="p-4 border-t border-gray-100">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 w-full text-left text-red-600 font-medium px-4 py-3 hover:bg-red-50 rounded-xl transition"
                                >
                                    <LogOut size={18} />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Main content */}
                    <main className="flex-1">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 lg:p-8">
                            {renderContent()}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}

function OrganizationForm({ orgForm, setOrgForm, handleAddOrg, showPassword, setShowPassword }) {
    return (
        <form
            onSubmit={handleAddOrg}
            className="space-y-4"
        >
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Email
                </label>
                <input
                    type="email"
                    placeholder="user@example.com"
                    value={orgForm.orgEmail}
                    onChange={(e) =>
                        setOrgForm({ ...orgForm, orgEmail: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Password
                </label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={orgForm.orgPassword}
                        onChange={(e) =>
                            setOrgForm({ ...orgForm, orgPassword: e.target.value })
                        }
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Security Token
                </label>
                <input
                    type="text"
                    placeholder="Enter security token"
                    value={orgForm.securityToken}
                    onChange={(e) =>
                        setOrgForm({ ...orgForm, securityToken: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Get your security token from Salesforce settings</p>
            </div>

            {/* Sandbox Toggle */}
            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                    type="checkbox"
                    checked={orgForm.isSandbox}
                    onChange={(e) =>
                        setOrgForm({ ...orgForm, isSandbox: e.target.checked })
                    }
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                    <span className="text-sm font-medium text-gray-900">Sandbox Organization</span>
                    <p className="text-xs text-gray-500">Check if this is a Salesforce sandbox environment</p>
                </div>
            </label>

            <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] transition-all font-semibold flex items-center justify-center gap-2"
            >
                <Building2 className="w-5 h-5" />
                Connect Organization
            </button>
        </form>
    );
}

