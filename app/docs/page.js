'use client';
import { BookOpen, Layers, Database, Settings, FileText } from 'lucide-react';
import Link from 'next/link';

export default function DocsPage() {
  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <BookOpen className="w-5 h-5 text-blue-600" />,
      content: (
        <>
          <p className="text-gray-700 leading-relaxed">
            Welcome to the <strong>Salesforce Metadata Extractor</strong> documentation!  
            This guide will help you connect your Salesforce org, analyze metadata, and
            export results seamlessly.
          </p>
          <ol className="list-decimal list-inside mt-4 text-gray-700 space-y-2">
            <li>Sign in and connect your Salesforce org securely via OAuth.</li>
            <li>Navigate to the <b>Object & Fields</b> section.</li>
            <li>Select objects to explore their metadata details.</li>
            <li>Export results in CSV or JSON formats.</li>
          </ol>
        </>
      ),
    },
    {
      id: 'object-analysis',
      title: 'Object & Field Analysis',
      icon: <Database className="w-5 h-5 text-blue-600" />,
      content: (
        <>
          <p className="text-gray-700 leading-relaxed">
            The <strong>Object & Field Analysis</strong> tool allows you to explore every field’s metadata
            including data type, length, dependencies, and relationships.
          </p>
          <ul className="list-disc list-inside mt-4 text-gray-700 space-y-2">
            <li>Supports all standard and custom objects.</li>
            <li>Visual filters by type (Lookup, Text, Number, etc.).</li>
            <li>Export complete metadata with field-level statistics.</li>
          </ul>
        </>
      ),
    },
    {
      id: 'compare-orgs',
      title: 'Compare Orgs',
      icon: <Layers className="w-5 h-5 text-blue-600" />,
      content: (
        <>
          <p className="text-gray-700 leading-relaxed">
            Use the <strong>Compare Orgs</strong> feature to analyze differences between two Salesforce environments.
          </p>
          <ul className="list-disc list-inside mt-4 text-gray-700 space-y-2">
            <li>Compare object structures, fields, and validation rules.</li>
            <li>Identify metadata mismatches instantly.</li>
            <li>Export comparison results for audit documentation.</li>
          </ul>
        </>
      ),
    },
    {
      id: 'workflows-triggers',
      title: 'Workflows & Triggers',
      icon: <Settings className="w-5 h-5 text-blue-600" />,
      content: (
        <>
          <p className="text-gray-700 leading-relaxed">
            Gain visibility into <strong>Workflows</strong>, <strong>Validation Rules</strong>, and <strong>Apex Triggers</strong>
            for every object.
          </p>
          <ul className="list-disc list-inside mt-4 text-gray-700 space-y-2">
            <li>Filter by object or rule type.</li>
            <li>Quickly identify active or deprecated rules.</li>
            <li>Export trigger logic or formulas for review.</li>
          </ul>
        </>
      ),
    },
    {
      id: 'api-reference',
      title: 'API Reference',
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      content: (
        <>
          <p className="text-gray-700 leading-relaxed">
            You can also integrate the Metadata Extractor via APIs to automate your data analysis.
          </p>
          <p className="mt-4 text-gray-700">
            Example API call:
          </p>
          <pre className="bg-gray-900 text-gray-100 text-sm p-4 rounded-xl mt-2 overflow-auto">
{`POST /api/fields
{
  "accessToken": "YOUR_ACCESS_TOKEN",
  "instanceUrl": "https://your-instance.salesforce.com",
  "objects": ["Account", "Contact"]
}`}
          </pre>
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="md:w-64 bg-white border-r border-gray-200 p-6 sticky top-0 h-screen hidden md:flex flex-col justify-between">
        <div>
          <h2 className="text-lg font-semibold text-blue-700 mb-4">Documentation</h2>
          <nav className="space-y-2">
            {sections.map((sec) => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 text-gray-700 font-medium transition"
              >
                {sec.icon}
                {sec.title}
              </a>
            ))}
          </nav>
        </div>

        <div className="text-xs text-gray-500 border-t border-gray-100 pt-4">
          <p>© {new Date().getFullYear()} Salesforce Metadata Extractor</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 space-y-16">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-blue-700">
            Documentation
          </h1>
          <p className="text-gray-600 mt-3 text-lg">
            Learn how to use and integrate the Salesforce Metadata Extractor efficiently.
          </p>
        </header>

        {sections.map((sec) => (
          <section key={sec.id} id={sec.id} className="scroll-mt-20">
            <div className="flex items-center gap-3 mb-4">
              {sec.icon}
              <h2 className="text-2xl font-semibold text-gray-800">
                {sec.title}
              </h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              {sec.content}
            </div>
          </section>
        ))}

        <div className="text-center mt-20">
          <Link
            href="/login"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition"
          >
            Get Started →
          </Link>
        </div>
      </main>
    </div>
  );
}
