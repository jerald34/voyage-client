import './globals.css';
import Sidebar from './components/navigation/Sidebar';

export const metadata = {
  title: 'Voyage | AI Itinerary Planner',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-off-white text-slate-900 min-h-screen m-0 p-0" suppressHydrationWarning>
        <Sidebar />
        <main className="ml-20 min-h-screen">
          {children}
        </main>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
