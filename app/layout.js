import './globals.css';

export const metadata = {
  title: 'Salesforce Metadata Extractor',
  description: 'Connect and explore Salesforce object metadata easily.',
};

export default function RootLayout({ children }) {
  const isLoggedIn = !!sessionStorage.getItem("accessToken");
  const showLogout = isLoggedIn;

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
