'use server';

import { db } from '@/lib/db';
import { memories } from '@/lib/db/schema';
import { eq, desc, and, like, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import type { Memory, NewMemory } from '@/lib/types';

type MemoryType = 'article' | 'video' | 'product' | 'note' | 'todo';

export async function getMemories(filters?: {
  type?: string;
  search?: string;
  limit?: number;
}): Promise<Memory[]> {
  try {
    const conditions = [];

    if (filters?.type && filters.type !== 'all') {
      conditions.push(eq(memories.type, filters.type as MemoryType));
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

    return result as Memory[];
  } catch (error) {
    console.error('Error fetching memories:', error);
    return [];
  }
}

export async function getMemoryById(id: string): Promise<Memory | null> {
  try {
    const result = await db
      .select()
      .from(memories)
      .where(eq(memories.id, id))
      .limit(1);

    return result[0] as Memory || null;
  } catch (error) {
    console.error('Error fetching memory:', error);
    return null;
  }
}

export async function createMemory(data: NewMemory): Promise<Memory> {
  try {
    // Insert memory
    const result = await db
      .insert(memories)
      .values(data)
      .returning();

    revalidatePath('/dashboard');
    revalidatePath('/search');
    return result[0] as Memory;
  } catch (error) {
    console.error('Error creating memory:', error);
    throw new Error('Failed to create memory');
  }
}

export async function deleteMemory(id: string): Promise<void> {
  try {
    await db
      .delete(memories)
      .where(eq(memories.id, id));

    revalidatePath('/dashboard');
    revalidatePath('/search');
  } catch (error) {
    console.error('Error deleting memory:', error);
    throw new Error('Failed to delete memory');
  }
}

export async function toggleArchiveMemory(_id: string): Promise<void> {
  try {
    // Since we don't have an archived field yet, this is a placeholder
    revalidatePath('/dashboard');
  } catch (error) {
    console.error('Error archiving memory:', error);
    throw new Error('Failed to archive memory');
  }
}
