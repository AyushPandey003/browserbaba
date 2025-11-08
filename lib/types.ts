export type MemoryType = 'article' | 'product' | 'video' | 'todo' | 'note';

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  createdAt?: Date;
}

export interface MemoryMetadata {
  thumbnail?: string;
  source?: string;
  price?: string;
  duration?: string;
  tags?: string[];
  author?: string;
  publishedDate?: string;
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface Memory {
  id: string;
  userId: string | null;
  type: MemoryType;
  title: string;
  content: string | null;
  url: string | null;
  metadata: MemoryMetadata | null;
  source: string | null;
  createdAt: Date;
}

export interface NewMemory {
  userId?: string | null;
  type: MemoryType;
  title: string;
  content?: string | null;
  url?: string | null;
  metadata?: MemoryMetadata | null;
  source?: string | null;
}

export interface CreateMemoryInput {
  title: string;
  url?: string;
  type: MemoryType;
  metadata?: MemoryMetadata;
  content?: string;
  source?: string;
  userId?: string;
}

export interface MemoryFilters {
  type?: MemoryType | 'all';
  search?: string;
}
