import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getMemories } from '@/lib/actions/memory-actions';
import CollectionsClient from './CollectionsClient';
import { Suspense } from 'react';

export default async function CollectionsPage() {
  // Check authentication
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login?from=/collections');
  }

  // Fetch memories for the authenticated user
  const memories = await getMemories({ userId: session.user.id });

  return (
    <Suspense fallback={<div className="flex-1 p-8 text-foreground">Loading collections...</div>}>
      <CollectionsClient memories={memories} />
    </Suspense>
  );
}
