import { notFound, redirect } from 'next/navigation';
import { getMemoryById } from '@/lib/actions/memory-actions';
import ReaderViewClient from '@/components/ReaderViewClient';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export default async function ReaderPage({ params }: { params: { id: string } }) {
  // Check authentication
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login?from=/read/' + params.id);
  }

  // Fetch memory and verify ownership
  const memory = await getMemoryById(params.id, session.user.id);

  if (!memory) {
    notFound();
  }

  return <ReaderViewClient memory={memory} />;
}
