import { notFound } from 'next/navigation';
import { getMemoryById } from '@/lib/actions/memory-actions';
import ReaderViewClient from '@/components/ReaderViewClient';

export default async function ReaderPage({ params }: { params: { id: string } }) {
  const memory = await getMemoryById(params.id);

  if (!memory) {
    notFound();
  }

  return <ReaderViewClient memory={memory} />;
}
