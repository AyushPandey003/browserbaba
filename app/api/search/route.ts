import { NextRequest, NextResponse } from 'next/server';
import { getMemories } from '@/lib/actions/memory-actions';

export const runtime = 'edge'; // Enable Vercel Edge Runtime for fast responses

/**
 * POST /api/search - Search memories with filters
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, filters, limit = 10 } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    // Perform simple text search
    const results = await getMemories({
      search: query,
      type: filters?.type,
      limit,
    });

    return NextResponse.json({
      mode: 'search',
      query,
      results: results.map((memory) => ({
        memory,
        score: 1.0,
        reason: 'Text match'
      })),
      count: results.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { 
        error: 'Search failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/search - Quick search (query params)
 * 
 * Example: /api/search?q=AI+agents&type=article&limit=5
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    const results = await getMemories({
      search: query,
      type: type || undefined,
      limit,
    });

    return NextResponse.json({
      mode: 'search',
      query,
      results: results.map((memory) => ({
        memory,
        score: 1.0,
        reason: 'Text match'
      })),
      count: results.length,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
