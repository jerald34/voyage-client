import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import AgencyDashboardClient from "./components/dashboard/AgencyDashboardClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default async function AgencyIndexPage({ params, searchParams }) {
  const { agencyId } = await params;
  const search = (await searchParams) ?? {};

  if (search.invited === "1") {
    redirect(`/agency/${agencyId}/team?invited=1`);
  }

  // Forward session cookie to the API for SSR fetch.
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("voyage_session");
  const cookieHeader = sessionCookie ? `voyage_session=${sessionCookie.value}` : "";

  let initialData = null;
  try {
    const response = await fetch(`${API_URL}/agencies/${agencyId}/dashboard?period=30d`, {
      headers: cookieHeader ? { cookie: cookieHeader } : {},
      cache: "no-store"
    });
    if (response.ok) {
      initialData = await response.json();
    }
    // 401/403 → fall through with null; client component will surface auth state.
  } catch {
    // Network error → null; the client poll will retry.
  }

  return <AgencyDashboardClient agencyId={agencyId} initialData={initialData} />;
}
