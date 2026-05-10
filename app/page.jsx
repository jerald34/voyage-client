export default function LandingPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto mt-20">
      <header className="text-center mb-16">
        <h1 className="text-5xl font-serif text-primary-navy mb-4">AI-Powered Itinerary Intelligence for Travel Agencies</h1>
        <div className="space-x-4">
          <button className="bg-warm-sand text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity">Start Free Trial</button>
          <button className="border border-primary-navy text-primary-navy px-6 py-3 rounded-lg hover:bg-primary-navy hover:text-white transition-colors">View Demo</button>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-2xl shadow-soft p-6 h-96 flex flex-col justify-end">
          <h3 className="text-xl font-semibold text-primary-navy">Real-time Agent Sync</h3>
        </div>
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-soft p-6 h-44">
            <h3 className="text-xl font-semibold text-primary-navy">Client-Ready in Seconds</h3>
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6 h-44">
            <h3 className="text-xl font-semibold text-primary-navy">Centralized Directory</h3>
          </div>
        </div>
      </section>
    </div>
  );
}
