'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  {
    href: '/agency/dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: '/agency/clients',
    label: 'Clients',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <circle cx="9" cy="7" r="4" />
        <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
        <path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.85" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const drawerRef = useRef(null);

  // Close drawer when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Trap focus and close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = e => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    // Prevent body scroll while drawer is open on mobile
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* ── Mobile top bar (hidden on lg+) ─────────────────────────── */}
      <header className="lg:hidden fixed top-0 inset-x-0 h-14 bg-sidebar z-40 flex items-center justify-between px-4 safe-top">
        <Link href="/" aria-label="Voyage home">
          <img src="/icon.svg" alt="Voyage" className="h-7 w-7" />
        </Link>

        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={isOpen}
          aria-controls="mobile-nav"
          className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-sidebar-text hover:bg-white/10 transition-colors cursor-pointer"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </header>

      {/* ── Mobile backdrop ────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar / Drawer ───────────────────────────────────────── */}
      <nav
        id="mobile-nav"
        ref={drawerRef}
        aria-label="Main navigation"
        className={[
          // Base: full-height sidebar on the left
          'fixed top-0 left-0 h-full bg-sidebar flex flex-col z-50 transition-transform duration-300 ease-out',
          // Mobile: slide-in drawer, full-width up to 280px
          'w-[280px] px-4 py-6',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: always visible, collapsed to icon-only 80px wide
          'lg:translate-x-0 lg:w-20 lg:px-0 lg:py-8 lg:items-center',
        ].join(' ')}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 mb-8 lg:px-0 lg:mb-10 lg:justify-center">
          <Link href="/" aria-label="Voyage home" onClick={() => setIsOpen(false)}>
            <img src="/icon.svg" alt="Voyage" className="h-8 w-8 flex-shrink-0" />
          </Link>
          <span className="text-sidebar-text font-semibold text-base lg:hidden">Voyage</span>
        </div>

        {/* Close button — mobile only */}
        <button
          onClick={() => setIsOpen(false)}
          aria-label="Close navigation menu"
          className="lg:hidden absolute top-4 right-4 w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-sidebar-text hover:bg-white/10 transition-colors cursor-pointer"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Nav links */}
        <ul className="flex flex-col gap-1 flex-1 lg:gap-2 lg:items-center" role="list">
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const isActive = pathname?.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setIsOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    // Base touch-target: min 44×44px per Apple HIG
                    'group flex items-center gap-3 min-h-[44px] rounded-xl px-3 transition-all duration-150',
                    // Active state
                    isActive
                      ? 'bg-sidebar-active/20 text-sidebar-active'
                      : 'text-sidebar-text hover:bg-white/10',
                    // Desktop: center icon, hide label
                    'lg:w-12 lg:h-12 lg:min-h-[48px] lg:justify-center lg:px-0 lg:rounded-xl',
                  ].join(' ')}
                  title={label}
                >
                  <span className="flex-shrink-0 relative">
                    {icon}
                    {/* Active indicator dot on desktop */}
                    {isActive && (
                      <span className="hidden lg:block absolute -right-1 -top-1 w-2 h-2 rounded-full bg-sidebar-active" />
                    )}
                  </span>
                  <span className="text-sm font-medium lg:hidden">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Desktop spacer — pushes page content right of the fixed sidebar ── */}
      <div className="hidden lg:block lg:w-20 flex-shrink-0" aria-hidden="true" />

      {/* ── Mobile spacer — pushes page content below the fixed top bar ─── */}
      <div className="lg:hidden h-14 flex-shrink-0" aria-hidden="true" />
    </>
  );
}
