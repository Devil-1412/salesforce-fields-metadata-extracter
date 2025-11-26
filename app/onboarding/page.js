'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, CheckCircle, ArrowRight, BookOpen } from 'lucide-react';
import toast from "react-hot-toast";

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isSandbox, setIsSandbox] = useState(false);

    const handleAddOrg = async (e) => {
        e.preventDefault();
        setLoading(true);

        const orgEmail = e.target.orgEmail.value;
        const orgPassword = e.target.orgPassword.value;
        const securityToken = e.target.securityToken.value;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch("/api/addOrg", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ orgEmail, orgPassword, securityToken, isSandbox }),
            });

            const data = await res.json();

            if (data.success) {
                toast.success("Organization connected successfully!");
                setStep(2);
            } else {
                toast.error(data.error || "Failed to connect organization");
            }
        } catch (error) {
            console.error("Error adding org:", error);
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = () => {
        router.push("/");
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Progress Bar */}
                <div className="bg-gray-100 h-2 w-full">
                    <div
                        className="h-full bg-blue-600 transition-all duration-500 ease-out"
                        style={{ width: step === 1 ? '50%' : '100%' }}
                    />
                </div>

                <div className="p-8">
                    {step === 1 ? (
                        <div className="animate-in fade-in slide-in-from-right duration-500">
                            <div className="text-center mb-8">
                                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Building2 className="w-8 h-8 text-blue-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">Connect Your Salesforce Org</h2>
                                <p className="text-gray-500 mt-2">
                                    To get started, we need to connect to your Salesforce environment.
                                </p>
                            </div>

                            <form onSubmit={handleAddOrg} className="space-y-4 max-w-md mx-auto">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Salesforce Username</label>
                                    <input
                                        name="orgEmail"
                                        type="email"
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        placeholder="user@company.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input
                                        name="orgPassword"
                                        type="password"
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Security Token</label>
                                    <input
                                        name="securityToken"
                                        type="text"
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        placeholder="Enter your security token"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        Required for API access. found in My Settings &gt; Personal &gt; Reset My Security Token.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="sandbox"
                                        checked={isSandbox}
                                        onChange={(e) => setIsSandbox(e.target.checked)}
                                        className="accent-blue-600 w-4 h-4"
                                    />
                                    <label htmlFor="sandbox" className="text-sm text-gray-700 cursor-pointer">
                                        This is a Sandbox environment
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-3 rounded-lg font-semibold text-white transition ${loading
                                        ? 'bg-blue-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 shadow-md'
                                        }`}
                                >
                                    {loading ? 'Connecting...' : 'Connect Organization'}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-right duration-500 text-center">
                            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">You're All Set! 🎉</h2>
                            <p className="text-gray-500 mt-2 mb-8">
                                Your organization has been successfully connected. Here's a quick overview of what you can do.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-left">
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                                        <BookOpen className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-800">Analyze Objects</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        View detailed metadata about your Salesforce objects and fields.
                                    </p>
                                </div>
                                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                                    <div className="bg-purple-100 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                                        <Building2 className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-800">Compare Orgs</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Compare metadata between different Salesforce organizations.
                                    </p>
                                </div>
                                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                                    <div className="bg-orange-100 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                                        <CheckCircle className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-800">Track Changes</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Monitor changes to your metadata over time.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleFinish}
                                className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md"
                            >
                                Get Started
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
