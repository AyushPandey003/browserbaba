import { getMemories } from '@/lib/actions/memory-actions';
import { MemoryType } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as MemoryType | 'all' | null;
    const search = searchParams.get('search');

    const memories = await getMemories({
      type: type || 'all',
      search: search || undefined,
    });

    if (!Array.isArray(memories)) {
      console.error('Unexpected response from getMemories:', memories);
      return NextResponse.json(
        { error: 'Failed to fetch memories' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: memories,
      count: memories.length,
    });
  } catch (error) {
    console.error('Error in /api/memories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
