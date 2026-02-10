import "./globals.css";
import AppShell from "@/components/AppShell.jsx";
import Providers from "@/components/Providers.jsx";

export const metadata = {
  title: "QR Table",
  description: "Restaurant QR ordering"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
