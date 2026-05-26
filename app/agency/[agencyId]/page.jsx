"use client";
import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAgencyRole } from "@/app/hooks/useAgencyRole";
import OwnerOverview from "./components/dashboard/OwnerOverview";
import StaffMyWork from "./components/dashboard/StaffMyWork";

export default function AgencyIndexPage({ params, searchParams }) {
  const { agencyId } = use(params);
  const search = use(searchParams);
  const role = useAgencyRole(agencyId);
  const router = useRouter();

  useEffect(() => {
    if (search?.invited === "1") {
      router.replace(`/agency/${agencyId}/team?invited=1`);
    }
  }, [search?.invited, agencyId, router]);

  if (role == null) return null;
  if (role === "STAFF") return <StaffMyWork agencyId={agencyId} />;
  return <OwnerOverview agencyId={agencyId} />;
}
