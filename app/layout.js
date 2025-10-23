'use client';

import './globals.css';
import { usePathname } from 'next/navigation';

export const metadata = {
  title: 'Salesforce Metadata Extractor',
  description: 'Connect and explore Salesforce object metadata easily.',
};

export default function RootLayout({ children }) {
  const pathname = usePathname(); // ✅ inside the component
  const isLoggedIn = !!sessionStorage.getItem("accessToken"); // check login
  const showLogout = isLoggedIn && pathname !== "/"; // hide logout on login page

  return (
    <html lang="en">
      <body>
        <header className="navbar">
          <h1 className="text-xl font-bold text-primary">Salesforce Metadata Extractor</h1>
          {showLogout && (
            <a href="/" className="btn btn-secondary">Logout</a>
          )}
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
