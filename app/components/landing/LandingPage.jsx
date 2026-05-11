"use client";

import ThemeToggle from "../theme/ThemeToggle";

/* ------------------------------------------------------------------ */
/*  Inline SVG icon components (no external icon library dependency)   */
/* ------------------------------------------------------------------ */

function IconSparkle({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v1m0 16v1m-7.07-2.93l.71-.71M18.36 5.64l.71-.71M3 12h1m16 0h1M5.64 5.64l-.71-.71m13.43 13.43l-.71-.71" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function IconUsers({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconZap({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconShare({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function IconCheckCircle({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function IconShield({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconArrowRight({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function IconPlay({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

const workflowSteps = [
  { num: 1, title: "Brief your AI", description: "Describe the trip, traveler preferences, dates, and pace in plain language." },
  { num: 2, title: "Review the draft", description: "Your AI co-pilot produces a structured day-by-day itinerary in seconds." },
  { num: 3, title: "Refine together", description: "Swap stops, rebalance days, and adjust pacing through conversation." },
  { num: 4, title: "Share with client", description: "Export a polished, branded itinerary your clients will love." },
];

const agencyBenefits = [
  { icon: IconUsers, title: "Multi-client management", description: "Handle dozens of active trips across your whole team from one dashboard." },
  { icon: IconShare, title: "Branded share screens", description: "Client-facing itineraries match your agency's look and feel." },
  { icon: IconCheckCircle, title: "Team collaboration", description: "Assign trips to agents, leave notes, and co-edit in real time." },
  { icon: IconShield, title: "Approval workflows", description: "Built-in review stages so nothing ships without sign-off." },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function LandingPage({ onLogin, onContinue }) {
  return (
    <div className="flex flex-col min-h-screen font-sans text-text-primary bg-background">

      {/* ── Sticky Header ─────────────────────────────────────── */}
      <header className="sticky top-4 z-50 mx-auto w-full max-w-[1220px] px-4">
        <div className="flex items-center justify-between gap-6 px-7 py-4 bg-surface/80 backdrop-blur-md border border-border/[0.12] rounded-pill shadow-soft">
          {/* Brand */}
          <a href="#" className="font-serif text-2xl tracking-tight text-text-primary no-underline shrink-0">
            Voyage
          </a>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-2" aria-label="Landing navigation">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-bold text-text-muted rounded-pill transition-colors duration-150 hover:text-secondary hover:bg-accent/[0.08] no-underline"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <ThemeToggle />
            <button
              type="button"
              onClick={onLogin}
              className="hidden sm:inline-flex items-center px-5 py-2.5 text-sm font-extrabold text-text-primary border border-border/[0.18] rounded-pill bg-transparent transition-all duration-150 hover:bg-accent/[0.08] hover:border-accent/30 cursor-pointer"
            >
              Login
            </button>
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex items-center px-5 py-2.5 text-sm font-extrabold text-white bg-secondary rounded-pill border border-transparent transition-opacity duration-150 hover:opacity-90 cursor-pointer"
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero Section ──────────────────────────────────────── */}
      <section className="w-full max-w-[1220px] mx-auto px-4 pt-24 pb-20 md:pt-36 md:pb-28 text-center flex flex-col items-center gap-6">
        {/* Overline */}
        <span className="text-text-soft uppercase tracking-[0.18em] text-xs font-extrabold">
          AI-Powered Travel Platform
        </span>

        {/* Headline */}
        <h1 className="font-serif text-3xl md:text-5xl lg:text-[3.5rem] leading-[1.08] tracking-tight text-text-primary max-w-[18ch] mx-auto">
          Itinerary Intelligence for Travel Agencies
        </h1>

        {/* Subheadline */}
        <p className="text-text-muted text-lg max-w-[52ch] mx-auto leading-relaxed">
          Build, refine, and share stunning itineraries with your AI co-pilot.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex items-center gap-2 bg-secondary text-white rounded-pill px-6 py-3 text-sm font-extrabold border border-transparent transition-opacity duration-150 hover:opacity-90 cursor-pointer"
          >
            Start Free Trial
            <IconArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 border border-border/20 text-text-primary rounded-pill px-6 py-3 text-sm font-extrabold bg-transparent transition-colors duration-150 hover:bg-accent/[0.08] cursor-pointer"
          >
            <IconPlay className="w-3.5 h-3.5" />
            Watch Demo
          </button>
        </div>

        {/* Social Proof */}
        <div className="flex flex-col items-center gap-3 mt-6">
          <p className="text-text-soft text-sm font-bold">
            Trusted by 2,400+ travel agencies
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="px-3 py-1.5 text-xs font-bold text-text-muted bg-surface border border-border/[0.1] rounded-pill">
              4.9 avg rating
            </span>
            <span className="px-3 py-1.5 text-xs font-bold text-text-muted bg-surface border border-border/[0.1] rounded-pill">
              120k+ itineraries built
            </span>
            <span className="px-3 py-1.5 text-xs font-bold text-text-muted bg-surface border border-border/[0.1] rounded-pill">
              32 countries
            </span>
          </div>
        </div>
      </section>

      {/* ── Bento Grid ────────────────────────────────────────── */}
      <section id="features" className="w-full max-w-[1220px] mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Large Left — AI Agent Command Center */}
          <div className="md:col-span-2 md:row-span-2 group relative overflow-hidden bg-surface rounded-lg shadow-soft border border-border/[0.08] hover:-translate-y-1 transition-transform duration-200">
            {/* Placeholder visual — gradient representing agent chat + map */}
            <div className="relative w-full h-full min-h-[340px] md:min-h-[480px]">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-secondary/20 to-accent/30 rounded-lg" />
              {/* Fake chat bubbles */}
              <div className="absolute top-8 left-8 right-8 flex flex-col gap-3">
                <div className="w-3/4 h-10 rounded-md bg-surface-elevated/80 border border-border/[0.06]" />
                <div className="w-1/2 h-10 rounded-md bg-secondary/[0.12] border border-secondary/[0.08] self-end" />
                <div className="w-2/3 h-10 rounded-md bg-surface-elevated/80 border border-border/[0.06]" />
              </div>
              {/* Map hint */}
              <div className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-tl-lg bg-gradient-to-tl from-accent/20 via-secondary/[0.08] to-transparent" />
              {/* Description overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-surface via-surface/90 to-transparent">
                <span className="text-secondary uppercase tracking-[0.18em] text-xs font-extrabold">
                  Flagship Feature
                </span>
                <h3 className="font-serif text-2xl md:text-3xl text-text-primary mt-2 mb-2">
                  AI Agent Command Center
                </h3>
                <p className="text-text-muted text-sm max-w-[48ch] leading-relaxed">
                  Chat with your AI co-pilot, watch the itinerary build in real time, and see every stop plotted on the map — all in one split-screen workspace.
                </p>
              </div>
            </div>
          </div>

          {/* Top Right — Client-Ready in Seconds */}
          <div className="group relative overflow-hidden bg-surface rounded-lg shadow-soft border border-border/[0.08] hover:-translate-y-1 transition-transform duration-200">
            <div className="relative min-h-[220px] md:min-h-0 md:h-full">
              {/* Accent gradient tint */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.15] to-secondary/[0.06] rounded-lg" />
              <div className="relative p-6 flex flex-col justify-end h-full min-h-[220px]">
                <IconZap className="w-8 h-8 text-secondary mb-3" />
                <h3 className="font-serif text-xl text-text-primary mb-1.5">
                  Client-Ready in Seconds
                </h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  Generate polished, branded PDF itineraries that look hand-crafted in a fraction of the time.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Right — Centralized Client Directory */}
          <div className="group relative overflow-hidden bg-surface rounded-lg shadow-soft border border-border/[0.08] hover:-translate-y-1 transition-transform duration-200">
            <div className="relative min-h-[220px] md:min-h-0 md:h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] to-accent/[0.08] rounded-lg" />
              <div className="relative p-6 flex flex-col justify-end h-full min-h-[220px]">
                <IconUsers className="w-8 h-8 text-secondary mb-3" />
                <h3 className="font-serif text-xl text-text-primary mb-1.5">
                  Centralized Client Directory
                </h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  Every client, trip history, and preference in one searchable directory for your entire team.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────── */}
      <section id="how-it-works" className="w-full max-w-[1220px] mx-auto px-4 pb-24">
        <div className="text-center mb-14">
          <span className="text-text-soft uppercase tracking-[0.18em] text-xs font-extrabold">
            Workflow
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-text-primary mt-3 mb-3">
            How It Works
          </h2>
          <p className="text-text-muted text-base max-w-[52ch] mx-auto leading-relaxed">
            Four simple steps from a rough travel idea to a polished, client-ready itinerary.
          </p>
        </div>

        {/* Steps — horizontal on desktop, vertical on mobile */}
        <div className="relative flex flex-col md:flex-row items-start md:items-stretch gap-10 md:gap-0">
          {/* Connecting dashed line (desktop only) */}
          <div className="hidden md:block absolute top-4 left-[calc(12.5%+16px)] right-[calc(12.5%+16px)] border-t-2 border-dashed border-border/20" />

          {workflowSteps.map((step, i) => (
            <div key={step.num} className="flex-1 flex flex-col items-center text-center relative px-4">
              {/* Number badge */}
              <div className="relative z-10 w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center text-sm font-bold mb-4 shrink-0">
                {step.num}
              </div>
              <h3 className="font-serif text-lg text-text-primary mb-2">{step.title}</h3>
              <p className="text-text-muted text-sm leading-relaxed max-w-[28ch]">{step.description}</p>

              {/* Vertical connector on mobile (between items) */}
              {i < workflowSteps.length - 1 && (
                <div className="md:hidden w-px h-8 border-l-2 border-dashed border-border/20 mt-4" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Agency Value Props ────────────────────────────────── */}
      <section id="pricing" className="w-full max-w-[1220px] mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">

          {/* Left — copy + benefit rows */}
          <div>
            <span className="text-text-soft uppercase tracking-[0.18em] text-xs font-extrabold">
              For Professionals
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-text-primary mt-3 mb-8">
              Built for Agencies
            </h2>

            <div className="flex flex-col gap-7">
              {agencyBenefits.map((b) => {
                const Icon = b.icon;
                return (
                  <div key={b.title} className="flex gap-4 items-start">
                    <div className="shrink-0 w-10 h-10 rounded-sm bg-secondary/[0.1] flex items-center justify-center text-secondary">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-sans text-sm font-extrabold text-text-primary mb-1">{b.title}</h4>
                      <p className="text-text-muted text-sm leading-relaxed">{b.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right — placeholder illustration with glassmorphic treatment */}
          <div className="relative rounded-lg overflow-hidden min-h-[360px] md:min-h-[440px]">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/30 via-secondary/[0.12] to-primary/[0.06]" />
            {/* Glassmorphic card overlay */}
            <div className="absolute inset-6 md:inset-10 bg-surface/60 backdrop-blur-md border border-border/[0.12] rounded-md shadow-soft flex flex-col items-center justify-center gap-4 p-8 text-center">
              <IconSparkle className="w-10 h-10 text-secondary" />
              <p className="font-serif text-xl text-text-primary">Agency Dashboard Preview</p>
              <p className="text-text-muted text-sm max-w-[32ch]">
                See your entire client portfolio, upcoming departures, and agent workload at a glance.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ── CTA Footer ────────────────────────────────────────── */}
      <section className="w-full bg-sidebar py-20 md:py-28 mt-auto">
        <div className="max-w-[1220px] mx-auto px-4 text-center flex flex-col items-center gap-6">
          <h2 className="font-serif text-3xl md:text-4xl text-white">
            Ready to transform your agency?
          </h2>
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex items-center gap-2 bg-secondary text-white rounded-pill px-8 py-3.5 text-sm font-extrabold border border-transparent transition-opacity duration-150 hover:opacity-90 cursor-pointer"
          >
            Start Free Trial
            <IconArrowRight className="w-4 h-4" />
          </button>
          <p className="text-white/50 text-sm">
            No credit card required. 14-day free trial.
          </p>
        </div>
      </section>

    </div>
  );
}
