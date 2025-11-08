import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hybridSearch } from '@/lib/embeddings/vector-search';
import { getMemories } from '@/lib/actions/memory-actions';

// Helper function to add CORS headers
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    const body = await request.json();
    const { query, searchType = 'hybrid', limit = 20 } = body;

    if (!query || typeof query !== 'string') {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Query parameter is required' },
          { status: 400 }
        )
      );
    }

    // Get all user's memories from PostgreSQL
    const allMemories = await getMemories({ userId: session.user.id });

    let results;
    if (searchType === 'hybrid' || searchType === 'semantic') {
      // Perform hybrid search (vector + lexical)
      results = await hybridSearch(query, session.user.id, allMemories, limit);
    } else {
      // Fallback to simple lexical search
      const queryLower = query.toLowerCase();
      results = allMemories
        .filter(memory =>
          memory.title.toLowerCase().includes(queryLower) ||
          memory.content?.toLowerCase().includes(queryLower) ||
          memory.url?.toLowerCase().includes(queryLower)
        )
        .slice(0, limit);
    }

    return addCorsHeaders(
      NextResponse.json({
        success: true,
        query,
        results,
        count: results.length,
        searchType,
      })
    );
  } catch (error) {
    console.error('Error in semantic search:', error);
    return addCorsHeaders(
      NextResponse.json(
        { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    );
  }
}
