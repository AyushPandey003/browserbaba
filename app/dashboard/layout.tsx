import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex min-h-screen w-full max-w-[100vw] bg-[#101922] overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 w-full overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
