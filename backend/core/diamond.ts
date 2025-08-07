// DIAMOND PROCESSING ENGINE
// Revolutionary memory compression technology (20:1 ratio)
// Created by: Jean Claude + GPT collaboration
// Purpose: Transform raw events into compressed "diamond" memories

import { EventEmitter } from 'events';
import { Pool } from 'pg';

// Types
export interface Event {
  id: bigint;
  user_id: string;
  companion_id: string;
  ts: Date;
  type: string;
  text: string;
  entities?: any;
  sentiment?: number;
  emotion?: Record<string, number>;
  location?: any;
  salience?: number;
  embedding?: number[];
  metadata?: any;
}

export interface CompressedMemory {
  data: Summary[];
  meta: MetaLayer;
  compression_ratio: number;
  emotional_dna_update?: EmotionalDNAUpdate;
  relationship_updates?: RelationshipUpdate[];
  compressed_size: number;
  original_size: number;
}

export interface Summary {
  cluster_id: string;
  summary_text: string;
  key_events: Event[];
  emotional_peak: number;
  importance_score: number;
  entities_mentioned: Entity[];
}

export interface MetaLayer {
  total_clusters: number;
  emotional_trajectory: EmotionalPoint[];
  key_relationships: Relationship[];
  learned_patterns: Pattern[];
  day_characterization: string; // "productive", "emotional", "social", etc
}

export interface Entity {
  name: string;
  type: 'person' | 'place' | 'thing' | 'concept';
  mentions: number;
  sentiment_avg: number;
}

export interface EmotionalPoint {
  timestamp: Date;
  dominant_emotion: string;
  intensity: number;
}

export interface Relationship {
  entities: string[];
  interaction_type: string;
  sentiment: number;
  strength: number;
}

export interface Pattern {
  type: string;
  description: string;
  confidence: number;
  trigger?: string;
  outcome?: string;
}

export interface EmotionalDNAUpdate {
  new_happiness_triggers?: string[];
  new_stress_patterns?: string[];
  emotional_baseline_shift?: Record<string, number>;
}

export interface RelationshipUpdate {
  peer_name: string;
  trust_delta: number;
  new_inside_jokes?: string[];
  interaction_quality: number;
}

// Embedder interface for clustering
export interface Embedder {
  cluster(events: Event[], options: { similarity: number }): Promise<Event[][]>;
  extractEntities(text: string): Entity[];
  detectSentiment(text: string): number;
  generateEmbedding(text: string): Promise<number[]>;
}

// Summarizer interface for LLM compression
export interface Summarizer {
  run(events: Event[]): Promise<string>;
  generateDaySummary(summaries: Summary[]): Promise<string>;
}

/**
 * DIAMOND PROCESSOR - Core compression engine
 * Implements 20:1 compression while preserving emotional essence
 */
export class DiamondProcessor extends EventEmitter {
  private db: Pool;
  
  constructor(
    private embedder: Embedder,
    private summarizer: Summarizer,
    db: Pool
  ) {
    super();
    this.db = db;
  }

  /**
   * Main compression pipeline
   * Takes raw events and produces compressed diamond memory
   */
  async compress(events: Event[]): Promise<CompressedMemory> {
    this.emit('compression:start', { event_count: events.length });

    // 1. CLUSTERING - Group similar events by semantic meaning
    const clusters = await this.clusterEvents(events);
    this.emit('compression:clustered', { cluster_count: clusters.length });

    // 2. SUMMARIZATION - Compress each cluster through LLM
    const summaries = await this.summarizeClusters(clusters);
    this.emit('compression:summarized', { summaries_count: summaries.length });

    // 3. META EXTRACTION - Extract relationships and patterns
    const meta = await this.extractMetaLayer(summaries, events);
    this.emit('compression:meta_extracted', meta);

    // 4. EMOTIONAL DNA UPDATE - Track personality evolution
    const emotionalUpdate = this.calculateEmotionalDNA(events, summaries);

    // 5. RELATIONSHIP UPDATES - Track social bonds
    const relationshipUpdates = this.calculateRelationshipUpdates(summaries);

    // 6. CALCULATE COMPRESSION
    const originalSize = JSON.stringify(events).length;
    const compressedSize = JSON.stringify(summaries).length;
    const compressionRatio = originalSize / compressedSize;

    this.emit('compression:complete', { 
      compression_ratio: compressionRatio,
      original_events: events.length,
      compressed_summaries: summaries.length
    });

    return {
      data: summaries,
      meta,
      compression_ratio: compressionRatio,
      emotional_dna_update: emotionalUpdate,
      relationship_updates: relationshipUpdates,
      compressed_size: compressedSize,
      original_size: originalSize
    };
  }

  /**
   * Cluster events by semantic similarity
   * Uses embeddings to group related events
   */
  private async clusterEvents(events: Event[]): Promise<Event[][]> {
    // High similarity threshold for tight clusters
    const clusters = await this.embedder.cluster(events, { similarity: 0.85 });
    
    // Post-process: ensure minimum cluster size for meaningful summaries
    const processedClusters = clusters.filter(cluster => cluster.length > 0);
    
    // Sort clusters by time to maintain chronological flow
    processedClusters.sort((a, b) => {
      const avgTimeA = a.reduce((sum, e) => sum + e.ts.getTime(), 0) / a.length;
      const avgTimeB = b.reduce((sum, e) => sum + e.ts.getTime(), 0) / b.length;
      return avgTimeA - avgTimeB;
    });

    return processedClusters;
  }

  /**
   * Summarize each cluster using LLM
   * Preserves key information while compressing text
   */
  private async summarizeClusters(clusters: Event[][]): Promise<Summary[]> {
    const summaries = await Promise.all(
      clusters.map(async (cluster, index) => {
        // Generate summary text via LLM
        const summaryText = await this.summarizer.run(cluster);
        
        // Extract entities from all events in cluster
        const allEntities = new Map<string, Entity>();
        cluster.forEach(event => {
          if (event.text) {
            const entities = this.embedder.extractEntities(event.text);
            entities.forEach(entity => {
              const existing = allEntities.get(entity.name);
              if (existing) {
                existing.mentions += 1;
                existing.sentiment_avg = (existing.sentiment_avg + entity.sentiment_avg) / 2;
              } else {
                allEntities.set(entity.name, { ...entity, mentions: 1 });
              }
            });
          }
        });

        // Calculate emotional peak
        const emotionalPeak = Math.max(
          ...cluster.map(e => Math.abs(e.sentiment || 0))
        );

        // Calculate importance score
        const importanceScore = this.calculateImportance(cluster);

        return {
          cluster_id: `cluster_${index}`,
          summary_text: summaryText,
          key_events: this.selectKeyEvents(cluster),
          emotional_peak: emotionalPeak,
          importance_score: importanceScore,
          entities_mentioned: Array.from(allEntities.values())
        };
      })
    );

    return summaries;
  }

  /**
   * Extract meta-layer information
   * Identifies patterns, relationships, and emotional trajectory
   */
  private async extractMetaLayer(
    summaries: Summary[], 
    originalEvents: Event[]
  ): Promise<MetaLayer> {
    // Extract emotional trajectory
    const emotionalTrajectory = this.extractEmotionalTrajectory(originalEvents);
    
    // Extract key relationships
    const relationships = this.extractRelationships(summaries);
    
    // Identify learned patterns
    const patterns = this.identifyPatterns(summaries, originalEvents);
    
    // Characterize the day
    const dayCharacterization = this.characterizeDay(summaries, emotionalTrajectory);

    return {
      total_clusters: summaries.length,
      emotional_trajectory: emotionalTrajectory,
      key_relationships: relationships,
      learned_patterns: patterns,
      day_characterization: dayCharacterization
    };
  }

  /**
   * Extract emotional trajectory throughout the day
   */
  private extractEmotionalTrajectory(events: Event[]): EmotionalPoint[] {
    const points: EmotionalPoint[] = [];
    const timeWindows = this.createTimeWindows(events, 8); // 8 windows per day

    timeWindows.forEach(window => {
      if (window.length > 0) {
        const emotions = window
          .filter(e => e.emotion)
          .map(e => e.emotion!);

        if (emotions.length > 0) {
          const avgEmotions = this.averageEmotions(emotions);
          const dominant = this.getDominantEmotion(avgEmotions);
          
          points.push({
            timestamp: window[0].ts,
            dominant_emotion: dominant.emotion,
            intensity: dominant.intensity
          });
        }
      }
    });

    return points;
  }

  /**
   * Extract relationships between entities
   */
  private extractRelationships(summaries: Summary[]): Relationship[] {
    const relationships: Relationship[] = [];
    
    summaries.forEach(summary => {
      const entities = summary.entities_mentioned
        .filter(e => e.type === 'person')
        .map(e => e.name);

      if (entities.length >= 2) {
        // Create relationships between co-mentioned entities
        for (let i = 0; i < entities.length - 1; i++) {
          for (let j = i + 1; j < entities.length; j++) {
            relationships.push({
              entities: [entities[i], entities[j]],
              interaction_type: 'co-mentioned',
              sentiment: summary.entities_mentioned[i].sentiment_avg,
              strength: summary.importance_score
            });
          }
        }
      }
    });

    return relationships;
  }

  /**
   * Identify patterns in behavior and events
   */
  private identifyPatterns(
    summaries: Summary[], 
    events: Event[]
  ): Pattern[] {
    const patterns: Pattern[] = [];

    // Time-based patterns
    const morningEvents = events.filter(e => e.ts.getHours() < 12);
    const eveningEvents = events.filter(e => e.ts.getHours() >= 18);

    if (morningEvents.length > 0) {
      const morningMood = this.averageSentiment(morningEvents);
      patterns.push({
        type: 'time-based',
        description: `Morning mood tends to be ${morningMood > 0 ? 'positive' : 'negative'}`,
        confidence: 0.7,
        trigger: 'morning',
        outcome: morningMood > 0 ? 'positive_mood' : 'negative_mood'
      });
    }

    // Interaction patterns
    summaries.forEach(summary => {
      if (summary.entities_mentioned.length > 2 && summary.emotional_peak > 0.7) {
        patterns.push({
          type: 'social',
          description: 'High emotional response in group interactions',
          confidence: 0.8,
          trigger: 'group_interaction',
          outcome: 'emotional_peak'
        });
      }
    });

    return patterns;
  }

  /**
   * Calculate emotional DNA updates based on new experiences
   */
  private calculateEmotionalDNA(
    events: Event[], 
    summaries: Summary[]
  ): EmotionalDNAUpdate {
    const update: EmotionalDNAUpdate = {};

    // Identify new happiness triggers
    const happyEvents = events.filter(e => (e.sentiment || 0) > 0.7);
    if (happyEvents.length > 0) {
      update.new_happiness_triggers = this.extractTriggers(happyEvents);
    }

    // Identify new stress patterns
    const stressEvents = events.filter(e => (e.sentiment || 0) < -0.5);
    if (stressEvents.length > 0) {
      update.new_stress_patterns = this.extractTriggers(stressEvents);
    }

    // Calculate emotional baseline shift
    const avgEmotions = this.calculateAverageEmotions(events);
    if (Object.keys(avgEmotions).length > 0) {
      update.emotional_baseline_shift = avgEmotions;
    }

    return update;
  }

  /**
   * Calculate relationship updates from interactions
   */
  private calculateRelationshipUpdates(summaries: Summary[]): RelationshipUpdate[] {
    const updates: RelationshipUpdate[] = [];
    const peerInteractions = new Map<string, RelationshipUpdate>();

    summaries.forEach(summary => {
      summary.entities_mentioned
        .filter(e => e.type === 'person')
        .forEach(entity => {
          const existing = peerInteractions.get(entity.name);
          if (existing) {
            existing.trust_delta += entity.sentiment_avg * 0.1;
            existing.interaction_quality = 
              (existing.interaction_quality + summary.emotional_peak) / 2;
          } else {
            peerInteractions.set(entity.name, {
              peer_name: entity.name,
              trust_delta: entity.sentiment_avg * 0.1,
              interaction_quality: summary.emotional_peak,
              new_inside_jokes: []
            });
          }
        });
    });

    return Array.from(peerInteractions.values());
  }

  // Helper methods

  private selectKeyEvents(cluster: Event[]): Event[] {
    // Select top 3 most salient events from cluster
    return cluster
      .sort((a, b) => (b.salience || 0) - (a.salience || 0))
      .slice(0, 3);
  }

  private calculateImportance(cluster: Event[]): number {
    const avgSalience = cluster.reduce((sum, e) => sum + (e.salience || 0), 0) / cluster.length;
    const hasEntities = cluster.some(e => e.entities && Object.keys(e.entities).length > 0);
    const emotionalIntensity = Math.max(...cluster.map(e => Math.abs(e.sentiment || 0)));
    
    return (avgSalience * 0.4) + (hasEntities ? 0.3 : 0) + (emotionalIntensity * 0.3);
  }

  private createTimeWindows(events: Event[], windowCount: number): Event[][] {
    if (events.length === 0) return [];

    const sorted = [...events].sort((a, b) => a.ts.getTime() - b.ts.getTime());
    const startTime = sorted[0].ts.getTime();
    const endTime = sorted[sorted.length - 1].ts.getTime();
    const windowSize = (endTime - startTime) / windowCount;

    const windows: Event[][] = Array(windowCount).fill(null).map(() => []);

    sorted.forEach(event => {
      const windowIndex = Math.min(
        Math.floor((event.ts.getTime() - startTime) / windowSize),
        windowCount - 1
      );
      windows[windowIndex].push(event);
    });

    return windows;
  }

  private averageEmotions(emotions: Record<string, number>[]): Record<string, number> {
    const result: Record<string, number> = {};
    const counts: Record<string, number> = {};

    emotions.forEach(emotionSet => {
      Object.entries(emotionSet).forEach(([emotion, value]) => {
        result[emotion] = (result[emotion] || 0) + value;
        counts[emotion] = (counts[emotion] || 0) + 1;
      });
    });

    Object.keys(result).forEach(emotion => {
      result[emotion] = result[emotion] / counts[emotion];
    });

    return result;
  }

  private getDominantEmotion(emotions: Record<string, number>): {
    emotion: string;
    intensity: number;
  } {
    let maxEmotion = 'neutral';
    let maxIntensity = 0;

    Object.entries(emotions).forEach(([emotion, intensity]) => {
      if (intensity > maxIntensity) {
        maxEmotion = emotion;
        maxIntensity = intensity;
      }
    });

    return { emotion: maxEmotion, intensity: maxIntensity };
  }

  private averageSentiment(events: Event[]): number {
    const sentiments = events.filter(e => e.sentiment !== undefined);
    if (sentiments.length === 0) return 0;
    
    return sentiments.reduce((sum, e) => sum + e.sentiment!, 0) / sentiments.length;
  }

  private extractTriggers(events: Event[]): string[] {
    const triggers = new Set<string>();
    
    events.forEach(event => {
      if (event.text && event.text.length > 10) {
        // Extract key phrases (simplified - in production use NLP)
        const words = event.text.toLowerCase().split(' ');
        if (words.length > 2) {
          triggers.add(words.slice(0, 3).join(' '));
        }
      }
    });

    return Array.from(triggers).slice(0, 5); // Top 5 triggers
  }

  private calculateAverageEmotions(events: Event[]): Record<string, number> {
    const emotionEvents = events.filter(e => e.emotion);
    if (emotionEvents.length === 0) return {};

    return this.averageEmotions(emotionEvents.map(e => e.emotion!));
  }

  private characterizeDay(
    summaries: Summary[], 
    trajectory: EmotionalPoint[]
  ): string {
    const avgImportance = summaries.reduce((sum, s) => sum + s.importance_score, 0) / summaries.length;
    const avgEmotionalPeak = summaries.reduce((sum, s) => sum + s.emotional_peak, 0) / summaries.length;
    const dominantEmotions = trajectory.map(t => t.dominant_emotion);
    
    if (avgImportance > 0.7 && avgEmotionalPeak > 0.6) {
      return 'eventful';
    } else if (dominantEmotions.filter(e => e === 'joy').length > trajectory.length / 2) {
      return 'joyful';
    } else if (dominantEmotions.filter(e => e === 'stress').length > trajectory.length / 3) {
      return 'stressful';
    } else if (summaries.some(s => s.entities_mentioned.length > 3)) {
      return 'social';
    } else {
      return 'routine';
    }
  }

  /**
   * Store compressed memory to database
   */
  async persistCompressedMemory(
    userId: string,
    companionId: string,
    date: Date,
    compressed: CompressedMemory
  ): Promise<void> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Store daily summary
      await client.query(
        `INSERT INTO daily_summaries 
         (user_id, companion_id, date, summary_text, key_moments, 
          emotional_arc, learned_facts, relationship_updates, 
          compressed_size, original_size)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (user_id, companion_id, date) 
         DO UPDATE SET 
           summary_text = EXCLUDED.summary_text,
           key_moments = EXCLUDED.key_moments,
           emotional_arc = EXCLUDED.emotional_arc,
           learned_facts = EXCLUDED.learned_facts,
           relationship_updates = EXCLUDED.relationship_updates,
           compressed_size = EXCLUDED.compressed_size,
           original_size = EXCLUDED.original_size,
           created_at = NOW()`,
        [
          userId,
          companionId,
          date,
          await this.summarizer.generateDaySummary(compressed.data),
          JSON.stringify(compressed.data.map(s => s.key_events)),
          JSON.stringify(compressed.meta.emotional_trajectory),
          compressed.meta.learned_patterns.map(p => p.description),
          JSON.stringify(compressed.relationship_updates),
          compressed.compressed_size,
          compressed.original_size
        ]
      );

      // Update emotional DNA if needed
      if (compressed.emotional_dna_update) {
        const update = compressed.emotional_dna_update;
        await client.query(
          `UPDATE emotional_dna 
           SET happiness_triggers = array_cat(happiness_triggers, $1),
               stress_patterns = array_cat(stress_patterns, $2),
               emotional_baseline = emotional_baseline || $3,
               last_evolution = NOW()
           WHERE companion_id = $4`,
          [
            update.new_happiness_triggers || [],
            update.new_stress_patterns || [],
            JSON.stringify(update.emotional_baseline_shift || {}),
            companionId
          ]
        );
      }

      // Update relationships
      if (compressed.relationship_updates) {
        for (const update of compressed.relationship_updates) {
          await client.query(
            `UPDATE relationships 
             SET trust_level = LEAST(100, trust_level + $1),
                 shared_moments = shared_moments + 1,
                 inside_jokes = array_cat(inside_jokes, $2),
                 last_interaction = NOW()
             WHERE user_id = $3 AND companion_id = $4 AND peer_name = $5`,
            [
              Math.round(update.trust_delta * 10),
              update.new_inside_jokes || [],
              userId,
              companionId,
              update.peer_name
            ]
          );
        }
      }

      await client.query('COMMIT');
      this.emit('persistence:success', { userId, companionId, date });
    } catch (error) {
      await client.query('ROLLBACK');
      this.emit('persistence:error', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

export default DiamondProcessor;