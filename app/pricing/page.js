'use client';
import { CheckCircle2, Zap, Shield, Star } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '₹0',
      description: 'Get started with essential features to explore Salesforce metadata.',
      icon: <Star className="w-6 h-6 text-blue-500" />,
      features: [
        'Connect 1 Salesforce Org',
        'View Object & Field Metadata',
        'Export Metadata as CSV',
        'Basic Support (Email only)',
      ],
      cta: 'Start for Free',
      highlight: false,
    },
    {
      name: 'Pro',
      price: '₹899 /month',
      description:
        'Perfect for developers & admins who want advanced tools and insights.',
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      features: [
        'Connect up to 3 Salesforce Orgs',
        'Compare Objects & Fields across orgs',
        'Field Data Insights (Null %, Distinct Count)',
        'Access Validation Rules, Workflows & Triggers',
        'Priority Email Support',
      ],
      cta: 'Upgrade to Pro',
      highlight: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description:
        'For teams and large organizations needing full-scale Salesforce analysis.',
      icon: <Shield className="w-6 h-6 text-indigo-500" />,
      features: [
        'Unlimited Org Connections',
        'Dedicated Infrastructure',
        'Team Collaboration Access',
        'Custom Integrations & Reports',
        '24/7 Dedicated Support',
      ],
      cta: 'Contact Sales',
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-16 px-6 flex flex-col items-center">
      {/* Header Section */}
      <div className="text-center mb-12 max-w-2xl">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
          Simple, Transparent Pricing
        </h1>
        <p className="text-gray-600 mt-4 text-lg">
          Choose a plan that fits your Salesforce data exploration needs.
        </p>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl shadow-lg border ${
              plan.highlight
                ? 'border-blue-500 bg-white shadow-blue-200 scale-105'
                : 'border-gray-200 bg-white/90'
            } p-8 transition-transform hover:scale-105 hover:shadow-xl`}
          >
            <div className="flex items-center gap-3 mb-4">
              {plan.icon}
              <h3 className="text-2xl font-bold text-gray-800">{plan.name}</h3>
            </div>
            <p className="text-3xl font-semibold text-blue-700">{plan.price}</p>
            <p className="text-gray-500 mt-2 text-sm">{plan.description}</p>

            <ul className="mt-6 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-[2px]" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href={plan.highlight ? '/login' : '/'}
              className={`mt-8 block w-full text-center py-3 rounded-lg font-semibold transition ${
                plan.highlight
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* Footer Section */}
      <div className="mt-16 text-center text-gray-600 text-sm">
        <p>
          All plans include free updates and access to new tools.  
          Cancel or change your plan anytime.
        </p>
      </div>
    </div>
  );
}
