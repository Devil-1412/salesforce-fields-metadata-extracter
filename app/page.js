'use client';
import { ArrowRight, Layers, Database, BarChart3, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-indigo-100 text-gray-800 flex flex-col">
      {/* 🧭 Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between px-8 md:px-20 py-24 gap-12">
        {/* Left Text Content */}
        <div className="flex-1 space-y-6">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-gray-900">
            Simplify Your
            <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-400 bg-clip-text text-transparent">
              Salesforce Metadata
            </span>
            Analysis
          </h1>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-lg">
            A modern tool to explore, analyze, and compare Salesforce org metadata
            — all in one intuitive dashboard.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Link
              href="/login"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition flex items-center gap-2"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/docs"
              className="border border-blue-600 text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              View Documentation
            </Link>
          </div>
        </div>

        {/* Right Side Image
        <div className="flex-1 flex justify-center">
          <Image
            src="https://i.pinimg.com/1200x/cf/5d/2f/cf5d2f5b8627e08786cf3aaa9858f20c.jpg"
            alt="Salesforce Metadata Dashboard"
            width={600}
            height={400}
            className="rounded-3xl shadow-xl border border-gray-100"
          />
        </div> */}
      </section>

      {/* ✨ Features Section */}
      <section className="py-20 bg-gradient-to-b from-blue-100 to-indigo-50 px-8 md:px-20 text-center">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">Why Choose Us?</h2>
        <p className="text-gray-600 mb-12 text-lg max-w-2xl mx-auto">
          Designed for developers, admins, and Salesforce professionals who want
          speed, accuracy, and clarity in metadata exploration.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {[
            {
              icon: <Database className="w-10 h-10 text-blue-600" />,
              title: 'Deep Object Analysis',
              desc: 'Explore every field, dependency, and property in your Salesforce objects with precision.',
            },
            {
              icon: <Layers className="w-10 h-10 text-indigo-600" />,
              title: 'Cross-Org Comparison',
              desc: 'Compare metadata across multiple orgs to identify structural or configuration differences.',
            },
            {
              icon: <BarChart3 className="w-10 h-10 text-blue-500" />,
              title: 'Data Insights',
              desc: 'Understand completeness, nulls, and unique values directly from your metadata reports.',
            },
            {
              icon: <ShieldCheck className="w-10 h-10 text-green-600" />,
              title: 'Secure Salesforce Login',
              desc: 'OAuth 2.0 authentication ensures secure access to your Salesforce environments.',
            },
            {
              icon: <Zap className="w-10 h-10 text-yellow-500" />,
              title: 'Lightning Fast',
              desc: 'Optimized queries and caching mean minimal load times — even for complex metadata.',
            },
            {
              icon: <BarChart3 className="w-10 h-10 text-indigo-600" />,
              title: 'Export Everything',
              desc: 'Export metadata, validation rules, workflows, and triggers with one click.',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition"
            >
              <div className="flex justify-center mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 🚀 Call to Action */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-indigo-600 text-center text-white px-6">
        <h2 className="text-4xl font-bold mb-4">Ready to simplify your Salesforce journey?</h2>
        <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
          Join thousands of Salesforce professionals using Metadata Extractor to gain
          control and clarity over their orgs.
        </p>
        <Link
          href="/login"
          className="bg-white text-blue-700 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition inline-flex items-center gap-2"
        >
          Start for Free <ArrowRight className="w-5 h-5" />
        </Link>
      </section>
    </div>
  );
}
