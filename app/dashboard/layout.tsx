import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex h-screen w-full max-w-[100vw] bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
