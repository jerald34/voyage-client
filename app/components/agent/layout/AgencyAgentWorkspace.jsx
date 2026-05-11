"use client";
import AgentThreadRail from './AgentThreadRail';

export default function AgencyAgentWorkspace({ children, chatPanel, liveWorkPanel, inspectorFooter }) {
  return (
    <div className="grid h-screen overflow-hidden bg-background text-text-primary font-sans [grid-template-columns:260px_1fr_480px] max-[1200px]:[grid-template-columns:240px_1fr] max-[768px]:[grid-template-columns:1fr]">
      {/* Left Rail */}
      <aside className="border-r border-border bg-white/40 backdrop-blur-[10px] overflow-y-auto max-[768px]:hidden">
        <AgentThreadRail />
      </aside>

      {/* Center Panel (Chat) */}
      <main className="flex flex-col bg-surface relative overflow-hidden">
        {chatPanel || children}
      </main>

      {/* Right Panel (Live Work / Itinerary) */}
      <aside className="border-l border-border bg-white/40 backdrop-blur-[10px] flex flex-col overflow-hidden max-[1200px]:hidden">
        <div className="flex-grow overflow-y-auto">
          {liveWorkPanel}
        </div>
        {inspectorFooter && (
          <footer className="flex-shrink-0">
            {inspectorFooter}
          </footer>
        )}
      </aside>
    </div>
  );
}
