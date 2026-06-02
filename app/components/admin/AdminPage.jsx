"use client";

import { useState } from "react";
import AdminAgenciesPage from "./AdminAgenciesPage.jsx";
import UsageSection from "./usage/UsageSection.jsx";

const SECTIONS = [
  { id: "agencies", label: "Agencies" },
  { id: "usage", label: "Usage" },
  { id: "reports", label: "Reports" },
];

function SubNavPill({ id, label, active, badge, onSelect }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      type="button"
      onClick={() => onSelect(id)}
      className={`relative min-h-11 whitespace-nowrap rounded-pill px-4 py-2 text-sm font-semibold transition active:scale-[0.97] motion-reduce:transition-none ${
        active ? "bg-primary text-white shadow-soft" : "bg-surface text-text-muted hover:text-text-primary"
      }`}
    >
      {label}
      {badge > 0 && (
        <span className="ml-2 inline-flex min-w-[18px] items-center justify-center rounded-pill bg-secondary px-1 text-[10px] font-bold leading-[18px] text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

export default function AdminPage({ onPendingCountChange, reportsBadge = 0 }) {
  const [section, setSection] = useState("agencies");

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-[1100px] mx-auto">
      <div
        role="tablist"
        aria-label="Admin sections"
        className="mb-6 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {SECTIONS.map((s) => (
          <SubNavPill
            key={s.id}
            id={s.id}
            label={s.label}
            active={section === s.id}
            badge={s.id === "reports" ? reportsBadge : 0}
            onSelect={setSection}
          />
        ))}
      </div>

      {section === "agencies" && <AdminAgenciesPage onPendingCountChange={onPendingCountChange} />}
      {section === "usage" && <UsageSection />}
      {section === "reports" && (
        <div className="py-16 text-center text-sm text-text-muted">
          <p className="font-serif text-2xl text-text-primary">Reports inbox — no reports yet</p>
          <p className="mt-2">Submitted reports will appear here.</p>
        </div>
      )}
    </div>
  );
}
