// app/components/Navbar.js
'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { UserCircle2 } from "lucide-react";
import { Toaster } from "react-hot-toast";

export default function Navbar() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userEmail, setUserEmail] = useState("");

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

    return (
        <>
            <header className="sticky top-4 z-50 mx-auto w-[95%] md:w-[90%] bg-white/80 backdrop-blur-xl border border-gray-200 shadow-lg rounded-2xl px-6 py-4 flex justify-between items-center transition-all duration-300 hover:shadow-2xl">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-md">
                        <span className="text-white font-semibold text-lg">SF</span>
                    </div>
                    <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-500 bg-clip-text text-transparent tracking-tight">
                        Metadata Extractor
                    </Link>
                </div>

                <nav className="hidden md:flex items-center gap-6">
                    {(isLoggedIn ? privateNav : publicNav).map(({ href, label }) => (
                        <Link key={href} href={href} className="text-sm font-medium text-gray-700 hover:text-blue-600 hover:underline underline-offset-4 transition">
                            {label}
                        </Link>
                    ))}
                </nav>

                <div id="nav-profile-wrapper" className="relative">
                    {isLoggedIn ? (
                        <>
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-500 p-[2px] rounded-full cursor-pointer hover:scale-105 transition-transform">
                                <div className="bg-white rounded-full p-1">
                                    <UserCircle2 className="w-8 h-8 text-blue-700" />
                                </div>
                            </div>

                            <div id="nav-profile-menu" className="absolute right-0 mt-3 hidden bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden w-max z-50">
                                <div className="px-4 py-2 text-sm text-gray-600 border-b bg-gray-50">{userEmail || "User"}</div>
                                <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50">Profile</Link>
                                <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50">Settings</Link>
                                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50">Logout</button>
                            </div>
                        </>
                    ) : (
                        <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition">Login</Link>
                    )}
                </div>
            </header>

            {/* Toaster must be inside a client component */}
            <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        </>
    );
}
