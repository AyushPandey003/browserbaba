import { createMemory, getMemories } from '@/lib/actions/memory-actions';
import { CreateMemoryInput } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateMemoryEmbedding } from '@/lib/embeddings/service';
import { storeMemoryEmbedding } from '@/lib/embeddings/vector-search';

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

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      ));
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.type) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Missing required fields: title and type' },
        { status: 400 }
      ));
    }

    // Validate type
    const validTypes = ['article', 'product', 'video', 'todo', 'note'];
    if (!validTypes.includes(body.type)) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Invalid type. Must be one of: article, product, video, todo, note' },
        { status: 400 }
      ));
    }

    const input: CreateMemoryInput = {
      title: body.title,
      type: body.type,
      url: body.url,
      content: body.content,
      metadata: body.metadata,
      source: body.source || 'extension',
      userId: session.user.id, // Always use the authenticated user's ID
    };

    const result = await createMemory(input);

    if (!result) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Failed to create memory' },
        { status: 500 }
      ));
    }

    // Generate and store embedding asynchronously (don't block the response)
    (async () => {
      try {
        const embedding = await generateMemoryEmbedding({
          title: result.title,
          content: result.content,
          url: result.url
        });
        
        await storeMemoryEmbedding(
          result.id, // memoryId
          session.user.id, // userId
          result.title,
          result.content || '',
          result.url,
          result.metadata?.tags || [],
          embedding
        );
        
        console.log(`✅ Embedding stored for memory ${result.id}`);
      } catch (embeddingError) {
        console.error('Error storing embedding:', embeddingError);
        // Don't fail the request if embedding fails
      }
    })();

    return addCorsHeaders(NextResponse.json(
      {
        success: true,
        id: result.id,
        message: 'Memory captured successfully',
      },
      { status: 201 }
    ));
  } catch (error) {
    console.error('Error in /api/capture:', error);
    return addCorsHeaders(NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ));
  }
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

    // Always filter by the authenticated user's ID
    const memories = await getMemories({
      type,
      search,
      limit,
      userId: session.user.id,
    });

    return addCorsHeaders(NextResponse.json(
      {
        success: true,
        memories,
        count: memories.length,
      },
      { status: 200 }
    ));
  } catch (error) {
    console.error('Error in GET /api/capture:', error);
    return addCorsHeaders(NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ));
  }
}

