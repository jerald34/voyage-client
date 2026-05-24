"use client";
import { use } from "react";
import TeamPage from "@/app/components/team/TeamPage";

export default function Page({ params }) {
  const { agencyId } = use(params);
  return <TeamPage agencyId={agencyId} />;
}
