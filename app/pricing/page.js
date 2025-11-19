'use client';
import { CheckCircle2, Zap, Shield, Star } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      description: 'Explore metadata with basic exports and single org access.',
      icon: <Star className="w-6 h-6 text-blue-500" />,
      features: [
        'Connect 1 Salesforce Org',
        'View Object & Field Metadata',
        'Export Metadata as CSV',
        'Basic Email Support',
      ],
      cta: 'Start for Free',
      highlight: false,
    },
    {
      name: 'Pro',
      price: '$899 /mo',
      description: 'Advanced insights, comparisons, and automation-ready exports.',
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
      description: 'Built for large teams that need dedicated infrastructure.',
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

  const stats = [
    { value: '520+', label: 'Orgs analyzed', detail: 'Last 30 days' },
    { value: '320K', label: 'Field snapshots', detail: 'Every month' },
    { value: '98%', label: 'Users rate it', detail: 'Ease of insights' },
  ];

  const highlights = [
    {
      title: 'Clear compliance posture',
      description: 'Track encrypted, restricted, and sensitive fields without guessing.',
      icon: <Shield className="w-5 h-5 text-indigo-500" />,
    },
    {
      title: 'Automation-ready exports',
      description: 'Build CSV exports that feed reporting and migration workflows.',
      icon: <Zap className="w-5 h-5 text-yellow-500" />,
    },
    {
      title: 'Trusted by teams',
      description: 'Share dashboards, rule libraries, and comparisons with collaborators.',
      icon: <CheckCircle2 className="w-5 h-5 text-blue-500" />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-blue-600 via-slate-900 to-indigo-700 p-10 shadow-2xl ring-1 ring-white/10">
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="absolute -top-10 -right-6 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-[-40px] left-10 h-32 w-32 rounded-full bg-indigo-500/20 blur-3xl" />
          </div>
          <div className="relative space-y-4">
            <p className="text-sm uppercase tracking-[0.4em] text-blue-200">Salesforce Insights</p>
            <h1 className="text-4xl font-bold leading-tight text-white md:text-5xl">
              Simple pricing, unlimited clarity.
            </h1>
            <p className="text-lg text-blue-100/90 max-w-2xl">
              Unlock Salesforce metadata intelligence, see field health, and share
              automation-ready exports with your team, without surprises.
            </p>
            <div className="grid gap-4 pt-6 md:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/20 bg-white/5 p-4 backdrop-blur"
                >
                  <p className="text-3xl font-semibold text-white">{stat.value}</p>
                  <p className="text-sm text-blue-100/90">{stat.label}</p>
                  <p className="text-xs text-blue-200/60">{stat.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Plans */}
        <section className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-blue-400">Plans</p>
              <h2 className="text-3xl font-bold text-white md:text-4xl">
                Pick the experience you need
              </h2>
              <p className="text-slate-300">
                All plans share the same modern interface, fast exports, and responsive support.
              </p>
            </div>
            <p className="text-sm text-slate-400">
              Prices shown in USD. Need a customized deployment? Contact sales.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex h-full flex-col gap-6 rounded-[26px] border bg-white/5 p-8 shadow-2xl transition-transform ${
                  plan.highlight
                    ? 'border-blue-400/60 bg-gradient-to-br from-white/90 to-white/40 text-slate-900 shadow-blue-400/20'
                    : 'border-slate-700 bg-slate-900/60 text-white'
                } hover:-translate-y-1 hover:shadow-xl`}
              >
                <div className="flex items-center gap-3">
                  {plan.icon}
                  <h3
                    className={`text-2xl font-semibold ${
                      plan.highlight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {plan.name}
                  </h3>
                  {plan.highlight && (
                    <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-200">
                      Most popular
                    </span>
                  )}
                </div>
                <div>
                  <p
                    className={`text-4xl font-bold ${
                      plan.highlight ? 'text-blue-900' : 'text-white'
                    }`}
                  >
                    {plan.price}
                  </p>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
                    {plan.highlight ? 'Billed Monthly' : 'Flexible plan'}
                  </p>
                </div>
                <p className={plan.highlight ? 'text-slate-900/80' : 'text-slate-300'}>
                  {plan.description}
                </p>
                <ul className="space-y-3 text-sm">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-base leading-snug"
                    >
                      <CheckCircle2
                        className={`mt-1 h-5 w-5 shrink-0 ${
                          plan.highlight ? 'text-blue-600' : 'text-slate-400'
                        }`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.highlight ? '/login' : '/'}
                  className={`mt-auto rounded-2xl py-3 text-center text-sm font-semibold transition ${
                    plan.highlight
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-slate-800/60 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Highlights */}
        <section className="grid gap-6 rounded-[26px] border border-white/10 bg-white/5 p-8 md:grid-cols-3">
          {highlights.map((highlight) => (
            <div key={highlight.title} className="space-y-3">
              <div className="flex items-center gap-3">
                {highlight.icon}
                <p className="text-xs uppercase tracking-[0.4em] text-blue-300">Benefits</p>
              </div>
              <h3 className="text-xl font-semibold text-white">{highlight.title}</h3>
              <p className="text-sm leading-relaxed text-slate-300">{highlight.description}</p>
            </div>
          ))}
        </section>

        {/* Footer CTA */}
        <section className="rounded-[28px] border border-slate-700 bg-gradient-to-r from-slate-900 to-indigo-900 p-8 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-blue-200">Need help?</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            Let's shape a plan for your organization
          </p>
          <p className="text-slate-300">
            Custom integrations, SLAs, or dedicated onboarding - let us plan it together.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Contact Sales
          </Link>
        </section>
      </div>
    </div>
  );
}
