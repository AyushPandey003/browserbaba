'use server';

import { db } from '@/lib/db';
import { memories } from '@/lib/db/schema';
import { eq, desc, and, like, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import type { Memory, NewMemory, MemoryType } from '@/lib/types';
import type { Memory as DbMemory } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// Helper function to transform database record to Memory type
function transformToMemory(dbRecord: DbMemory): Memory {
  return {
    id: dbRecord.id,
    userId: dbRecord.userId || null, // Include userId from database
    type: dbRecord.contentType as MemoryType,
    title: dbRecord.title,
    content: dbRecord.content || dbRecord.selectedText || null,
    url: dbRecord.url,
    metadata: {
      thumbnail: dbRecord.thumbnailUrl || undefined,
      source: dbRecord.videoPlatform || undefined,
      tags: dbRecord.tags ? dbRecord.tags.split(',').map((t: string) => t.trim()) : [],
      duration: dbRecord.formattedTimestamp || undefined,
    },
    source: dbRecord.videoPlatform || null,
    createdAt: dbRecord.createdAt,
  };
}

export async function getMemories(filters?: {
  type?: string;
  search?: string;
  limit?: number;
  userId?: string;
}): Promise<Memory[]> {
  try {
    const conditions = [];

    if (filters?.userId) {
      conditions.push(eq(memories.userId, filters.userId));
    }

    if (filters?.type && filters.type !== 'all') {
      conditions.push(eq(memories.contentType, filters.type));
    }

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(memories.title, searchTerm),
          like(memories.content, searchTerm)
        )
      );
    }

    let result = await db
      .select()
      .from(memories)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(memories.createdAt));

    if (filters?.limit) {
      result = result.slice(0, filters.limit);
    }

    return result.map(transformToMemory);
  } catch (error) {
    console.error('Error fetching memories:', error);
    return [];
  }
}

export async function getMemoryById(id: string, userId?: string): Promise<Memory | null> {
  try {
    const conditions = [eq(memories.id, id)];
    
    // If userId is provided, ensure the memory belongs to that user
    if (userId) {
      conditions.push(eq(memories.userId, userId));
    }

    const result = await db
      .select()
      .from(memories)
      .where(and(...conditions))
      .limit(1);

    return result[0] ? transformToMemory(result[0]) : null;
  } catch (error) {
    console.error('Error fetching memory:', error);
    return null;
  }
}

export async function createMemory(data: NewMemory): Promise<Memory> {
  try {
    // Transform NewMemory to database format
    const dbData = {
      userId: data.userId || null, // Include userId
      title: data.title,
      contentType: data.type,
      content: data.content,
      url: data.url,
      tags: data.metadata?.tags?.join(',') || null,
      thumbnailUrl: data.metadata?.thumbnail || null,
      videoPlatform: data.source || null,
    };

    const result = await db
      .insert(memories)
      .values(dbData)
      .returning();

    const memory = result[0];

    // Embeddings are now generated in the API route (capture/route.ts)
    // to avoid server/client boundary issues

    revalidatePath('/dashboard');
    revalidatePath('/search');
    return transformToMemory(memory);
  } catch (error) {
    console.error('Error creating memory:', error);
    throw new Error('Failed to create memory');
  }
}

export async function deleteMemory(id: string): Promise<void> {
  try {
    // Get the authenticated user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error('Unauthorized');
    }

    // Delete only if the memory belongs to the authenticated user
    const result = await db
      .delete(memories)
      .where(and(
        eq(memories.id, id),
        eq(memories.userId, session.user.id)
      ))
      .returning();

    if (result.length === 0) {
      throw new Error('Memory not found or unauthorized');
    }

    revalidatePath('/dashboard');
    revalidatePath('/search');
  } catch (error) {
    console.error('Error deleting memory:', error);
    throw new Error('Failed to delete memory');
  }
}

export async function toggleArchiveMemory(id: string): Promise<void> {
  try {
    // Since we don't have an archived field yet, this is a placeholder
    console.log('Archive functionality not implemented yet for memory:', id);
    revalidatePath('/dashboard');
  } catch (error) {
    console.error('Error archiving memory:', error);
    throw new Error('Failed to archive memory');
  }
}
