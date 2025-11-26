'use client';
import Link from 'next/link';
import { Mail, ArrowRight } from 'lucide-react';

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-100 flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8 relative text-center">
                {/* Floating Icon */}
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-blue-600 p-4 rounded-full shadow-lg">
                    <Mail className="w-8 h-8 text-white" />
                </div>

                <h2 className="text-3xl font-extrabold text-gray-800 mt-6">
                    Check Your Email 📧
                </h2>
                <p className="text-gray-500 mt-4">
                    We've sent a verification link to your email address. Please click the link to verify your account.
                </p>

                <div className="mt-8 space-y-4">
                    <p className="text-sm text-gray-600">
                        Once verified, you can log in to your account.
                    </p>

                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center gap-2 w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md"
                    >
                        Go to Login
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <p className="text-gray-400 text-xs mt-8">
                    Didn't receive the email? Check your spam folder.
                </p>
            </div>
        </div>
    );
}
