"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const landingNavItems = [
  { id: "home", label: "Home" },
  { id: "plan", label: "Plan" },
  { id: "how-it-works", label: "How It Works" },
  { id: "for-agencies", label: "For Agencies" },
  { id: "for-travelers", label: "For Travelers" },
  { id: "voyage-agent", label: "Voyage Agent" },
];

const featureHighlights = [
  {
    title: "Plan the trip",
    description: "Turn a rough travel idea into a structured itinerary brief with clear priorities and pace.",
  },
  {
    title: "See the route",
    description: "Keep planning tied to geography so timing, movement, and daily flow stay realistic.",
  },
  {
    title: "Refine with AI",
    description: "Use the Voyage agent to revise stops, rebalance days, and react faster to changes.",
  },
  {
    title: "Share the final itinerary",
    description: "Hand off the plan cleanly to clients, collaborators, or fellow travelers.",
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Brief the trip",
    description: "Capture destination, schedule, traveler count, pace, and priorities in one clear planning brief.",
  },
  {
    step: "02",
    title: "Build the itinerary",
    description: "Shape daily plans with structured stops instead of juggling notes, tabs, and spreadsheets.",
  },
  {
    step: "03",
    title: "Review on the map",
    description: "Keep route awareness visible so travel time and location clustering support better decisions.",
  },
  {
    step: "04",
    title: "Share and revise",
    description:
      "Update plans quickly when clients or travelers ask for changes, then send the latest version with confidence.",
  },
];

const audienceCards = [
  {
    id: "for-agencies",
    title: "For agencies and organizers",
    benefits: [
      "Reduce manual recalculation across multiple client itineraries.",
      "Keep planning, revision, and route awareness in one workspace.",
      "Move faster when clients request destination or schedule changes.",
    ],
  },
  {
    id: "for-travelers",
    title: "For individual travelers",
    benefits: [
      "Turn scattered trip ideas into a clear day-by-day plan.",
      "Balance stops, pace, and travel time with less context switching.",
      "Use Voyage as a travel copilot before the trip ever begins.",
    ],
  },
];

const heroCarouselItems = [
  {
    id: "brief",
    label: "Trip brief",
    title: "Turn direction into a clear planning brief",
    description: "Capture destination, dates, pace, and planning priorities before the itinerary starts to take shape.",
    colorClass: "preview-card-brief",
    image: "https://images.unsplash.com/photo-1499529112087-3cb3b73cec95?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "itinerary",
    label: "Itinerary",
    title: "Shape daily flow with structured stops",
    description: "Build day-by-day plans that stay readable, editable, and ready for collaboration.",
    colorClass: "preview-card-itinerary",
    image: "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "map",
    label: "Google Maps",
    title: "Keep route logic visible while planning",
    description: "Review the trip geographically so timing, clustering, and movement stay grounded in the real route.",
    colorClass: "preview-card-map",
    image: "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "agent",
    label: "Voyage agent",
    title: "Revise plans faster when priorities change",
    description: "Use AI support to rebalance days, update stops, and respond quickly to new requests.",
    colorClass: "preview-card-agent",
    image: "https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=1000&auto=format&fit=crop",
  },
];

export default function LandingPage({ onStart }) {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroCarouselItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="landing-shell">
      <header className="landing-header">
        <a className="landing-brand" href="#home">
          Voyage
        </a>
        <nav className="landing-nav" aria-label="Landing page">
          {landingNavItems.map((item) => (
            <a key={item.id} href={`#${item.id}`}>
              {item.label}
            </a>
          ))}
        </nav>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexShrink: 0 }}>
          <Link href="/login" className="button button-secondary landing-header-cta" style={{ minHeight: "44px", padding: "10px 22px" }}>
            Login
          </Link>
          <button className="button button-primary landing-header-cta" onClick={onStart} type="button" style={{ minHeight: "44px", padding: "10px 22px" }}>
            Start Planning
          </button>
        </div>
      </header>

      <section className="landing-hero" id="home">
        <div className="landing-hero-copy">
          <span className="frame-label">Unified travel planning</span>
          <h1>Plan smarter trips with AI, itinerary logic, and map-aware routing</h1>
          <p className="lede">
            Voyage brings together trip briefs, itinerary building, Google Maps-aware planning, and fast revisions in
            one workspace for travelers, agencies, and organizers.
          </p>
          <div className="button-stack">
            <button className="button button-primary" onClick={onStart} type="button">
              Start planning
            </button>
            <a className="button button-secondary" href="#how-it-works">
              See how Voyage works
            </a>
          </div>
        </div>

        <div className="landing-hero-panel" aria-label="Voyage product preview">
          <div className="carousel-view">
            {heroCarouselItems.map((item, index) => (
              <div
                key={item.id}
                style={{
                  display: index === activeSlide ? "block" : "none",
                  animation: index === activeSlide ? "fade-in 0.4s ease-out" : "none",
                }}
              >
                <article className={`preview-card ${item.colorClass}`} style={{ padding: 0 }}>
                  <div className="preview-card-image">
                    <img src={item.image} alt={item.label} />
                  </div>
                  <div className="preview-card-content">
                    <span className="frame-label">{item.label}</span>
                    <h2>{item.title}</h2>
                    <p>{item.description}</p>
                  </div>
                </article>
              </div>
            ))}
          </div>

          <div className="carousel-indicators">
            {heroCarouselItems.map((item, index) => (
              <button
                key={item.id}
                className={`carousel-dot ${index === activeSlide ? "active" : ""}`}
                onClick={() => setActiveSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section" id="plan">
        <div className="section-heading">
          <span className="frame-label">Product overview</span>
          <h2>What is Voyage?</h2>
          <p className="lede">
            Voyage is a planning workspace that connects trip briefs, itinerary structure, route awareness, and AI
            revision tools so travel planning feels coordinated from the first draft to the final share.
          </p>
        </div>

        <div className="feature-grid">
          {featureHighlights.map((feature) => (
            <article key={feature.title} className="marketing-card">
              <span className="frame-label">{feature.title}</span>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section" id="how-it-works">
        <div className="section-heading">
          <span className="frame-label">Workflow</span>
          <h2>How Voyage works</h2>
          <p className="lede">
            Move from a rough request to a map-aware itinerary in a four-step flow built for iteration instead of
            scattered planning tools.
          </p>
        </div>

        <div className="workflow-grid">
          {workflowSteps.map((step) => (
            <article key={step.step} className="workflow-card">
              <span className="frame-label">{step.step}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <div className="section-heading">
          <span className="frame-label">Audience</span>
          <h2>Built for every kind of planner</h2>
          <p className="lede">
            Whether you are coordinating client travel or mapping your own trip, Voyage keeps the planning logic in one
            place.
          </p>
        </div>

        <div className="audience-grid">
          {audienceCards.map((audience) => (
            <article key={audience.id} className="audience-card" id={audience.id}>
              <h3>{audience.title}</h3>
              <ul>
                {audience.benefits.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section" id="voyage-agent">
        <div className="frame-panel">
          <span className="frame-label">Voyage agent</span>
          <h2>Keep every revision connected to the plan</h2>
          <p className="lede">
            Voyage helps you revise with context, keep route awareness visible, and move from draft planning to a
            confident itinerary without restarting the workflow.
          </p>
          <div className="button-stack">
            <button className="button button-primary" onClick={onStart} type="button">
              Open the planner
            </button>
            <a className="button button-secondary" href="#plan">
              Review the product overview
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
