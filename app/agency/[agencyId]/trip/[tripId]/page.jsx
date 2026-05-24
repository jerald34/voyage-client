"use client";
import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/app/lib/api/index.js";
import TripNotInListEmptyState from "@/app/components/agency-status/TripNotInListEmptyState";

export default function TripDetailPage({ params }) {
  const { agencyId, tripId } = use(params);
  const router = useRouter();
  const [state, setState] = useState("loading"); // "loading" | "not-found" | "redirect"

  // Derive owner info from the localStorage user object
  const { ownerName, ownerEmail } = useMemo(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem("voyage-user");
      const user = raw ? JSON.parse(raw) : null;
      if (!Array.isArray(user?.memberships)) return {};
      const m = user.memberships.find((m) => m.agencyId === agencyId);
      const members = m?.agency?.memberships ?? [];
      const owner = members.find((mem) => mem.role === "OWNER");
      return {
        ownerName: owner?.user?.displayName ?? null,
        ownerEmail: owner?.user?.email ?? null,
      };
    } catch {
      return {};
    }
  }, [agencyId]);

  useEffect(() => {
    let cancelled = false;
    fetchApi(`/agencies/${agencyId}/itineraries/trips/${tripId}`)
      .then(() => {
        if (cancelled) return;
        // Trip found — redirect to the agent sub-route
        router.replace(`/agency/${agencyId}/trip/${tripId}/agent`);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.status === 404 || err?.code === "TRIP_NOT_FOUND") {
          setState("not-found");
        } else {
          // For other errors, still try the agent route
          router.replace(`/agency/${agencyId}/trip/${tripId}/agent`);
        }
      });
    return () => { cancelled = true; };
  }, [agencyId, tripId, router]);

  if (state === "not-found") {
    return <TripNotInListEmptyState ownerName={ownerName} ownerEmail={ownerEmail} />;
  }

  // Loading state
  return (
    <div className="mx-auto mt-24 max-w-md px-6 text-center">
      <p className="text-sm text-white/40">Loading&hellip;</p>
    </div>
  );
}
