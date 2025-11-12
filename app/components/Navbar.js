// app/components/Navbar.js
'use client';

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { Menu, X, UserCircle2 } from "lucide-react";
import { Toaster } from "react-hot-toast";

export default function Navbar() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userEmail, setUserEmail] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const menuRef = useRef(null);
    const profileRef = useRef(null);


    useEffect(() => {
        // listen for changes from other tabs
        const email = typeof window !== "undefined" ? sessionStorage.getItem("email") : null;
        setIsLoggedIn(!!email);
        setUserEmail(email || "");

        const handleLoggedIn = (e) => {
            const email = sessionStorage.getItem("email");
            setIsLoggedIn(!!email);
            setUserEmail(email || "");
        };
        window.addEventListener("loggedIn", handleLoggedIn);

        return () => {
            window.removeEventListener("loggedIn", handleLoggedIn);
        };
    }, []);

    const handleLogout = () => {
        sessionStorage.clear();
        setIsLoggedIn(false);
        setUserEmail("");
        // redirect to home
        window.location.href = "/";
    };

    const publicNav = [
        { href: "/", label: "Home" },
        { href: "/pricing", label: "Pricing" },
        { href: "/docs", label: "Docs" },
        { href: "/about", label: "About" },
    ];

    const privateNav = [
        { href: "/", label: "Dashboard" },
        { href: "/objectAnalysis", label: "Object & Fields" },
        { href: "/compare", label: "Compare Orgs" },
        { href: "/tools", label: "Tools" },
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
    }, [isLoggedIn]);

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

    const navLinks = isLoggedIn ? privateNav : publicNav;


    return (
        <>
            <header className="sticky top-4 z-50 mx-auto w-[95%] md:w-[90%] bg-white/70 backdrop-blur-2xl border border-gray-200 shadow-md hover:shadow-xl rounded-2xl px-6 py-3 flex items-center justify-between transition-all duration-300">
                {/* 🔹 Logo Section */}
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-md hover:scale-105 transition-transform">
                        <span className="text-white font-semibold text-lg">SF</span>
                    </div>
                    <Link
                        href="/"
                        className="text-2xl font-extrabold bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-500 bg-clip-text text-transparent tracking-tight hover:opacity-90 transition"
                    >
                        Metadata Extractor
                    </Link>
                </div>

                {/* 🔹 Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-6">
                    {navLinks.map(({ href, label }) => (
                        <Link
                            key={href}
                            href={href}
                            className="relative text-sm font-medium text-gray-700 hover:text-blue-700 transition group"
                        >
                            {label}
                            <span className="absolute left-0 bottom-[-4px] w-0 h-[2px] bg-gradient-to-r from-blue-500 to-indigo-600 transition-all group-hover:w-full"></span>
                        </Link>
                    ))}
                </nav>

                {/* 🔹 Profile / Login */}
                <div className="relative" ref={profileRef}>
                    {isLoggedIn ? (
                        <>
                            <div
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="bg-gradient-to-br from-blue-600 to-indigo-500 p-[2px] rounded-full cursor-pointer hover:scale-105 transition-transform"
                            >
                                <div className="bg-white rounded-full p-1">
                                    <UserCircle2 className="w-8 h-8 text-blue-700" />
                                </div>
                            </div>

                            {profileOpen && (
                                <div className="absolute right-0 mt-3 bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden w-52 z-50 animate-fadeIn">
                                    <div className="px-4 py-2 text-sm text-gray-600 border-b bg-gray-50 truncate">
                                        {userEmail || "User"}
                                    </div>
                                    <Link
                                        href="/profile"
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                                    >
                                        Profile
                                    </Link>
                                    <Link
                                        href="/settings"
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                                    >
                                        Settings
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <Link
                            href="/login"
                            className="hidden md:block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:opacity-90 transition"
                        >
                            Login
                        </Link>
                    )}

                    {/* 🔹 Mobile Menu Toggle */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="md:hidden text-gray-700 hover:text-blue-600 transition"
                    >
                        {menuOpen ? <X size={26} /> : <Menu size={26} />}
                    </button>
                </div>

                {/* 🔹 Mobile Menu */}
                {menuOpen && (
                    <div
                        ref={menuRef}
                        className="absolute top-[70px] left-0 w-full bg-white border-t border-gray-200 shadow-lg rounded-b-2xl md:hidden animate-slideDown"
                    >
                        <nav className="flex flex-col items-center py-4 space-y-3">
                            {navLinks.map(({ href, label }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    onClick={() => setMenuOpen(false)}
                                    className="text-gray-700 text-base font-medium hover:text-blue-700 transition"
                                >
                                    {label}
                                </Link>
                            ))}

                            {!isLoggedIn && (
                                <Link
                                    href="/login"
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-lg shadow-md hover:opacity-90 transition"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Login
                                </Link>
                            )}
                        </nav>
                    </div>
                )}
            </header>

            {/* Toaster must be inside a client component */}
            <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        </>
    );
}
