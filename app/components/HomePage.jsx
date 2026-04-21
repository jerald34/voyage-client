"use client";

import React from "react";

export default function HomePage({ onContinue, tripBrief }) {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="landing-shell system-shell" style={{ paddingTop: "20px", maxWidth: "1220px" }}>
      <header className="landing-header" style={{ position: "relative", marginBottom: "48px", width: "100%" }}>
        <a className="landing-brand" href="#home">
          Voyage
        </a>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <div style={{ textAlign: "right", display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--voyage-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700" }}>{currentDate}</span>
            <strong style={{ fontSize: "0.95rem", color: "var(--voyage-text)" }}>Traveler</strong>
          </div>
          <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "var(--voyage-accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold", fontSize: "1.1rem", border: "2px solid rgba(255,255,255,0.8)", boxShadow: "var(--voyage-shadow-soft)" }}>
            T
          </div>
        </div>
      </header>

      <section className="landing-section" style={{ paddingTop: "0", paddingBottom: "48px", width: "100%" }}>
        <div className="section-heading" style={{ marginBottom: "48px" }}>
          <span className="frame-label">Planner Dashboard</span>
          <h1 style={{ fontSize: "clamp(2.8rem, 5vw, 4.5rem)", maxWidth: "100%", marginBottom: "16px" }}>Your Voyages</h1>
          <p className="lede" style={{ maxWidth: "600px" }}>Continue shaping your active travel briefs or explore new destinations for your next adventure.</p>
        </div>

        <div className="feature-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "32px", width: "100%" }}>
          {/* Active Trip Card */}
          <article 
            className="preview-card preview-card-brief" 
            style={{ 
              padding: 0, 
              cursor: "pointer", 
              transition: "all 0.3s ease", 
              border: "1px solid rgba(216, 180, 160, 0.4)",
              boxShadow: "0 24px 48px rgba(216, 180, 160, 0.12)"
            }} 
            onClick={onContinue}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 32px 64px rgba(216, 180, 160, 0.18)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 24px 48px rgba(216, 180, 160, 0.12)";
            }}
          >
            <div className="preview-card-image" style={{ height: "220px", position: "relative" }}>
               <img src="https://images.unsplash.com/photo-1583422409516-2895a77efded?q=80&w=1000&auto=format&fit=crop" alt="Barcelona" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
               <div style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(255,255,255,0.95)", padding: "6px 14px", borderRadius: "99px", fontSize: "0.75rem", fontWeight: "800", color: "var(--voyage-primary)", textTransform: "uppercase", letterSpacing: "0.05em", backdropFilter: "blur(4px)" }}>
                 Active Brief
               </div>
            </div>
            <div className="preview-card-content" style={{ padding: "32px" }}>
              <span className="frame-label" style={{ marginBottom: "12px" }}>Current Workspace</span>
              <h2 style={{ fontSize: "2rem", marginBottom: "12px", fontFamily: "'DM Serif Display', serif", lineHeight: "1.1" }}>{tripBrief?.destination || "Destination"}</h2>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
                <p style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0, color: "var(--voyage-text-muted)", fontSize: "0.95rem" }}>
                  <span style={{ fontSize: "1.2rem", filter: "grayscale(0.2)" }}>🗓️</span> {tripBrief?.travelWindow || "Dates pending"}
                </p>
                <p style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0, color: "var(--voyage-text-muted)", fontSize: "0.95rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  <span style={{ fontSize: "1.2rem", filter: "grayscale(0.2)" }}>✨</span> {tripBrief?.priority || "Priorities pending"}
                </p>
              </div>
              
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "32px", padding: "16px", background: "rgba(255,255,255,0.6)", borderRadius: "var(--voyage-radius-sm)", border: "1px solid rgba(0,0,0,0.04)" }}>
                 <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: "600", color: "var(--voyage-text-muted)" }}>
                   <span style={{display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "var(--voyage-secondary)"}}></span>
                   {tripBrief?.travelers || 2} Travelers
                 </span>
                 <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: "600", color: "var(--voyage-text-muted)" }}>
                   <span style={{display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "var(--voyage-accent)"}}></span>
                   {tripBrief?.budget || "Budget TBD"}
                 </span>
              </div>

              <button className="button button-primary" style={{ width: "100%", padding: "14px", fontSize: "1rem" }} onClick={(e) => { e.stopPropagation(); onContinue(); }}>
                Open Workspace
              </button>
            </div>
          </article>

          {/* Start New Trip Card */}
          <article className="preview-card" style={{ padding: "40px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", background: "rgba(255,255,255,0.4)", border: "2px dashed var(--voyage-border-strong)", transition: "all 0.3s ease", cursor: "pointer" }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.background = "rgba(255,255,255,0.8)";
                     e.currentTarget.style.borderColor = "var(--voyage-secondary)";
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.background = "rgba(255,255,255,0.4)";
                     e.currentTarget.style.borderColor = "var(--voyage-border-strong)";
                   }}>
             <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "var(--voyage-background)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px", fontSize: "2rem", color: "var(--voyage-secondary)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.04)" }}>
               +
             </div>
             <h2 style={{ fontSize: "1.8rem", marginBottom: "12px" }}>Plan a New Voyage</h2>
             <p style={{ marginBottom: "32px", fontSize: "1.05rem", maxWidth: "280px", color: "var(--voyage-text-muted)" }}>Create a new brief and use our AI agent to build the perfect map-aware itinerary.</p>
             <button className="button button-secondary" style={{ width: "100%", padding: "14px", fontSize: "1rem" }}>
               Start New Brief
             </button>
          </article>
        </div>
      </section>
      
      <section className="landing-section" style={{ paddingTop: "0", width: "100%" }}>
        <div className="frame-panel" style={{ padding: "40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" }}>
            <div>
              <span className="frame-label">Archive</span>
              <h2 style={{ fontSize: "2.2rem", margin: 0 }}>Past Adventures</h2>
            </div>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
             {/* Dummy past trip 1 */}
             <div style={{ background: "#fff", borderRadius: "var(--voyage-radius-md)", border: "1px solid var(--voyage-border)", overflow: "hidden", transition: "transform 0.2s ease, box-shadow 0.2s ease", cursor: "pointer" }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--voyage-shadow-soft)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                 <div style={{ height: "140px" }}>
                    <img src="https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=600&auto=format&fit=crop" alt="Paris" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} />
                 </div>
                 <div style={{ padding: "20px" }}>
                     <h3 style={{ fontSize: "1.3rem", marginBottom: "6px", fontFamily: "'DM Serif Display', serif" }}>Paris, France</h3>
                     <span style={{ fontSize: "0.85rem", color: "var(--voyage-text-muted)", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                       <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#ccc" }}></span>
                       Oct 2025 • 5 Days
                     </span>
                 </div>
             </div>
             {/* Dummy past trip 2 */}
             <div style={{ background: "#fff", borderRadius: "var(--voyage-radius-md)", border: "1px solid var(--voyage-border)", overflow: "hidden", transition: "transform 0.2s ease, box-shadow 0.2s ease", cursor: "pointer" }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--voyage-shadow-soft)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                 <div style={{ height: "140px" }}>
                    <img src="https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=600&auto=format&fit=crop" alt="London" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} />
                 </div>
                 <div style={{ padding: "20px" }}>
                     <h3 style={{ fontSize: "1.3rem", marginBottom: "6px", fontFamily: "'DM Serif Display', serif" }}>London, UK</h3>
                     <span style={{ fontSize: "0.85rem", color: "var(--voyage-text-muted)", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                       <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#ccc" }}></span>
                       May 2024 • 7 Days
                     </span>
                 </div>
             </div>
             
             {/* Dummy past trip 3 */}
             <div style={{ background: "#fff", borderRadius: "var(--voyage-radius-md)", border: "1px solid var(--voyage-border)", overflow: "hidden", transition: "transform 0.2s ease, box-shadow 0.2s ease", cursor: "pointer" }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--voyage-shadow-soft)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                 <div style={{ height: "140px" }}>
                    <img src="https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?q=80&w=600&auto=format&fit=crop" alt="Venice" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} />
                 </div>
                 <div style={{ padding: "20px" }}>
                     <h3 style={{ fontSize: "1.3rem", marginBottom: "6px", fontFamily: "'DM Serif Display', serif" }}>Venice, Italy</h3>
                     <span style={{ fontSize: "0.85rem", color: "var(--voyage-text-muted)", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                       <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#ccc" }}></span>
                       Sep 2023 • 4 Days
                     </span>
                 </div>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}
