// EMBEDDINGS ENGINE
// Semantic clustering, sentiment analysis, and entity extraction
// Created by: Jean Claude + GPT collaboration
// Purpose: Power the Diamond compression with AI intelligence

import { Configuration, OpenAIApi } from 'openai';
import { Entity, Event } from './diamond';

// Configuration
const EMBEDDING_MODEL = 'text-embedding-3-small';
const SENTIMENT_THRESHOLD = { positive: 0.3, negative: -0.3 };
const CLUSTER_MIN_SIZE = 3;
const ENTITY_TYPES = ['person', 'place', 'organization', 'event', 'concept'] as const;

// Interfaces
export interface ClusterOptions {
  similarity: number;
  minSize?: number;
  maxSize?: number;
}

export interface SentimentResult {
  score: number; // -1 to 1
  magnitude: number; // 0 to 1
  label: 'positive' | 'negative' | 'neutral';
}

export interface EntityExtractionResult extends Entity {
  confidence: number;
  context: string;
}

/**
 * EMBEDDINGS ENGINE - Core AI intelligence for memory system
 * Handles clustering, sentiment, and entity extraction
 */
export class EmbeddingsEngine {
  private openai: OpenAIApi;
  private embeddingCache: Map<string, number[]>;
  
  constructor(apiKey: string) {
    const configuration = new Configuration({ apiKey });
    this.openai = new OpenAIApi(configuration);
    this.embeddingCache = new Map();
  }

  /**
   * Cluster events by semantic similarity
   * Uses cosine similarity on embeddings
   */
  async cluster(events: Event[], options: ClusterOptions): Promise<Event[][]> {
    console.log(`🧠 Clustering ${events.length} events with similarity ${options.similarity}`);
    
    // Generate embeddings for all events
    const embeddings = await this.generateBatchEmbeddings(
      events.map(e => e.text || '')
    );
    
    // Initialize clusters
    const clusters: Event[][] = [];
    const assigned = new Set<number>();
    
    // Greedy clustering algorithm
    for (let i = 0; i < events.length; i++) {
      if (assigned.has(i)) continue;
      
      const cluster: Event[] = [events[i]];
      assigned.add(i);
      
      // Find similar events
      for (let j = i + 1; j < events.length; j++) {
        if (assigned.has(j)) continue;
        
        const similarity = this.cosineSimilarity(embeddings[i], embeddings[j]);
        
        if (similarity >= options.similarity) {
          cluster.push(events[j]);
          assigned.add(j);
          
          // Respect max cluster size
          if (options.maxSize && cluster.length >= options.maxSize) {
            break;
          }
        }
      }
      
      // Only keep clusters above minimum size
      if (cluster.length >= (options.minSize || CLUSTER_MIN_SIZE)) {
        clusters.push(cluster);
      } else {
        // Return small clusters to unassigned pool
        cluster.forEach((_, idx) => {
          if (idx > 0) assigned.delete(i + idx);
        });
      }
    }
    
    // Handle remaining unclustered events
    const unclustered: Event[] = [];
    events.forEach((event, idx) => {
      if (!assigned.has(idx)) {
        unclustered.push(event);
      }
    });
    
    if (unclustered.length > 0) {
      // Create a "misc" cluster for unclustered events
      clusters.push(unclustered);
    }
    
    console.log(`✅ Created ${clusters.length} clusters`);
    return clusters;
  }

  /**
   * Extract entities from text using NLP
   * Identifies people, places, organizations, etc.
   */
  extractEntities(text: string): EntityExtractionResult[] {
    const entities: EntityExtractionResult[] = [];
    
    // Person detection (simple regex for MVP, use NER model in production)
    const personPatterns = [
      /(?:Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.) [A-Z][a-z]+ [A-Z][a-z]+/g,
      /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // Two capitalized words
      /\b(?:Boris|Jean|Claude|Aria|Žan|Sarah)\b/gi, // Known names
    ];
    
    personPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Avoid duplicates
          if (!entities.find(e => e.name === match)) {
            entities.push({
              name: match,
              type: 'person',
              mentions: 1,
              sentiment_avg: this.detectSentiment(text),
              confidence: 0.8,
              context: this.extractContext(text, match)
            });
          }
        });
      }
    });
    
    // Place detection
    const placePatterns = [
      /\b(?:Cyprus|Ukraine|Kyiv|Kiev|Nicosia|Park|Office|Home|Cafe)\b/gi,
      /\b(?:at|in|near|from) ([A-Z][a-z]+)\b/g,
    ];
    
    placePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const placeName = match.replace(/^(at|in|near|from) /, '');
          if (!entities.find(e => e.name === placeName)) {
            entities.push({
              name: placeName,
              type: 'place',
              mentions: 1,
              sentiment_avg: 0,
              confidence: 0.7,
              context: this.extractContext(text, placeName)
            });
          }
        });
      }
    });
    
    // Concept/Topic detection (important keywords)
    const conceptPatterns = [
      /\b(?:AI|memory|cerebellum|diamond|compression|messenger|companion)\b/gi,
      /\b(?:meeting|project|deadline|launch|release)\b/gi,
    ];
    
    conceptPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          if (!entities.find(e => e.name === match.toLowerCase())) {
            entities.push({
              name: match.toLowerCase(),
              type: 'concept',
              mentions: 1,
              sentiment_avg: this.detectSentiment(text),
              confidence: 0.6,
              context: this.extractContext(text, match)
            });
          }
        });
      }
    });
    
    return entities;
  }

  /**
   * Detect sentiment in text
   * Returns normalized score from -1 (negative) to 1 (positive)
   */
  detectSentiment(text: string): number {
    // Positive indicators
    const positiveWords = [
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
      'happy', 'joy', 'love', 'excited', 'благодарю', 'круто', 'красава',
      'гениально', 'успех', 'победа', '🔥', '💪', '⚡', '🚀', '❤️', '😊'
    ];
    
    // Negative indicators
    const negativeWords = [
      'bad', 'terrible', 'awful', 'horrible', 'sad', 'angry', 'frustrated',
      'disappointed', 'failed', 'problem', 'issue', 'плохо', 'проблема',
      'ошибка', 'фигулина', 'срака', '😢', '😡', '😞', '💔', '❌'
    ];
    
    // Intensifiers
    const intensifiers = ['very', 'extremely', 'really', 'absolutely', 'очень', 'максимально'];
    
    const lowerText = text.toLowerCase();
    let score = 0;
    let wordCount = 0;
    
    // Count positive words
    positiveWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        let weight = 1;
        // Check for intensifiers
        intensifiers.forEach(intensifier => {
          if (lowerText.includes(`${intensifier} ${word}`)) {
            weight = 1.5;
          }
        });
        score += matches.length * weight;
        wordCount += matches.length;
      }
    });
    
    // Count negative words
    negativeWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        let weight = -1;
        // Check for intensifiers
        intensifiers.forEach(intensifier => {
          if (lowerText.includes(`${intensifier} ${word}`)) {
            weight = -1.5;
          }
        });
        score += matches.length * weight;
        wordCount += matches.length;
      }
    });
    
    // Normalize score
    if (wordCount === 0) return 0;
    
    const normalized = Math.max(-1, Math.min(1, score / wordCount));
    return normalized;
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Check cache first
    const cacheKey = this.hashText(text);
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey)!;
    }
    
    try {
      const response = await this.openai.createEmbedding({
        model: EMBEDDING_MODEL,
        input: text,
      });
      
      const embedding = response.data.data[0].embedding;
      
      // Cache the result
      this.embeddingCache.set(cacheKey, embedding);
      
      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      // Return random embedding as fallback (for testing)
      return this.generateRandomEmbedding();
    }
  }

  /**
   * Generate embeddings for multiple texts efficiently
   */
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    // OpenAI allows batch embedding requests
    const uncachedTexts: string[] = [];
    const uncachedIndices: number[] = [];
    const results: number[][] = new Array(texts.length);
    
    // Check cache for each text
    texts.forEach((text, idx) => {
      const cacheKey = this.hashText(text);
      if (this.embeddingCache.has(cacheKey)) {
        results[idx] = this.embeddingCache.get(cacheKey)!;
      } else {
        uncachedTexts.push(text);
        uncachedIndices.push(idx);
      }
    });
    
    // Batch process uncached texts
    if (uncachedTexts.length > 0) {
      try {
        // OpenAI supports up to 2048 inputs per request
        const batchSize = 100;
        for (let i = 0; i < uncachedTexts.length; i += batchSize) {
          const batch = uncachedTexts.slice(i, i + batchSize);
          const response = await this.openai.createEmbedding({
            model: EMBEDDING_MODEL,
            input: batch,
          });
          
          response.data.data.forEach((item, batchIdx) => {
            const originalIdx = uncachedIndices[i + batchIdx];
            const embedding = item.embedding;
            results[originalIdx] = embedding;
            
            // Cache the result
            const cacheKey = this.hashText(batch[batchIdx]);
            this.embeddingCache.set(cacheKey, embedding);
          });
        }
      } catch (error) {
        console.error('Error generating batch embeddings:', error);
        // Fallback to random embeddings for testing
        uncachedIndices.forEach(idx => {
          results[idx] = this.generateRandomEmbedding();
        });
      }
    }
    
    return results;
  }

  /**
   * Calculate semantic similarity between two texts
   */
  async calculateSimilarity(text1: string, text2: string): Promise<number> {
    const [embedding1, embedding2] = await Promise.all([
      this.generateEmbedding(text1),
      this.generateEmbedding(text2)
    ]);
    
    return this.cosineSimilarity(embedding1, embedding2);
  }

  /**
   * Analyze emotion in text
   * Returns emotion scores for different categories
   */
  async analyzeEmotion(text: string): Promise<Record<string, number>> {
    const emotions: Record<string, number> = {
      joy: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      surprise: 0,
      love: 0,
      excitement: 0,
      calm: 0,
    };
    
    // Emotion indicators (simplified for MVP)
    const emotionPatterns = {
      joy: /\b(happy|joy|glad|pleased|delighted|😊|😄|🎉)\b/gi,
      sadness: /\b(sad|unhappy|depressed|down|😢|😞|💔)\b/gi,
      anger: /\b(angry|mad|furious|annoyed|pissed|😡|🤬)\b/gi,
      fear: /\b(afraid|scared|worried|anxious|nervous|😰|😨)\b/gi,
      surprise: /\b(surprised|amazed|shocked|wow|😲|🤯|😱)\b/gi,
      love: /\b(love|adore|care|affection|❤️|💕|😍)\b/gi,
      excitement: /\b(excited|thrilled|pumped|eager|🔥|🚀|⚡)\b/gi,
      calm: /\b(calm|peaceful|relaxed|serene|tranquil|😌|🧘)\b/gi,
    };
    
    const lowerText = text.toLowerCase();
    let totalMatches = 0;
    
    Object.entries(emotionPatterns).forEach(([emotion, pattern]) => {
      const matches = lowerText.match(pattern);
      if (matches) {
        emotions[emotion] = matches.length;
        totalMatches += matches.length;
      }
    });
    
    // Normalize scores
    if (totalMatches > 0) {
      Object.keys(emotions).forEach(emotion => {
        emotions[emotion] = emotions[emotion] / totalMatches;
      });
    } else {
      // Default to calm if no emotions detected
      emotions.calm = 0.5;
    }
    
    return emotions;
  }

  // Helper methods

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have same length');
    }
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    
    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);
    
    if (norm1 === 0 || norm2 === 0) return 0;
    
    return dotProduct / (norm1 * norm2);
  }

  /**
   * Extract context around a match in text
   */
  private extractContext(text: string, match: string, windowSize: number = 50): string {
    const index = text.toLowerCase().indexOf(match.toLowerCase());
    if (index === -1) return '';
    
    const start = Math.max(0, index - windowSize);
    const end = Math.min(text.length, index + match.length + windowSize);
    
    let context = text.substring(start, end);
    
    // Add ellipsis if truncated
    if (start > 0) context = '...' + context;
    if (end < text.length) context = context + '...';
    
    return context;
  }

  /**
   * Simple hash function for caching
   */
  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  /**
   * Generate random embedding for testing
   */
  private generateRandomEmbedding(dimensions: number = 1536): number[] {
    const embedding: number[] = [];
    for (let i = 0; i < dimensions; i++) {
      embedding.push(Math.random() * 2 - 1); // Random between -1 and 1
    }
    
    // Normalize the vector
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / norm);
  }

  /**
   * Clear embedding cache (for memory management)
   */
  clearCache(): void {
    this.embeddingCache.clear();
    console.log('🧹 Embedding cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; memoryUsage: number } {
    const size = this.embeddingCache.size;
    // Each embedding is ~1536 floats * 4 bytes = ~6KB
    const memoryUsage = size * 1536 * 4;
    
    return { size, memoryUsage };
  }
}

// Singleton instance
let embeddingsEngine: EmbeddingsEngine | null = null;

/**
 * Get or create embeddings engine instance
 */
export function getEmbeddingsEngine(apiKey?: string): EmbeddingsEngine {
  if (!embeddingsEngine) {
    if (!apiKey) {
      throw new Error('API key required for first initialization');
    }
    embeddingsEngine = new EmbeddingsEngine(apiKey);
  }
  return embeddingsEngine;
}

export default EmbeddingsEngine;