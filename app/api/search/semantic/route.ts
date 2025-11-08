import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hybridSearch, semanticSearch } from '@/lib/semantic-search';

// Helper function to add CORS headers
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
      return addCorsHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');
    const searchType = searchParams.get('type') || 'hybrid'; // 'semantic', 'hybrid', or 'keyword'

    if (!query) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 })
      );
    }

    let results;
    
    if (searchType === 'hybrid') {
      // Use hybrid search (semantic + keyword)
      results = await hybridSearch(query, session.user.id, limit);
    } else if (searchType === 'semantic') {
      // Use pure semantic search
      results = await semanticSearch(query, session.user.id, limit);
    } else {
      return addCorsHeaders(
        NextResponse.json({ error: 'Invalid search type' }, { status: 400 })
      );
    }

    return addCorsHeaders(
      NextResponse.json({
        success: true,
        results,
        count: results.length,
        searchType,
      })
    );
  } catch (error) {
    console.error('Error in semantic search API:', error);
    return addCorsHeaders(
      NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    );
  }
}
