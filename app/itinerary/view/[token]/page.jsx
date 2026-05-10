import GlassPanel from '../../../components/share/GlassPanel';

export default function ClientShareScreen({ params }) {
  return (
    <div className="relative w-full h-[calc(100vh)] bg-slate-300">
      {/* Background Map Placeholder */}
      <div className="absolute inset-0 flex items-center justify-center text-slate-500 bg-blue-50">
        <p className="text-2xl">100% Immersive Map Background (Map Tiles Here)</p>
      </div>

      <GlassPanel>
        <div className="header mb-8">
          <h1 className="text-3xl font-serif text-primary-navy mb-1">Trip to Paris</h1>
          <p className="text-sm text-gray-500 uppercase tracking-wider">Voyage Travel Agency</p>
        </div>
        
        <div className="timeline flex-1 relative">
          <h2 className="text-lg font-bold text-primary-navy sticky top-0 bg-white/40 backdrop-blur py-2 z-20">Day 1: Arrival & Exploring</h2>
          <div className="card bg-white rounded-xl p-4 shadow-soft mb-4 mt-2">
            <p className="text-xs text-warm-sand font-bold mb-1">10:00 AM</p>
            <h3 className="font-semibold text-slate-800">Eiffel Tower</h3>
            <p className="text-sm text-slate-600 mt-1">Explore the iconic landmark and enjoy panoramic views of Paris.</p>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
