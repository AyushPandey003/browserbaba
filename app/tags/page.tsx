import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function TagsPage() {
  // Check authentication
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login?from=/tags');
  }

  return (
    <main className="flex-1 bg-[#101922] min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-4">Tags</h1>
        <p className="text-gray-400">Tag and categorize your memories. Coming soon!</p>
      </div>
    </main>
  );
}
