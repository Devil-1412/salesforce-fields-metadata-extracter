'use client';
import { useState } from 'react';
import { Lock, LogIn } from 'lucide-react';
import Link from 'next/link';
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        const email = e.target.email.value;
        const password = e.target.password.value;

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (data.success) {
                toast.success("Logged in successfully!");
                // Store both access token and refresh token for automatic token refresh
                localStorage.setItem("token", data.session.access_token);
                localStorage.setItem("refresh_token", data.session.refresh_token);
                window.dispatchEvent(new Event("loggedIn"));
                if (data.hasOrganization) {
                    router.push("/");
                } else {
                    router.push("/onboarding");
                }
            } else {
                toast.error(`${data.error || "Login failed. Please Try again."}`);
            }
        } catch (error) {
            console.error("Signup error:", error);
            alert("Login failed. Please Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8 relative">
                {/* Icon Header */}
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-blue-600 p-4 rounded-full shadow-lg">
                    <Lock className="w-8 h-8 text-white" />
                </div>

                <h2 className="text-3xl font-extrabold text-center text-gray-800 mt-4">
                    Welcome Back 👋
                </h2>
                <p className="text-gray-500 text-center mt-2">
                    Sign in to your Salesforce Metadata Extractor account
                </p>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="mt-8 space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-gray-700 font-medium mb-1">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-gray-700 font-medium mb-1">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="flex justify-between items-center text-sm">
                        <label className="flex items-center gap-2 text-gray-600">
                            <input type="checkbox" className="accent-blue-600" /> Remember me
                        </label>
                        <Link href="#" className="text-blue-600 hover:underline">
                            Forgot password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex justify-center items-center gap-2 py-3 mt-4 font-semibold text-white rounded-lg transition ${loading
                            ? 'bg-blue-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 shadow-md'
                            }`}
                    >
                        {loading ? (
                            <span className="animate-pulse">Connecting to Salesforce...</span>
                        ) : (
                            <>
                                <LogIn className="w-5 h-5" />
                                Sign In
                            </>
                        )}
                    </button>
                </form>

                {/* Signup Link */}
                <p className="text-center text-gray-600 mt-6 text-sm">
                    Don’t have an account?{' '}
                    <Link href="/signup" className="text-blue-600 font-semibold hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
