// backend/core/brain-cache.ts
// Redis caching layer for Brain Index
// Created by: Boris + Jean + GPT + Grok collaboration

import Redis from 'ioredis';
import { createHash } from 'crypto';
import { loadBrainIndex, searchInIndex, BrainIndex } from './indexer';

// Redis connection
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times: number) => Math.min(times * 50, 2000)
});

// Cache configuration
const CACHE_CONFIG = {
  INDEX_TTL: 3600,        // 1 hour for full index
  SEARCH_TTL: 600,        // 10 minutes for search results
  CHAPTER_TTL: 1800,      // 30 minutes for chapter data
  EMBEDDING_TTL: 7200,    // 2 hours for embeddings
  MAX_CACHE_SIZE: 100     // Maximum cached items
};

/**
 * Generate cache key from input
 */
function getCacheKey(prefix: string, input: string | object): string {
  const hash = createHash('md5')
    .update(typeof input === 'string' ? input : JSON.stringify(input))
    .digest('hex')
    .substring(0, 8);
  return `brain:${prefix}:${hash}`;
}

/**
 * Get Brain Index with caching
 */
export async function getCachedBrainIndex(
  indexPath?: string,
  forceRefresh: boolean = false
): Promise<BrainIndex> {
  const cacheKey = getCacheKey('index', indexPath || 'default');
  
  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log('📦 Brain Index loaded from cache');
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn('⚠️ Cache read failed:', error);
    }
  }
  
  // Load fresh index
  console.log('🔄 Loading fresh Brain Index...');
  const index = await loadBrainIndex(indexPath);
  
  // Cache the result
  try {
    await redis.setex(
      cacheKey,
      CACHE_CONFIG.INDEX_TTL,
      JSON.stringify(index)
    );
    console.log('💾 Brain Index cached');
  } catch (error) {
    console.warn('⚠️ Cache write failed:', error);
  }
  
  return index;
}

/**
 * Search with caching
 */
export async function cachedSearch(
  query: string,
  indexPath?: string
): Promise<string[]> {
  const cacheKey = getCacheKey('search', query);
  
  // Check cache
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`📦 Search results for "${query}" from cache`);
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn('⚠️ Search cache read failed:', error);
  }
  
  // Perform search
  const index = await getCachedBrainIndex(indexPath);
  const results = searchInIndex(index, query);
  
  // Cache results
  try {
    await redis.setex(
      cacheKey,
      CACHE_CONFIG.SEARCH_TTL,
      JSON.stringify(results)
    );
  } catch (error) {
    console.warn('⚠️ Search cache write failed:', error);
  }
  
  return results;
}

/**
 * Get chapter data with caching
 */
export async function getCachedChapter(
  chapterName: string,
  indexPath?: string
): Promise<any> {
  const cacheKey = getCacheKey('chapter', chapterName);
  
  // Check cache
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`📦 Chapter "${chapterName}" from cache`);
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn('⚠️ Chapter cache read failed:', error);
  }
  
  // Load chapter
  const index = await getCachedBrainIndex(indexPath);
  const chapter = index.tableOfContents[chapterName];
  
  if (!chapter) {
    throw new Error(`Chapter "${chapterName}" not found`);
  }
  
  // Cache chapter
  try {
    await redis.setex(
      cacheKey,
      CACHE_CONFIG.CHAPTER_TTL,
      JSON.stringify(chapter)
    );
  } catch (error) {
    console.warn('⚠️ Chapter cache write failed:', error);
  }
  
  return chapter;
}

/**
 * Cache embeddings for fast similarity search
 */
export async function cacheEmbedding(
  text: string,
  embedding: number[]
): Promise<void> {
  const cacheKey = getCacheKey('embedding', text);
  
  try {
    await redis.setex(
      cacheKey,
      CACHE_CONFIG.EMBEDDING_TTL,
      JSON.stringify(embedding)
    );
  } catch (error) {
    console.warn('⚠️ Embedding cache write failed:', error);
  }
}

/**
 * Get cached embedding
 */
export async function getCachedEmbedding(
  text: string
): Promise<number[] | null> {
  const cacheKey = getCacheKey('embedding', text);
  
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn('⚠️ Embedding cache read failed:', error);
  }
  
  return null;
}

/**
 * Invalidate cache for specific pattern
 */
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(`brain:${pattern}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`🗑️ Invalidated ${keys.length} cache entries`);
    }
  } catch (error) {
    console.warn('⚠️ Cache invalidation failed:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  size: number;
  keys: string[];
  memory: string;
}> {
  try {
    const keys = await redis.keys('brain:*');
    const info = await redis.info('memory');
    const memoryMatch = info.match(/used_memory_human:(\S+)/);
    
    return {
      size: keys.length,
      keys: keys.slice(0, 10), // First 10 keys
      memory: memoryMatch ? memoryMatch[1] : 'unknown'
    };
  } catch (error) {
    console.warn('⚠️ Failed to get cache stats:', error);
    return {
      size: 0,
      keys: [],
      memory: 'unknown'
    };
  }
}

/**
 * Warm up cache with frequently accessed data
 */
export async function warmUpCache(indexPath?: string): Promise<void> {
  console.log('🔥 Warming up Brain cache...');
  
  // Load main index
  await getCachedBrainIndex(indexPath);
  
  // Pre-cache active chapters
  const activeChapters = [
    'ISKRA Messenger',
    'Cerebellum Memory',
    'OffersPSP Project',
    'Autosaves'
  ];
  
  for (const chapter of activeChapters) {
    try {
      await getCachedChapter(chapter, indexPath);
    } catch (error) {
      console.warn(`⚠️ Failed to warm up chapter "${chapter}":`, error);
    }
  }
  
  console.log('✅ Cache warmed up');
}

/**
 * Monitor cache performance
 */
export async function monitorCache(): Promise<void> {
  const stats = await getCacheStats();
  console.log('📊 Cache Statistics:');
  console.log(`  - Total keys: ${stats.size}`);
  console.log(`  - Memory used: ${stats.memory}`);
  console.log(`  - Sample keys: ${stats.keys.slice(0, 3).join(', ')}...`);
}

/**
 * Clean up old cache entries
 */
export async function cleanupCache(): Promise<void> {
  try {
    const keys = await redis.keys('brain:*');
    let cleaned = 0;
    
    for (const key of keys) {
      const ttl = await redis.ttl(key);
      // Remove keys with no TTL (shouldn't happen)
      if (ttl === -1) {
        await redis.del(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} stale cache entries`);
    }
  } catch (error) {
    console.warn('⚠️ Cache cleanup failed:', error);
  }
}

// Auto cleanup every hour
setInterval(cleanupCache, 3600000);

// Monitor cache every 5 minutes in development
if (process.env.NODE_ENV === 'development') {
  setInterval(monitorCache, 300000);
}

// Export Redis instance for direct access if needed
export { redis };

// Export all functions
export default {
  getCachedBrainIndex,
  cachedSearch,
  getCachedChapter,
  cacheEmbedding,
  getCachedEmbedding,
  invalidateCache,
  getCacheStats,
  warmUpCache,
  monitorCache,
  cleanupCache
};