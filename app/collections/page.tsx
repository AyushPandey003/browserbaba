import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function CollectionsPage() {
  // Check authentication
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login?from=/collections');
  }

  return (
    <main className="flex-1 bg-[#101922] min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-4">Collections</h1>
        <p className="text-gray-400">Organize your memories into collections. Coming soon!</p>
      </div>
    </main>
  );
}
