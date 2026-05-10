import Sidebar from "@/app/components/navigation/Sidebar";

export default function AgencyLayout({ children }) {
  return (
    <>
      <Sidebar />
      <main className="ml-20 min-h-screen">
        {children}
      </main>
    </>
  );
}
