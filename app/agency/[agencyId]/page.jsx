import { redirect } from "next/navigation";

export default async function AgencyIndexPage({ searchParams }) {
  const search = await searchParams;
  const invitedSuffix = search?.invited ? "&invited=1" : "";
  redirect(`/?authenticated=1&tab=team${invitedSuffix}`);
}
