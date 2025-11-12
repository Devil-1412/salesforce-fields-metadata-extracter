// app/layout.js
import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata = {
  title: "Salesforce Metadata Extractor",
  description: "Explore, compare, and analyze Salesforce metadata effortlessly.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-gray-50 via-white to-blue-50 text-gray-800 min-h-screen flex flex-col">
        {/* Navbar is client-side */}
        <Navbar />

        <main className="flex-grow w-full max-w-7xl mx-auto px-6 py-10">
          {children}
        </main>

        <footer className="relative mt-16 bg-gradient-to-br from-blue-800 via-indigo-800 to-blue-900 text-white rounded-t-3xl shadow-2xl">
          {/* Decorative gradient glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.15),transparent_60%)]"></div>

          <div className="relative max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* About */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-white">About</h3>
              <p className="text-sm text-blue-100 leading-relaxed">
                A modern platform to explore, compare, and analyze Salesforce metadata efficiently.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-white">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                {[
                  { href: "/", label: "Home" },
                  { href: "/pricing", label: "Pricing" },
                  { href: "/docs", label: "Docs" },
                  { href: "/about", label: "About" },
                ].map(({ href, label }) => (
                  <li key={href}>
                    <a
                      href={href}
                      className="text-blue-100 hover:text-white transition-all duration-200 hover:translate-x-1 flex items-center gap-2"
                    >
                      <span>›</span> {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-white">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="/docs"
                    className="text-blue-100 hover:text-white transition-all duration-200 hover:translate-x-1 flex items-center gap-2"
                  >
                    <span>›</span> Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="https://developer.salesforce.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-100 hover:text-white transition-all duration-200 hover:translate-x-1 flex items-center gap-2"
                  >
                    <span>›</span> Salesforce Dev Docs
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-white">Contact</h3>
              <p className="text-sm text-blue-100">📧 support@salesmeta.ai</p>
              <p className="text-sm text-blue-100 mt-2">📍 India</p>
              <div className="flex space-x-4 mt-4">
                <a href="#" className="hover:text-blue-300 transition">
                  <i className="fab fa-linkedin text-lg"></i>
                </a>
                <a href="#" className="hover:text-blue-300 transition">
                  <i className="fab fa-twitter text-lg"></i>
                </a>
                <a href="#" className="hover:text-blue-300 transition">
                  <i className="fab fa-github text-lg"></i>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-blue-700/50 mt-8 py-4 text-center text-sm text-blue-200">
            © {new Date().getFullYear()} <span className="font-semibold text-white">Metadata Extractor</span> — All rights reserved.
          </div>
        </footer>

      </body>
    </html>
  );
}
