'use client';
import { Users, Target, Lightbulb, Globe, Code2 } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-gray-800 flex flex-col items-center">
      {/* 🌟 Hero Section */}
      <section className="text-center max-w-4xl mt-16 px-6">
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-500 bg-clip-text text-transparent">
          About Salesforce Metadata Extractor
        </h1>
        <p className="mt-6 text-lg text-gray-600 leading-relaxed">
          We help Salesforce developers and admins simplify complex metadata analysis
          — so they can focus on building amazing customer experiences.
        </p>
      </section>

      {/* 🧩 Mission Section */}
      <section className="mt-20 w-full max-w-6xl px-6 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="text-3xl font-bold text-blue-700 flex items-center gap-2">
            <Target className="w-7 h-7 text-blue-600" />
            Our Mission
          </h2>
          <p className="mt-4 text-gray-700 leading-relaxed text-lg">
            Our mission is to make <strong>Salesforce metadata</strong> accessible, visual,
            and actionable for every team.  
            Whether you’re comparing orgs, understanding field dependencies, or validating
            customizations — our tools streamline your workflow with precision and clarity.
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl p-10 shadow-md text-center">
          <Lightbulb className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-700 font-medium">
            “Data clarity is not a luxury — it’s a necessity for innovation.”
          </p>
        </div>
      </section>

      {/* 🌍 Story Section */}
      <section className="mt-20 w-full max-w-6xl px-6 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="order-2 md:order-1">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-lg p-8">
            <Globe className="w-10 h-10 text-indigo-600 mb-3" />
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">
              Our Story
            </h3>
            <p className="text-gray-700 leading-relaxed">
              The Salesforce ecosystem is powerful but often opaque when it comes to
              understanding metadata.  
              We started Salesforce Metadata Extractor with one goal — to make complex
              metadata structures simple to navigate, analyze, and compare.
            </p>
            <p className="mt-3 text-gray-700 leading-relaxed">
              Today, we serve hundreds of Salesforce developers, architects, and admins
              who trust our tools for accuracy, speed, and deep insight.
            </p>
          </div>
        </div>

        <div className="order-1 md:order-2 text-center">
          <img
            src="https://cdn.dribbble.com/users/148670/screenshots/15818315/media/24efb8a3b06b91b6b0a16f11d5c7533c.png?compress=1&resize=800x600&vertical=top"
            alt="Salesforce Metadata"
            className="rounded-3xl shadow-lg w-full object-cover"
          />
        </div>
      </section>

      {/* 👥 Team Section */}
      <section className="mt-24 w-full max-w-6xl px-6 text-center">
        <h2 className="text-3xl font-bold text-blue-700 flex justify-center items-center gap-2">
          <Users className="w-7 h-7 text-blue-600" />
          Meet the Team
        </h2>
        <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
          A small team of passionate developers, Salesforce enthusiasts, and data
          engineers dedicated to simplifying your metadata journey.
        </p>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              name: 'Pushpam Agrawal',
              role: 'Developer',
              img: 'https://avatars.githubusercontent.com/u/000000?v=4',
            },
            {
              name: '',
              role: 'UI/UX Designer',
              img: 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png',
            },
            {
              name: '',
              role: 'Salesforce Specialist',
              img: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
            },
          ].map((member) => (
            <div
              key={member.name}
              className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-xl transition transform hover:-translate-y-1"
            >
              <img
                src={member.img}
                alt={member.name}
                className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
              />
              <h4 className="text-lg font-semibold text-gray-800">
                {member.name}
              </h4>
              <p className="text-sm text-blue-600">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ⚙️ Tech Section */}
      <section className="mt-24 mb-24 w-full max-w-6xl px-6 text-center">
        <h2 className="text-3xl font-bold text-blue-700 flex justify-center items-center gap-2">
          <Code2 className="w-7 h-7 text-blue-600" />
          Technology Stack
        </h2>
        <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
          Built using modern web technologies for performance and scalability.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-6">
          {[
            'Next.js',
            'React',
            'Tailwind CSS',
            'Node.js',
            'Salesforce JSForce',
            'Supabase',
            'GCP / Firebase',
          ].map((tech) => (
            <span
              key={tech}
              className="px-5 py-2 border border-blue-200 bg-blue-50 text-blue-700 rounded-full font-medium shadow-sm hover:bg-blue-100 transition"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
