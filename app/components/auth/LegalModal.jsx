"use client";

import { useEffect } from "react";

const legalDocuments = {
  terms: {
    title: "Terms of Service",
    eyebrow: "Simple draft",
    intro: "These terms describe how the Voyage app can be used for account creation, trip planning, itinerary sharing, and agency workspaces.",
    sections: [
      {
        title: "Using Voyage",
        body: "Voyage is a travel planning workspace. You can create an account, sign in, build trips, manage agency details, and share itinerary links with other people.",
      },
      {
        title: "Your account",
        body: "You are responsible for the information you provide and for keeping your account credentials secure. Use accurate contact details so we can help with sign-in, trip access, and workspace support.",
      },
      {
        title: "Content and sharing",
        body: "You keep ownership of the trip content and messages you create. By using Voyage, you allow us to store, process, display, and transmit that content so the app can work. If you create a share link, anyone with the link may be able to view the shared itinerary.",
      },
      {
        title: "Acceptable use",
        body: "Do not use Voyage to break the law, send spam, attempt to access other accounts, interfere with the service, or upload content that is harmful, deceptive, or abusive.",
      },
      {
        title: "Service changes",
        body: "We may update features, change these terms, or suspend access if needed to protect users, keep the service stable, or respond to misuse.",
      },
    ],
    footer: "This is a simple product-specific draft, not legal advice. If you want formal legal terms, have counsel review the final text before publishing.",
  },
  privacy: {
    title: "Privacy Policy",
    eyebrow: "Simple draft",
    intro: "This policy explains what Voyage collects, how it is used, and how sharing works inside the app.",
    sections: [
      {
        title: "Information we collect",
        body: "When you use Voyage, we may collect your name, email address, agency details, trip plans, itinerary notes, share link activity, and basic device or usage information needed to run the app.",
      },
      {
        title: "How we use information",
        body: "We use this information to create and manage your account, support travel planning, connect agency workspaces, generate and manage share links, provide customer support, and improve the product.",
      },
      {
        title: "Sharing of information",
        body: "We do not need to share your trip data with other users unless you choose to share it. Information may also be shared with service providers that help us operate the app or when we must comply with law or protect the service.",
      },
      {
        title: "Data retention and security",
        body: "We keep information for as long as it is needed to provide the app and maintain your account. We use reasonable security measures, but no online system can be guaranteed to be perfectly secure.",
      },
      {
        title: "Your choices",
        body: "You can update your account details through the app and contact us if you need help with access, correction, or deletion requests.",
      },
    ],
    footer: "This is a simple product-specific draft, not a full privacy compliance notice. If your launch requires formal regulatory coverage, have counsel review it before publishing.",
  },
};

export default function LegalModal({ activeDoc, onClose, onSelectDoc }) {
  const legalDoc = legalDocuments[activeDoc] ?? legalDocuments.terms;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center p-3 sm:p-5 bg-[rgba(15,23,42,0.48)] backdrop-blur-[10px]"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        className="w-[min(100%,760px)] max-h-[min(92vh,860px)] overflow-hidden rounded-[24px] border border-border bg-white/[0.98] shadow-[0_28px_80px_rgba(15,23,42,0.24)] dark:bg-[rgba(17,20,22,0.98)] dark:border-[rgba(255,255,255,0.08)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-5 pb-4 border-b border-border/60 dark:border-[rgba(255,255,255,0.08)]">
          <div className="min-w-0">
            <p className="m-0 mb-1 text-[11px] font-extrabold tracking-[0.14em] uppercase text-secondary">
              {legalDoc.eyebrow}
            </p>
            <h2 id="legal-modal-title" className="m-0 text-[1.35rem] sm:text-[1.5rem] font-serif text-text-primary">
              {legalDoc.title}
            </h2>
          </div>
          <button
            type="button"
            className="w-10 h-10 grid place-items-center rounded-[12px] border border-border bg-surface text-text-muted cursor-pointer transition-colors hover:border-border-strong hover:bg-surface-elevated"
            onClick={onClose}
            aria-label="Close legal dialog"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="px-5 sm:px-6 pt-4">
          <div className="inline-flex rounded-pill border border-border bg-[rgba(34,56,67,0.05)] p-1 dark:bg-[rgba(255,255,255,0.06)]">
            {[
              { key: "terms", label: "Terms of Service" },
              { key: "privacy", label: "Privacy Policy" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelectDoc(item.key)}
                className={`px-4 py-2 rounded-pill text-sm font-bold transition-colors ${
                  activeDoc === item.key
                    ? "bg-white text-text-primary shadow-md dark:bg-surface-elevated"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[calc(92vh-160px)] overflow-y-auto px-5 sm:px-6 py-5">
          <p className="m-0 text-[0.97rem] leading-[1.7] text-text-muted">
            {legalDoc.intro}
          </p>

          <div className="mt-5 grid gap-4">
            {legalDoc.sections.map((section) => (
              <section key={section.title} className="rounded-[18px] border border-border/60 bg-surface/70 p-4 sm:p-5">
                <h3 className="m-0 mb-2 text-[1rem] font-extrabold text-text-primary">
                  {section.title}
                </h3>
                <p className="m-0 text-[0.95rem] leading-[1.7] text-text-muted">
                  {section.body}
                </p>
              </section>
            ))}
          </div>

          <div className="mt-5 rounded-[18px] border border-secondary/20 bg-[rgba(215,122,97,0.06)] p-4">
            <p className="m-0 text-[0.92rem] leading-[1.65] text-text-primary">
              {legalDoc.footer}
            </p>
          </div>
        </div>

        <footer className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 px-5 sm:px-6 py-4 border-t border-border/60 dark:border-[rgba(255,255,255,0.08)]">
          <p className="m-0 text-[0.82rem] leading-[1.5] text-text-soft">
            Last updated: May 17, 2026
          </p>
          <button
            type="button"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-pill bg-accent text-white font-extrabold text-sm cursor-pointer hover:bg-[#dbbfae] transition-colors"
            onClick={onClose}
          >
            Got it
          </button>
        </footer>
      </div>
    </div>
  );
}
