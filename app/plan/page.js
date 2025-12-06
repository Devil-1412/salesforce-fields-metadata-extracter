"use client";
import { useState, useEffect } from "react";
import { CheckCircle2, Shield, Zap, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function PlanPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [currentPlan, setCurrentPlan] = useState("Free");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Ensure cookies are sent with request
                const res = await fetch("/api/profile", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                });
                const data = await res.json();
                if (data.success) {
                    setCurrentPlan(data.user.plan || "Free");
                } else {
                    toast.error("Failed to load plan details");
                }
            } catch (err) {
                console.error("Fetch profile error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    const plans = [
        {
            name: "Free",
            price: "$0",
            period: "/month",
            description: "Essential tools for individual developers",
            features: [
                "Connect up to 1 Organization",
                "Basic Object Analysis",
                "Standard Support",
                "Community Access"
            ],
            icon: <Star className="w-6 h-6" />,
            color: "blue"
        },
        {
            name: "Pro",
            price: "$29",
            period: "/month",
            description: "Advanced features for power users",
            features: [
                "Connect up to 5 Organizations",
                "Advanced Metadata Analysis",
                "Priority Support",
                "Export to CSV/PDF",
                "History Tracking"
            ],
            icon: <Zap className="w-6 h-6" />,
            color: "purple",
            popular: true
        },
        {
            name: "Enterprise",
            price: "Custom",
            period: "",
            description: "Scalable solutions for large teams",
            features: [
                "Unlimited Organizations",
                "Custom Integrations",
                "Dedicated Account Manager",
                "SLA Support",
                "SSO Authentication",
                "Audit Logs"
            ],
            icon: <Shield className="w-6 h-6" />,
            color: "indigo"
        }
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Choose the Right Plan for You
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Unlock the full potential of your Salesforce metadata analysis with our flexible pricing plans.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => {
                        const isCurrentPlan = currentPlan.toLowerCase() === plan.name.toLowerCase();
                        return (
                            <div
                                key={plan.name}
                                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isCurrentPlan
                                        ? "border-blue-600 ring-4 ring-blue-50"
                                        : "border-transparent hover:border-gray-200"
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                        MOST POPULAR
                                    </div>
                                )}

                                <div className="p-8">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${plan.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                                            plan.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                                                'bg-indigo-100 text-indigo-600'
                                        }`}>
                                        {plan.icon}
                                    </div>

                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                    <p className="text-gray-500 mb-6 h-12">{plan.description}</p>

                                    <div className="flex items-baseline mb-8">
                                        <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                                        <span className="text-gray-500 ml-1">{plan.period}</span>
                                    </div>

                                    <button
                                        disabled={isCurrentPlan}
                                        className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${isCurrentPlan
                                                ? "bg-green-100 text-green-700 cursor-default"
                                                : "bg-gray-900 text-white hover:bg-gray-800 hover:shadow-lg"
                                            }`}
                                    >
                                        {isCurrentPlan ? "Current Plan" : "Upgrade Plan"}
                                    </button>
                                </div>

                                <div className="bg-gray-50 p-8 border-t border-gray-100">
                                    <p className="text-sm font-semibold text-gray-900 mb-4">What's included:</p>
                                    <ul className="space-y-4">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                                <span className="text-sm text-gray-600">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-16 bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Need a custom solution?</h3>
                    <p className="text-gray-600 mb-6">
                        Contact our sales team for tailored packages and enterprise-grade support.
                    </p>
                    <button className="text-blue-600 font-semibold hover:text-blue-700 hover:underline">
                        Contact Sales &rarr;
                    </button>
                </div>
            </div>
        </div>
    );
}
