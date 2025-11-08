import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import TagsClient from './TagsClient';
import { getMemories } from '@/lib/actions/memory-actions';
import { Suspense } from 'react';

export default async function TagsPage() {
  // Check authentication
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login?from=/tags');
  }

  // Fetch memories for the authenticated user
  const memories = await getMemories({ userId: session.user.id });

  return (
    <Suspense fallback={<div className="flex-1 p-8 text-foreground">Loading tags...</div>}>
      <TagsClient memories={memories} />
    </Suspense>
  );
}
