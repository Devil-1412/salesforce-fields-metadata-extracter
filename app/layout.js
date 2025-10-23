// layout.js
import './globals.css';
import { usePathname } from 'next/navigation';

export const metadata = {
  title: 'Salesforce Metadata Extractor',
  description: 'Connect and explore Salesforce object metadata easily.',
};

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const showHeader = pathname !== '/';

  return (
    <html lang="en">
      <body>
        {showHeader && (
          <header className="navbar">
            <h1 className="text-xl font-bold text-primary">Salesforce Metadata Extractor</h1>
            <a href="/" className="btn btn-secondary">Logout</a>
          </header>
        )}
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
