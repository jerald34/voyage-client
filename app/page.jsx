const proofPoints = [
  "Weekend breaks",
  "Solo escapes",
  "Family itineraries",
  "Group adventures",
];

const steps = [
  {
    number: "01",
    title: "Tell Voyage where you want to go",
    text: "Start with a destination, trip length, or a loose idea. Voyage turns that first spark into a structured plan.",
  },
  {
    number: "02",
    title: "Shape the itinerary in plain language",
    text: "Adjust days, interests, and pace without fighting a complicated form. The trip stays easy to understand.",
  },
  {
    number: "03",
    title: "Save the plan and keep moving",
    text: "Review the final itinerary, keep your details together, and come back whenever the trip changes.",
  },
];

const features = [
  {
    title: "Clear trip structure",
    text: "Break a trip into days, priorities, and decisions so travelers always know what comes next.",
  },
  {
    title: "Faster planning",
    text: "Remove the back-and-forth between tabs, notes, and screenshots by keeping the plan in one place.",
  },
  {
    title: "Confidence before booking",
    text: "See the shape of the trip early so users can decide whether it feels realistic and worth booking.",
  },
  {
    title: "Flexible for any trip size",
    text: "From one-night escapes to multi-city routes, the same flow works without becoming overwhelming.",
  },
];

const itinerary = [
  { time: "Mon", place: "Arrival and hotel check-in" },
  { time: "Tue", place: "Old town walk, museum, sunset dinner" },
  { time: "Wed", place: "Day trip, local market, return flight" },
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <div className="page-grid" aria-hidden="true" />

      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">V</span>
          <span>Voyage</span>
        </div>
        <nav className="topnav" aria-label="Primary">
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
          <a href="#preview">Preview</a>
          <a href="#start-planning">Start planning</a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Travel planning, made calm</p>
          <h1>Plan the trip before the trip.</h1>
          <p className="lede">
            Voyage helps travelers turn a rough idea into a clear itinerary, so the
            planning stage feels organized instead of scattered.
          </p>

          <div className="hero-actions" id="start-planning">
            <a className="button button-primary" href="#preview">
              Start planning
            </a>
            <a className="button button-secondary" href="#how-it-works">
              Learn more
            </a>
          </div>

          <div className="proof-strip" aria-label="Travel audience examples">
            {proofPoints.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        <aside className="hero-panel" aria-label="Trip preview">
          <div className="panel-card panel-card-top">
            <div>
              <p className="panel-label">Trip draft</p>
              <h2>Barcelona, 5 days</h2>
            </div>
            <div className="status-pill">In progress</div>
          </div>

          <div className="panel-card panel-card-mid">
            <div className="panel-row">
              <span>Goal</span>
              <strong>Relaxed city break</strong>
            </div>
            <div className="panel-row">
              <span>Focus</span>
              <strong>Food, walks, sunsets</strong>
            </div>
            <div className="panel-row">
              <span>Plan</span>
              <strong>3 days, 2 saved ideas</strong>
            </div>
          </div>

          <div className="panel-card panel-card-bottom">
            <div className="timeline">
              {itinerary.map((item) => (
                <div key={item.time} className="timeline-item">
                  <span>{item.time}</span>
                  <p>{item.place}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="section band">
        <p className="section-kicker">Social proof</p>
        <div className="logo-row">
          {proofPoints.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="section" id="how-it-works">
        <div className="section-heading">
          <p className="section-kicker">How it works</p>
          <h2>Three steps, one clear plan.</h2>
          <p>
            The page should explain Voyage quickly, then guide the visitor toward
            starting a plan without making them study the interface.
          </p>
        </div>

        <div className="step-grid">
          {steps.map((step) => (
            <article key={step.number} className="step-card">
              <span className="step-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="features">
        <div className="section-heading">
          <p className="section-kicker">Why it works</p>
          <h2>Focused on the part travelers usually dread.</h2>
          <p>
            Voyage removes the messy middle between inspiration and an actual,
            workable trip.
          </p>
        </div>

        <div className="feature-grid">
          {features.map((feature) => (
            <article key={feature.title} className="feature-card">
              <span className="feature-icon" aria-hidden="true" />
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section preview-section" id="preview">
        <div className="preview-copy">
          <p className="section-kicker">Preview</p>
          <h2>A wireframe that feels like a product, not a placeholder.</h2>
          <p>
            The right side shows how the trip might come together while the left
            side keeps the user oriented and ready to act.
          </p>
        </div>

        <div className="preview-board">
          <div className="board-header">
            <div>
              <span className="panel-label">Itinerary view</span>
              <h3>Trip overview</h3>
            </div>
            <a className="button button-primary button-small" href="#start-planning">
              Start planning
            </a>
          </div>

          <div className="board-body">
            <div className="board-column">
              <div className="mini-card">
                <span>Dates</span>
                <strong>21 - 25 June</strong>
              </div>
              <div className="mini-card">
                <span>Style</span>
                <strong>Light, walkable, flexible</strong>
              </div>
            </div>

            <div className="board-column board-column-wide">
              <div className="map-slab" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div className="flow-rail">
                <div className="flow-node active">Choose destination</div>
                <div className="flow-node">Add interests</div>
                <div className="flow-node">Review itinerary</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section cta-banner">
        <div>
          <p className="section-kicker">Ready to move</p>
          <h2>Turn the trip idea into something you can actually use.</h2>
        </div>
        <a className="button button-primary" href="#start-planning">
          Start planning
        </a>
      </section>

      <footer className="footer">
        <span>Voyage</span>
        <div>
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
          <a href="#preview">Preview</a>
          <a href="#start-planning">Start planning</a>
        </div>
      </footer>
    </main>
  );
}
