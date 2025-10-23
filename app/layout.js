import './globals.css';
import LogoutButton from './LogoutButton'; // this is a client component

export const metadata = {
  title: 'Salesforce Metadata Extractor',
  description: 'Connect and explore Salesforce object metadata easily.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="navbar">
          <h1 className="text-xl font-bold text-primary">Salesforce Metadata Extractor</h1>
          <LogoutButton /> {/* client component handles visibility */}
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
