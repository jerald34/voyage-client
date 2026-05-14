'use client';

import { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Already installed in standalone mode — nothing to show
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (isStandalone) return;

    // User already dismissed this session or permanently
    if (sessionStorage.getItem('voyage-install-dismissed')) return;

    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (isIOSDevice) {
      setIsIOS(true);
      setShow(true);
      return;
    }

    const handler = e => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setShow(false));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShow(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('voyage-install-dismissed', '1');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="banner"
      aria-label="Install Voyage app"
      className="fixed bottom-4 left-4 right-4 z-[1000] sm:left-auto sm:right-4 sm:w-80 bg-surface border border-border/20 rounded-[18px] shadow-strong p-4 flex items-start gap-3"
      style={{ animation: 'slideUp 0.3s ease-out' }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* App icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
        <img src="/icon.svg" alt="" aria-hidden="true" className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary leading-snug">
          Install Voyage
        </p>

        {isIOS ? (
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Tap the{' '}
            <span aria-label="Share button" className="font-medium">
              Share
            </span>{' '}
            icon then <span className="font-medium">"Add to Home Screen"</span>{' '}
            for offline access.
          </p>
        ) : (
          <>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Add to your home screen for offline access and a faster experience.
            </p>
            <button
              onClick={handleInstall}
              className="mt-2.5 px-4 py-1.5 text-xs font-semibold bg-primary text-sidebar-text rounded-full min-h-[36px] hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            >
              Install App
            </button>
          </>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        aria-label="Dismiss install prompt"
        className="flex-shrink-0 w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-full hover:bg-background transition-colors cursor-pointer"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-text-muted" aria-hidden="true">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}
