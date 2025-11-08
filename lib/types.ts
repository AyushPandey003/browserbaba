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
  // Video-specific
  videoPlatform?: string;
  videoTimestamp?: number;
  videoDuration?: number;
  videoTitle?: string;
  videoUrl?: string;
  formattedTimestamp?: string;
  // Context fields
  contextBefore?: string;
  contextAfter?: string;
  fullContext?: string;
  elementType?: string;
  pageSection?: string;
  xpath?: string;
  notes?: string;
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface MemoryLink {
  id?: string;
  text?: string;
  href: string;
  linkTitle?: string;
}

export interface Memory {
  id: string;
  userId: string | null;
  type: MemoryType;
  title: string;
  content: string | null;
  selectedText?: string | null;
  url: string | null;
  metadata: MemoryMetadata | null;
  source: string | null;
  links?: MemoryLink[];
  createdAt: Date;
  
  // Enhanced fields from schema
  domain?: string | null;
  favicon?: string | null;
  author?: string | null;
  publishedDate?: Date | null;
  description?: string | null;
  mainImage?: string | null;
  images?: string | null; // JSON string
  headings?: string | null; // JSON string
  keywords?: string | null;
  price?: string | null;
  currency?: string | null;
  availability?: string | null;
  rating?: string | null;
  brand?: string | null;
  readingTime?: string | null;
  wordCount?: number | null;
  language?: string | null;
  collection?: string | null;
  priority?: string | null;
  status?: string | null;
  category?: string | null;
  subcategory?: string | null;
  
  // Video fields
  videoPlatform?: string | null;
  videoTimestamp?: number | null;
  videoDuration?: number | null;
  videoTitle?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  formattedTimestamp?: string | null;
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
  selectedText?: string;
  contextBefore?: string;
  contextAfter?: string;
  fullContext?: string;
  elementType?: string;
  pageSection?: string;
  xpath?: string;
  notes?: string;
  links?: MemoryLink[];
  source?: string;
  userId?: string;
}

export interface MemoryFilters {
  type?: MemoryType | 'all';
  search?: string;
}
