import "./globals.css";

export const metadata = {
  title: "Voyage | Plan the trip before the trip",
  description: "Voyage is a traveler-first landing page concept that turns trip planning into a calm, guided flow.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
