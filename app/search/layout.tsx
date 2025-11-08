import { Sidebar } from '@/components/Sidebar';

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#101922]">
      <Sidebar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
