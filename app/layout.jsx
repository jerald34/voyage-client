import "./globals.css";

export const metadata = {
  title: "Voyage | PWA trip planning prototype",
  description:
    "A responsive Voyage prototype for itinerary-first travel planning across welcome, entry, and trip brief screens.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
