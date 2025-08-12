// backend/core/brain-embeddings.ts
// Embeddings integration for Brain Index
// RAG-lite system for semantic search
// Created by: Boris + Jean + GPT + Grok collaboration

import { OpenAI } from 'openai';
import { cosineSimilarity } from '../core/embeddings';
import { 
  getCachedBrainIndex, 
  cacheEmbedding, 
  getCachedEmbedding 
} from './brain-cache';

// OpenAI client for embeddings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Embedding configuration
const EMBEDDING_CONFIG = {
  model: 'text-embedding-3-small',
  dimensions: 1536,
  batch_size: 100,
  similarity_threshold: 0.7
};

/**
 * Generate embedding for text
 */
export async function generateEmbedding(
  text: string,
  useCache: boolean = true
): Promise<number[]> {
  // Check cache first
  if (useCache) {
    const cached = await getCachedEmbedding(text);
    if (cached) {
      console.log('📦 Using cached embedding');
      return cached;
    }
  }
  
  try {
    // Generate new embedding
    console.log('🧠 Generating embedding...');
    const response = await openai.embeddings.create({
      model: EMBEDDING_CONFIG.model,
      input: text
    });
    
    const embedding = response.data[0].embedding;
    
    // Cache the result
    if (useCache) {
      await cacheEmbedding(text, embedding);
    }
    
    return embedding;
  } catch (error) {
    console.error('❌ Failed to generate embedding:', error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function generateBatchEmbeddings(
  texts: string[]
): Promise<Map<string, number[]>> {
  const embeddings = new Map<string, number[]>();
  
  // Process in batches
  for (let i = 0; i < texts.length; i += EMBEDDING_CONFIG.batch_size) {
    const batch = texts.slice(i, i + EMBEDDING_CONFIG.batch_size);
    
    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_CONFIG.model,
        input: batch
      });
      
      // Map embeddings to texts
      batch.forEach((text, index) => {
        const embedding = response.data[index].embedding;
        embeddings.set(text, embedding);
        // Cache each embedding
        cacheEmbedding(text, embedding);
      });
      
    } catch (error) {
      console.error('❌ Batch embedding failed:', error);
    }
  }
  
  return embeddings;
}

/**
 * Enhanced chapter with embeddings
 */
interface ChapterWithEmbedding {
  name: string;
  files: string[];
  summary: string;
  embedding?: number[];
  tags: string[];
  relevance?: number;
}

/**
 * Add embeddings to Brain Index chapters
 */
export async function enrichIndexWithEmbeddings(): Promise<void> {
  console.log('🎯 Enriching Brain Index with embeddings...');
  
  const index = await getCachedBrainIndex();
  const enrichedChapters: ChapterWithEmbedding[] = [];
  
  for (const [chapterName, chapterData] of Object.entries(index.tableOfContents)) {
    // Generate embedding for chapter summary
    const embedding = await generateEmbedding(chapterData.summary);
    
    // Extract tags from files
    const tags = extractTags(chapterData.files);
    
    enrichedChapters.push({
      name: chapterName,
      files: chapterData.files,
      summary: chapterData.summary,
      embedding,
      tags
    });
  }
  
  console.log(`✅ Enriched ${enrichedChapters.length} chapters with embeddings`);
  
  // Cache the enriched index
  await cacheEmbedding('enriched-index', enrichedChapters);
}

/**
 * Extract tags from file names
 */
function extractTags(files: string[]): string[] {
  const tags = new Set<string>();
  
  for (const file of files) {
    // Extract meaningful parts from file names
    const parts = file.split(/[-_/.]/);
    parts.forEach(part => {
      if (part.length > 3 && !part.match(/^\d+$/)) {
        tags.add(part.toLowerCase());
      }
    });
  }
  
  return Array.from(tags);
}

/**
 * Semantic search using embeddings
 */
export async function semanticSearch(
  query: string,
  topK: number = 5
): Promise<{
  chapter: string;
  relevance: number;
  files: string[];
  reason: string;
}[]> {
  console.log(`🔍 Semantic search for: "${query}"`);
  
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  
  // Get enriched index
  const enrichedIndex = await getCachedEmbedding('enriched-index') as ChapterWithEmbedding[];
  
  if (!enrichedIndex) {
    // Fallback: enrich index first
    await enrichIndexWithEmbeddings();
    return semanticSearch(query, topK);
  }
  
  // Calculate similarities
  const results = enrichedIndex.map(chapter => {
    const similarity = chapter.embedding 
      ? cosineSimilarity(queryEmbedding, chapter.embedding)
      : 0;
    
    return {
      chapter: chapter.name,
      relevance: similarity,
      files: chapter.files.slice(0, 3), // Top 3 files
      reason: generateReason(query, chapter, similarity)
    };
  });
  
  // Sort by relevance and return top K
  results.sort((a, b) => b.relevance - a.relevance);
  
  const topResults = results.slice(0, topK);
  console.log(`📊 Top ${topK} results:`, topResults.map(r => 
    `${r.chapter} (${(r.relevance * 100).toFixed(1)}%)`
  ));
  
  return topResults;
}

/**
 * Generate human-readable reason for match
 */
function generateReason(
  query: string,
  chapter: ChapterWithEmbedding,
  similarity: number
): string {
  if (similarity > 0.9) {
    return `Perfect match for "${query}" in ${chapter.name}`;
  } else if (similarity > 0.8) {
    return `Strong relevance to ${chapter.name} content`;
  } else if (similarity > 0.7) {
    return `Related concepts found in ${chapter.name}`;
  } else if (similarity > 0.6) {
    return `Possible connection with ${chapter.name}`;
  } else {
    return `Weak match - checking tags: ${chapter.tags.slice(0, 3).join(', ')}`;
  }
}

/**
 * Find similar chapters to given text
 */
export async function findSimilarChapters(
  text: string,
  excludeChapter?: string
): Promise<string[]> {
  const results = await semanticSearch(text, 10);
  
  return results
    .filter(r => r.chapter !== excludeChapter && r.relevance > EMBEDDING_CONFIG.similarity_threshold)
    .map(r => r.chapter);
}

/**
 * Smart context loading based on semantic relevance
 */
export async function loadSemanticContext(
  query: string,
  maxFiles: number = 10
): Promise<{
  files: string[];
  chapters: string[];
  relevance: number;
}> {
  // Get semantic matches
  const searchResults = await semanticSearch(query, 3);
  
  // Collect files from top chapters
  const files: string[] = [];
  const chapters: string[] = [];
  let totalRelevance = 0;
  
  for (const result of searchResults) {
    if (result.relevance > EMBEDDING_CONFIG.similarity_threshold) {
      files.push(...result.files);
      chapters.push(result.chapter);
      totalRelevance += result.relevance;
    }
  }
  
  // Limit files
  const uniqueFiles = [...new Set(files)].slice(0, maxFiles);
  
  console.log(`📚 Loading ${uniqueFiles.length} files from ${chapters.length} chapters`);
  
  return {
    files: uniqueFiles,
    chapters,
    relevance: totalRelevance / searchResults.length
  };
}

/**
 * Update chapter embedding when content changes
 */
export async function updateChapterEmbedding(
  chapterName: string,
  newSummary?: string
): Promise<void> {
  const index = await getCachedBrainIndex();
  const chapter = index.tableOfContents[chapterName];
  
  if (!chapter) {
    throw new Error(`Chapter "${chapterName}" not found`);
  }
  
  // Use new summary or existing
  const summary = newSummary || chapter.summary;
  
  // Generate new embedding
  const embedding = await generateEmbedding(summary, false); // Don't use cache
  
  // Update cache
  await cacheEmbedding(`chapter:${chapterName}`, embedding);
  
  console.log(`✅ Updated embedding for chapter "${chapterName}"`);
}

/**
 * Privacy-aware search (GPT's idea)
 */
export async function privacyAwareSearch(
  query: string,
  userPrivacyLevel: 'public' | 'private' | 'intimate' = 'public'
): Promise<any[]> {
  const results = await semanticSearch(query);
  
  // Filter based on privacy
  const privacyFilter = {
    'public': ['OffersPSP Project', 'ISKRA Messenger'],
    'private': ['Cerebellum Memory', 'Autosaves'],
    'intimate': ['Emotional DNA', 'Relationships']
  };
  
  const allowedChapters = [
    ...privacyFilter['public'],
    ...(userPrivacyLevel !== 'public' ? privacyFilter['private'] : []),
    ...(userPrivacyLevel === 'intimate' ? privacyFilter['intimate'] : [])
  ];
  
  return results.filter(r => allowedChapters.includes(r.chapter));
}

// Export all functions
export default {
  generateEmbedding,
  generateBatchEmbeddings,
  enrichIndexWithEmbeddings,
  semanticSearch,
  findSimilarChapters,
  loadSemanticContext,
  updateChapterEmbedding,
  privacyAwareSearch
};