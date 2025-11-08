'use server';

import { db } from '@/lib/db';
import { memories, links } from '@/lib/db/schema';
import { eq, desc, and, like, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import type { Memory, NewMemory, MemoryType, MemoryLink } from '@/lib/types';
import type { Memory as DbMemory } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// Helper function to transform database record to Memory type
async function transformToMemory(dbRecord: DbMemory, includeLinks = false): Promise<Memory> {
  // Fetch links if requested
  let memoryLinks: MemoryLink[] = [];
  if (includeLinks) {
    const dbLinks = await db
      .select()
      .from(links)
      .where(eq(links.memoryId, dbRecord.id));
    memoryLinks = dbLinks.map(link => ({
      id: link.id,
      text: link.text || undefined,
      href: link.href,
      linkTitle: link.linkTitle || undefined,
    }));
  }

  return {
    id: dbRecord.id,
    userId: dbRecord.userId || null,
    type: dbRecord.contentType as MemoryType,
    title: dbRecord.title,
    content: dbRecord.content || dbRecord.selectedText || null,
    selectedText: dbRecord.selectedText || null,
    url: dbRecord.url,
    metadata: {
      thumbnail: dbRecord.thumbnailUrl || undefined,
      source: dbRecord.videoPlatform || undefined,
      tags: dbRecord.tags ? dbRecord.tags.split(',').map((t: string) => t.trim()) : [],
      duration: dbRecord.formattedTimestamp || undefined,
      // Video-specific
      videoPlatform: dbRecord.videoPlatform || undefined,
      videoTimestamp: dbRecord.videoTimestamp ? Number(dbRecord.videoTimestamp) : undefined,
      videoDuration: dbRecord.videoDuration ? Number(dbRecord.videoDuration) : undefined,
      videoTitle: dbRecord.videoTitle || undefined,
      videoUrl: dbRecord.videoUrl || undefined,
      formattedTimestamp: dbRecord.formattedTimestamp || undefined,
      // Context fields
      contextBefore: dbRecord.contextBefore || undefined,
      contextAfter: dbRecord.contextAfter || undefined,
      fullContext: dbRecord.fullContext || undefined,
      elementType: dbRecord.elementType || undefined,
      pageSection: dbRecord.pageSection || undefined,
      xpath: dbRecord.xpath || undefined,
      notes: dbRecord.notes || undefined,
    },
    source: dbRecord.videoPlatform || null,
    links: includeLinks ? memoryLinks : undefined,
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

    return Promise.all(result.map(r => transformToMemory(r, false)));
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

    return result[0] ? await transformToMemory(result[0], true) : null;
  } catch (error) {
    console.error('Error fetching memory:', error);
    return null;
  }
}

interface ExtendedMemoryData extends NewMemory {
  links?: MemoryLink[];
  selectedText?: string;
  contextBefore?: string;
  contextAfter?: string;
  fullContext?: string;
  elementType?: string;
  pageSection?: string;
  xpath?: string;
  notes?: string;
}

export async function createMemory(data: ExtendedMemoryData): Promise<Memory> {
  try {
    // Transform NewMemory to database format with all fields
    const dbData = {
      userId: data.userId || null,
      title: data.title,
      contentType: data.type,
      content: data.content || null,
      selectedText: data.selectedText || null,
      url: data.url || null,
      tags: data.metadata?.tags?.join(',') || null,
      thumbnailUrl: data.metadata?.thumbnail || null,
      videoPlatform: data.metadata?.videoPlatform || data.source || null,
      // Video-specific fields (use number to match DB typings)
      videoTimestamp: data.metadata?.videoTimestamp ? Number(data.metadata.videoTimestamp) : null,
      videoDuration: data.metadata?.videoDuration ? Number(data.metadata.videoDuration) : null,
      videoTitle: data.metadata?.videoTitle || null,
      videoUrl: data.metadata?.videoUrl || null,
      formattedTimestamp: data.metadata?.formattedTimestamp || null,
      // Context fields
      contextBefore: data.metadata?.contextBefore || data.contextBefore || null,
      contextAfter: data.metadata?.contextAfter || data.contextAfter || null,
      fullContext: data.metadata?.fullContext || data.fullContext || null,
      elementType: data.metadata?.elementType || data.elementType || null,
      pageSection: data.metadata?.pageSection || data.pageSection || null,
      xpath: data.metadata?.xpath || data.xpath || null,
      notes: data.metadata?.notes || data.notes || null,
    };

    const result = await db
      .insert(memories)
      .values(dbData)
      .returning();

    const memory = result[0];

    // Save links if provided
    if (data.links && data.links.length > 0) {
      const linksToInsert = data.links.map(link => ({
        memoryId: memory.id,
        text: link.text || null,
        href: link.href,
        linkTitle: link.linkTitle || null,
      }));

      await db.insert(links).values(linksToInsert);
    }

    revalidatePath('/dashboard');
    revalidatePath('/search');
    return await transformToMemory(memory, true);
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

export async function updateMemoryContent(
  id: string,
  updates: {
    content?: string;
    links?: MemoryLink[];
  }
): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error('Unauthorized');
    }

    // Update memory content
    if (updates.content !== undefined) {
      await db
        .update(memories)
        .set({ 
          content: updates.content,
          updatedAt: new Date(),
        })
        .where(and(
          eq(memories.id, id),
          eq(memories.userId, session.user.id)
        ));
    }

    // Update links if provided
    if (updates.links) {
      // Delete existing links
      await db.delete(links).where(eq(links.memoryId, id));
      
      // Insert new links
      if (updates.links.length > 0) {
        const linksToInsert = updates.links.map(link => ({
          memoryId: id,
          text: link.text || null,
          href: link.href,
          linkTitle: link.linkTitle || null,
        }));
        await db.insert(links).values(linksToInsert);
      }
    }

    revalidatePath('/dashboard');
    revalidatePath('/search');
    revalidatePath(`/read/${id}`);
  } catch (error) {
    console.error('Error updating memory:', error);
    throw new Error('Failed to update memory');
  }
}
