import { getMemories } from '@/lib/actions/memory-actions';
import { MemoryType } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Helper function to add CORS headers
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ));
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as MemoryType | 'all' | null;
    const search = searchParams.get('search');

    // Always filter by the authenticated user's ID
    const memories = await getMemories({
      userId: session.user.id,
      type: type || 'all',
      search: search || undefined,
    });

    if (!Array.isArray(memories)) {
      console.error('Unexpected response from getMemories:', memories);
      return addCorsHeaders(NextResponse.json(
        { error: 'Failed to fetch memories' },
        { status: 500 }
      ));
    }

    return addCorsHeaders(NextResponse.json({
      success: true,
      data: memories,
      count: memories.length,
    }));
  } catch (error) {
    console.error('Error in /api/memories:', error);
    return addCorsHeaders(NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ));
  }
}
