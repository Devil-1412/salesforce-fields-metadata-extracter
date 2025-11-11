'use client';
import { useState } from 'react';
import { UserPlus, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);

        const name = e.target.name.value;
        const email = e.target.email.value;
        const password = e.target.password.value;
        const confirm = e.target.confirm.value;

        if (password !== confirm) {
            alert("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, fullName: name }),
            });

            const data = await res.json();

            if (data.success) {
                toast.success("Account created successfully! Please verify your email.");
                router.push("/login");
            } else {
                toast.error(`${data.error || "Signup failed. Try again."}`);
            }
        } catch (error) {
            console.error("Signup error:", error);
            alert("Something went wrong. Try again.");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-100 flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8 relative">
                {/* Floating Icon */}
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-blue-600 p-4 rounded-full shadow-lg">
                    <UserPlus className="w-8 h-8 text-white" />
                </div>

                <h2 className="text-3xl font-extrabold text-center text-gray-800 mt-4">
                    Create Your Account 🚀
                </h2>
                <p className="text-gray-500 text-center mt-2">
                    Join Salesforce Metadata Extractor and start exploring today
                </p>

                {success ? (
                    <div className="mt-10 text-center">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                        <p className="text-gray-700 font-semibold">
                            Account created successfully!
                        </p>
                        <p className="text-gray-500 text-sm mt-1 mb-6">
                            You can now log in to your dashboard.
                        </p>
                        <Link
                            href="/login"
                            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                            Go to Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSignup} className="mt-8 space-y-6">
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-gray-700 font-medium mb-1">
                                Full Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                required
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="John Doe"
                            />
                        </div>

                        {/* Email */}
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

                        {/* Password */}
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

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="confirm" className="block text-gray-700 font-medium mb-1">
                                Confirm Password
                            </label>
                            <input
                                id="confirm"
                                type="password"
                                required
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="••••••••"
                            />
                        </div>

                        {/* Terms & Conditions */}
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                            <input type="checkbox" required className="accent-blue-600 mt-1" />
                            <p>
                                I agree to the{' '}
                                <Link href="/terms" className="text-blue-600 hover:underline">
                                    Terms of Service
                                </Link>{' '}
                                and{' '}
                                <Link href="/privacy" className="text-blue-600 hover:underline">
                                    Privacy Policy
                                </Link>
                            </p>
                        </div>

                        {/* Signup Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex justify-center items-center gap-2 py-3 mt-4 font-semibold text-white rounded-lg transition ${loading
                                ? 'bg-blue-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-md'
                                }`}
                        >
                            {loading ? (
                                <span className="animate-pulse">Creating account...</span>
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5" />
                                    Create Account
                                </>
                            )}
                        </button>
                    </form>
                )}


                {/* Already have an account */}
                {!success && (
                    <p className="text-center text-gray-600 mt-6 text-sm">
                        Already have an account?{' '}
                        <Link href="/login" className="text-blue-600 font-semibold hover:underline">
                            Log in
                        </Link>
                    </p>
                )}
            </div>
        </div>
    );
}
