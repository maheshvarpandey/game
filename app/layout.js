import "./globals.css";

export const metadata = {
  title: "Mini Battle Survival",
  description: "A lightweight browser survival game built with Next.js and Canvas.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
