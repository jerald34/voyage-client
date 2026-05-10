// Voyage-Client/app/components/navigation/Sidebar.jsx
import Link from 'next/link';

export default function Sidebar() {
  return (
    <nav className="w-20 fixed left-0 top-0 h-full bg-primary-navy flex flex-col items-center py-8 z-50">
      <div className="flex flex-col space-y-8 text-white text-xs text-center">
        <Link href="/agency/dashboard" className="p-2 hover:text-warm-sand border-l-2 border-transparent hover:border-warm-sand">Dashboard</Link>
        <Link href="/agency/clients" className="p-2 hover:text-warm-sand border-l-2 border-transparent hover:border-warm-sand">Clients</Link>
      </div>
    </nav>
  );
}
