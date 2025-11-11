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

        <footer className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white mt-10 rounded-t-3xl shadow-inner">
          <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-3">About</h3>
              <p className="text-sm text-blue-100 leading-relaxed">
                A modern platform to explore, compare, and analyze Salesforce metadata efficiently.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/" className="hover:text-white/90 transition">Home</a></li>
                <li><a href="/pricing" className="hover:text-white/90 transition">Pricing</a></li>
                <li><a href="/docs" className="hover:text-white/90 transition">Docs</a></li>
                <li><a href="/about" className="hover:text-white/90 transition">About</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/docs" className="hover:text-white/90 transition">Documentation</a></li>
                <li><a href="https://developer.salesforce.com" target="_blank" className="hover:text-white/90 transition">Salesforce Dev Docs</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Contact</h3>
              <p className="text-sm text-blue-100">support@salesmeta.ai</p>
              <p className="text-sm text-blue-100 mt-2">© {new Date().getFullYear()} Metadata Extractor</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
