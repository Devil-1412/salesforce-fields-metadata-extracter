// app/components/Navbar.js
'use client';

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut, Settings, User, Sparkles, ChevronDown, Zap } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

import { useAuth } from "../context/authContext";

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, user, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const menuRef = useRef(null);
    const profileRef = useRef(null);

    const handleLogout = async () => {
        await logout();
        setProfileOpen(false);
    };

    const fullName = user?.full_name || "";
    const userEmail = user?.email || "";

    const publicNav = [
        { href: "/", label: "Home" },
        { href: "/pricing", label: "Pricing" },
        { href: "/docs", label: "Docs" },
        { href: "/about", label: "About" },
    ];

    // Dropdown structure for private nav
    const privateNav = [
        { href: "/", label: "Dashboard" },
        {
            label: "Object Analysis",
            dropdown: [
                { href: "/objectAnalysis", label: "Object Analysis" },
                { href: "/metadata", label: "Metadata" },
            ],
        },
        {
            label: "Compare Orgs",
            dropdown: [
                { href: "/compare", label: "Compare" },
                { href: "/compareFields", label: "Compare Fields" },
            ],
        },
        { href: "/tools", label: "Tools" },
        { href: "/soql", label: "SOQL" },
    ];

    // small helper to show/hide profile menu with slight delay for mouse movement
    useEffect(() => {
        let timer = null;
        const wrapper = document.getElementById("nav-profile-wrapper");
        const menu = document.getElementById("nav-profile-menu");

        if (!wrapper || !menu) return;

        const show = () => {
            clearTimeout(timer);
            menu.classList.remove("hidden");
        };
        const hide = () => {
            timer = setTimeout(() => menu.classList.add("hidden"), 200);
        };

        wrapper.addEventListener("mouseenter", show);
        wrapper.addEventListener("mouseleave", hide);
        menu.addEventListener("mouseenter", show);
        menu.addEventListener("mouseleave", hide);

        return () => {
            wrapper.removeEventListener("mouseenter", show);
            wrapper.removeEventListener("mouseleave", hide);
            menu.removeEventListener("mouseenter", show);
            menu.removeEventListener("mouseleave", hide);
            clearTimeout(timer);
        };
    }, [isAuthenticated]);

    const handleDropdownToggle = (label) => {
        setActiveDropdown((prev) => (prev === label ? null : label));
    };

    const handleClickOutside = (e) => {
        if (!e.target.closest(".dropdown-container")) {
            setActiveDropdown(null);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                (menuRef.current && !menuRef.current.contains(e.target)) ||
                (profileRef.current && !profileRef.current.contains(e.target))
            ) {
                setMenuOpen(false);
                setProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuOpen, profileOpen]);

    const navLinks = isAuthenticated ? privateNav : publicNav;


    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-slideDown {
                    animation: slideDown 0.3s ease-out;
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
                .nav-active {
                    color: #2563eb;
                    background: #eff6ff;
                    font-weight: 600;
                }
                .nav-active::after {
                    content: '';
                    position: absolute;
                    bottom: -2px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 4px;
                    height: 4px;
                    background-color: #2563eb;
                    border-radius: 50%;
                }
                .nav-notActive {
                    color: #4b5563;
                    font-weight: 500;
                    background: transparent;
                }
                .nav-notActive:hover {
                    color: #1d4ed8;
                    background: #f9fafb;
                }

            `}} />

            <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo Section */}
                        <div className="flex items-center gap-3">
                            <Link href="/" className="flex items-center gap-3 group">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 w-11 h-11 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                                        <Sparkles className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-bold bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                                        Metadata Extractor
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-medium -mt-1">Salesforce Tools</span>
                                </div>
                            </Link>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navLinks.map((nav) => {
                                if (nav.dropdown) {
                                    const isDropdownActive = nav.dropdown.some((opt) => pathname === opt.href);
                                    return (
                                        <div
                                            key={nav.label}
                                            className="relative dropdown-container"
                                        >
                                            <button
                                                onClick={() => handleDropdownToggle(nav.label)}
                                                className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isDropdownActive ? "nav-active" : "nav-notActive"}`}
                                            >
                                                <span>{nav.label}</span>
                                                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === nav.label ? "rotate-180" : ""}`} />
                                            </button>
                                            {activeDropdown === nav.label && (
                                                <div className="absolute left-0 mt-2 min-w-[180px] bg-white border border-gray-200 shadow-xl rounded-xl z-40 animate-fadeIn p-1">
                                                    {nav.dropdown.map((opt) => (
                                                        <Link
                                                            key={opt.href}
                                                            href={opt.href}
                                                            onClick={() => setActiveDropdown(null)}
                                                            className={`block px-4 py-2 text-sm rounded-lg transition-colors ${pathname === opt.href ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}
                                                        >
                                                            {opt.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                                // Regular nav
                                return (
                                    <Link
                                        key={nav.href}
                                        href={nav.href}
                                        className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${pathname === nav.href ? "nav-active" : "nav-notActive"}`}
                                    >
                                        <span className="relative z-10">{nav.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Right Section */}
                        <div className="flex items-center gap-3">
                            {isAuthenticated ? (
                                <div className="relative" ref={profileRef} id="nav-profile-wrapper">
                                    <button
                                        onClick={() => setProfileOpen(!profileOpen)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
                                    >
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                                            <div className="relative w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-md">
                                                <span className="text-white font-bold text-sm">
                                                    {(fullName || userEmail || "U").charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="hidden lg:flex flex-col items-start">
                                            <span className="text-sm font-semibold text-gray-700">
                                                {fullName || userEmail?.split('@')[0] || "User"}
                                            </span>
                                            <span className="text-[10px] text-gray-500 leading-tight">
                                                {fullName ? "Member" : "Welcome"}
                                            </span>
                                        </div>
                                    </button>

                                    {profileOpen && (
                                        <div
                                            id="nav-profile-menu"
                                            className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-2xl rounded-2xl overflow-hidden z-50 animate-fadeIn"
                                        >
                                            <div className="px-4 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200/50">
                                                <p className="text-sm font-bold text-gray-900 truncate">{fullName || "User"}</p>
                                                <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                                            </div>
                                            <div className="py-2">
                                                <Link
                                                    href="/plan"
                                                    onClick={() => setProfileOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors group"
                                                >
                                                    <Zap className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                                    <span>Plan</span>
                                                </Link>
                                                <Link
                                                    href="/profile"
                                                    onClick={() => setProfileOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors group"
                                                >
                                                    <User className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                                    <span>Profile</span>
                                                </Link>
                                                <div className="my-1 h-px bg-gray-200"></div>
                                                <button
                                                    onClick={() => {
                                                        setProfileOpen(false);
                                                        handleLogout();
                                                    }}
                                                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors group"
                                                >
                                                    <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors" />
                                                    <span>Logout</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link
                                    href="/login"
                                    className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                                >
                                    <span>Login</span>
                                </Link>
                            )}

                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                                aria-label="Toggle menu"
                            >
                                {menuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {menuOpen && (
                    <div
                        ref={menuRef}
                        className="md:hidden border-t border-gray-200/50 bg-white/95 backdrop-blur-xl animate-slideDown"
                    >
                        <nav className="mx-auto max-w-7xl px-4 py-4 space-y-1">
                            {navLinks.map((nav, idx) => {
                                if (nav.dropdown) {
                                    const isDropdownActive = nav.dropdown.some(opt => opt.href === pathname);
                                    return (
                                        <details key={nav.label} className="mb-2">
                                            <summary className={`flex items-center gap-2 px-4 py-3 text-base font-medium rounded-lg cursor-pointer ${isDropdownActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:text-blue-700 hover:bg-blue-50/50"}`}>
                                                {nav.label}
                                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                            </summary>
                                            <div className="ml-4 mt-1 space-y-1">
                                                {nav.dropdown.map(opt => (
                                                    <Link
                                                        key={opt.href}
                                                        href={opt.href}
                                                        onClick={() => setMenuOpen(false)}
                                                        className={`block px-4 py-2 text-sm rounded-lg transition-colors ${pathname === opt.href ? "bg-blue-100 text-blue-800 font-semibold" : "text-gray-600 hover:text-blue-700 hover:bg-blue-50/50"}`}
                                                    >
                                                        {opt.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        </details>
                                    );
                                }
                                return (
                                    <Link
                                        key={nav.href}
                                        href={nav.href}
                                        onClick={() => setMenuOpen(false)}
                                        className={`block px-4 py-3 text-base font-medium rounded-lg transition-colors ${pathname === nav.href ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:text-blue-700 hover:bg-blue-50/50"}`}
                                    >
                                        {nav.label}
                                    </Link>
                                );
                            })}
                            {!isAuthenticated && (
                                <Link
                                    href="/login"
                                    onClick={() => setMenuOpen(false)}
                                    className="block mt-4 px-4 py-3 text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
                                >
                                    Login
                                </Link>
                            )}
                        </nav>
                    </div>
                )}
            </header>

            {/* Toaster */}
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#fff',
                        color: '#1f2937',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    },
                }}
            />
        </>
    );
}
