import { createMemory, getMemories } from '@/lib/actions/memory-actions';
import { CreateMemoryInput } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Optional: Validate auth token from extension
    // const authToken = request.headers.get('authorization');
    // if (!authToken || authToken !== process.env.EXTENSION_TOKEN) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: title and type' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['article', 'product', 'video', 'todo', 'note'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be one of: article, product, video, todo, note' },
        { status: 400 }
      );
    }

    const input: CreateMemoryInput = {
      title: body.title,
      type: body.type,
      url: body.url,
      content: body.content,
      metadata: body.metadata,
      source: body.source || 'extension',
      userId: body.user_id,
    };

    const result = await createMemory(input);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to create memory' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        id: result.id,
        message: 'Memory captured successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in /api/capture:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

    const memories = await getMemories({
      type,
      search,
      limit,
    });

    return NextResponse.json(
      {
        success: true,
        memories,
        count: memories.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/capture:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

