"use client";
import { use } from "react";
import Link from "next/link";
import { useAgencyRole } from "@/app/hooks/useAgencyRole";

export default function AgencyLayout({ children, params }) {
  const { agencyId } = use(params);
  const role = useAgencyRole(agencyId);

  const tabs = [
    { href: `/agency/${agencyId}/trip`, label: role === "STAFF" ? "My Trips" : "Trips" },
    { href: `/agency/${agencyId}/agent`, label: "Agent" },
    { href: `/agency/${agencyId}/team`, label: "Team" },
    ...(role === "OWNER" || role === "ADMIN"
      ? [{ href: `/agency/${agencyId}/settings`, label: "Settings" }]
      : []),
  ];

  return (
    <div className="flex h-full flex-col">
      <nav className="flex gap-1 border-b border-white/8 px-6 py-3 text-sm" aria-label="Agency navigation">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="rounded px-3 py-1.5 text-white/65 transition-colors hover:bg-white/5 hover:text-white"
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
