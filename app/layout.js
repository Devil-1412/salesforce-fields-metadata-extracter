export const metadata = {
  title: 'Salesforce Metadata Extractor',
  description: 'Connect to Salesforce and extract metadata easily',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "Arial, sans-serif",
          backgroundColor: "#f9f9f9",
          color: "#333",
          margin: 0,
          padding: 0,
        }}
      >
        {children}
      </body>
    </html>
  );
}
