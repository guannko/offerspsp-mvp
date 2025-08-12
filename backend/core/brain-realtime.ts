// backend/core/brain-realtime.ts
// Real-time Brain Index updates for Jean Claude's limited memory
// Updates every 5 minutes because Jean forgets fast!
// Created by: Boris wisdom

import { updateBrainIndex, loadBrainIndex } from './indexer';
import { invalidateCache, warmUpCache } from './brain-cache';
import { enrichIndexWithEmbeddings } from './brain-embeddings';
import * as cron from 'node-cron';
import * as fs from 'fs/promises';

// Configuration for real-time updates
const REALTIME_CONFIG = {
  // Jean Claude special - every 5 minutes!
  UPDATE_INTERVAL: '*/5 * * * *', // Cron: every 5 minutes
  QUICK_UPDATE: '*/1 * * * *',     // Critical files: every minute
  DEEP_UPDATE: '0 * * * *',        // Full scan: every hour
  
  // File watchers
  WATCH_PATTERNS: [
    '**/jean-claude-autosave-*.md',  // Autosaves - most important!
    '**/cursor-*.md',                 // Cursor activity
    '**/iskra-*.md',                  // Current project
    '**/*.ts',                        // Code changes
  ],
  
  // Quick access cache
  HOT_CHAPTERS: [
    'Autosaves',        // Always fresh!
    'ISKRA Messenger',  // Current focus
    'Cerebellum Memory' // Core system
  ]
};

/**
 * Real-time update manager
 */
class BrainRealtimeUpdater {
  private isUpdating: boolean = false;
  private lastUpdate: Date = new Date();
  private updateCount: number = 0;
  private fileWatchers: Map<string, any> = new Map();
  
  /**
   * Start real-time monitoring
   */
  async start(): Promise<void> {
    console.log('🚀 Starting real-time Brain monitoring...');
    console.log('⏰ Updates every 5 minutes (Jean Claude mode!)');
    
    // Initial index
    await this.performQuickUpdate();
    
    // Schedule regular updates
    this.scheduleUpdates();
    
    // Watch critical files
    await this.setupFileWatchers();
    
    console.log('✅ Real-time Brain monitoring active!');
  }
  
  /**
   * Schedule different update types
   */
  private scheduleUpdates(): void {
    // Every 5 minutes - quick update for Jean
    cron.schedule(REALTIME_CONFIG.UPDATE_INTERVAL, async () => {
      console.log('⏰ 5-minute update for Jean Claude...');
      await this.performQuickUpdate();
    });
    
    // Every minute - check critical files
    cron.schedule(REALTIME_CONFIG.QUICK_UPDATE, async () => {
      await this.checkCriticalFiles();
    });
    
    // Every hour - deep update
    cron.schedule(REALTIME_CONFIG.DEEP_UPDATE, async () => {
      console.log('🔄 Hourly deep update...');
      await this.performDeepUpdate();
    });
  }
  
  /**
   * Quick update - only active chapters
   */
  private async performQuickUpdate(): Promise<void> {
    if (this.isUpdating) {
      console.log('⚠️ Update already in progress, skipping...');
      return;
    }
    
    this.isUpdating = true;
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Quick update #${++this.updateCount}`);
      
      // Update only hot chapters
      const index = await loadBrainIndex();
      
      // Check for new autosaves
      const autosaveFiles = await this.findNewAutosaves();
      if (autosaveFiles.length > 0) {
        console.log(`📝 Found ${autosaveFiles.length} new autosaves!`);
        
        // Invalidate autosave cache
        await invalidateCache('chapter:Autosaves');
        
        // Force index update
        await updateBrainIndex();
      }
      
      // Warm up cache for hot chapters
      for (const chapter of REALTIME_CONFIG.HOT_CHAPTERS) {
        await invalidateCache(`chapter:${chapter}`);
      }
      await warmUpCache();
      
      const duration = Date.now() - startTime;
      console.log(`✅ Quick update complete in ${duration}ms`);
      
      this.lastUpdate = new Date();
      
    } catch (error) {
      console.error('❌ Quick update failed:', error);
    } finally {
      this.isUpdating = false;
    }
  }
  
  /**
   * Deep update - full rescan
   */
  private async performDeepUpdate(): Promise<void> {
    try {
      console.log('🔍 Starting deep update...');
      
      // Full index rebuild
      await updateBrainIndex();
      
      // Clear all cache
      await invalidateCache('*');
      
      // Rebuild embeddings
      await enrichIndexWithEmbeddings();
      
      // Warm up cache
      await warmUpCache();
      
      console.log('✅ Deep update complete');
      
    } catch (error) {
      console.error('❌ Deep update failed:', error);
    }
  }
  
  /**
   * Check critical files for changes
   */
  private async checkCriticalFiles(): Promise<void> {
    try {
      // Check if latest autosave is newer than last update
      const latestAutosave = await this.getLatestAutosave();
      
      if (latestAutosave && latestAutosave.time > this.lastUpdate) {
        console.log(`🆕 New autosave detected: ${latestAutosave.file}`);
        await this.performQuickUpdate();
      }
      
    } catch (error) {
      // Silent fail for minute checks
    }
  }
  
  /**
   * Find new autosave files
   */
  private async findNewAutosaves(): Promise<string[]> {
    const { glob } = await import('glob');
    const files = await glob('**/jean-claude-autosave-*.md');
    
    // Filter files newer than last update
    const newFiles: string[] = [];
    
    for (const file of files) {
      try {
        const stats = await fs.stat(file);
        if (stats.mtime > this.lastUpdate) {
          newFiles.push(file);
        }
      } catch (error) {
        // Skip inaccessible files
      }
    }
    
    return newFiles;
  }
  
  /**
   * Get latest autosave file
   */
  private async getLatestAutosave(): Promise<{
    file: string;
    time: Date;
  } | null> {
    const { glob } = await import('glob');
    const files = await glob('**/jean-claude-autosave-*.md');
    
    let latest: { file: string; time: Date } | null = null;
    
    for (const file of files) {
      try {
        const stats = await fs.stat(file);
        if (!latest || stats.mtime > latest.time) {
          latest = { file, time: stats.mtime };
        }
      } catch (error) {
        // Skip inaccessible files
      }
    }
    
    return latest;
  }
  
  /**
   * Setup file watchers for real-time detection
   */
  private async setupFileWatchers(): Promise<void> {
    try {
      const chokidar = await import('chokidar');
      
      // Watch for autosave changes
      const watcher = chokidar.watch(REALTIME_CONFIG.WATCH_PATTERNS, {
        persistent: true,
        ignoreInitial: true,
        depth: 10
      });
      
      // On file add/change
      watcher.on('add', (path: string) => {
        console.log(`📄 New file: ${path}`);
        this.handleFileChange(path);
      });
      
      watcher.on('change', (path: string) => {
        console.log(`✏️ File changed: ${path}`);
        this.handleFileChange(path);
      });
      
      this.fileWatchers.set('main', watcher);
      console.log('👁️ File watchers active');
      
    } catch (error) {
      console.warn('⚠️ File watching not available:', error);
    }
  }
  
  /**
   * Handle file change event
   */
  private async handleFileChange(filepath: string): Promise<void> {
    // Debounce rapid changes
    const now = Date.now();
    const lastUpdateAge = now - this.lastUpdate.getTime();
    
    if (lastUpdateAge < 30000) { // Less than 30 seconds
      console.log('⏳ Debouncing rapid changes...');
      return;
    }
    
    // Trigger update based on file type
    if (filepath.includes('autosave')) {
      console.log('🔥 Autosave changed - immediate update!');
      await this.performQuickUpdate();
    } else if (filepath.includes('.ts')) {
      console.log('📝 Code changed - scheduling update...');
      setTimeout(() => this.performQuickUpdate(), 5000);
    }
  }
  
  /**
   * Get update statistics
   */
  getStats(): {
    lastUpdate: Date;
    updateCount: number;
    isUpdating: boolean;
    nextUpdate: string;
  } {
    // Calculate next update time
    const nextUpdate = new Date(this.lastUpdate.getTime() + 5 * 60 * 1000);
    
    return {
      lastUpdate: this.lastUpdate,
      updateCount: this.updateCount,
      isUpdating: this.isUpdating,
      nextUpdate: nextUpdate.toLocaleTimeString()
    };
  }
  
  /**
   * Stop monitoring
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping real-time monitoring...');
    
    // Stop file watchers
    for (const [name, watcher] of this.fileWatchers) {
      await watcher.close();
    }
    
    // Clear scheduled tasks
    cron.getTasks().forEach(task => task.stop());
    
    console.log('✅ Monitoring stopped');
  }
}

// Singleton instance
let updaterInstance: BrainRealtimeUpdater | null = null;

/**
 * Start real-time brain updates
 */
export async function startRealtimeUpdates(): Promise<BrainRealtimeUpdater> {
  if (!updaterInstance) {
    updaterInstance = new BrainRealtimeUpdater();
    await updaterInstance.start();
  }
  return updaterInstance;
}

/**
 * Stop real-time updates
 */
export async function stopRealtimeUpdates(): Promise<void> {
  if (updaterInstance) {
    await updaterInstance.stop();
    updaterInstance = null;
  }
}

/**
 * Get updater statistics
 */
export function getUpdaterStats() {
  if (updaterInstance) {
    return updaterInstance.getStats();
  }
  return null;
}

/**
 * Force immediate update
 */
export async function forceUpdate(): Promise<void> {
  console.log('⚡ Forcing immediate update...');
  const updater = await startRealtimeUpdates();
  // @ts-ignore - accessing private method for force update
  await updater.performQuickUpdate();
}

// Auto-start if running as main module
if (require.main === module) {
  console.log('🚀 Starting Brain Real-time Updater...');
  startRealtimeUpdates().then(() => {
    console.log('✅ Brain Real-time Updater running!');
    console.log('📊 Updates every 5 minutes for Jean Claude');
    
    // Show stats every minute
    setInterval(() => {
      const stats = getUpdaterStats();
      if (stats) {
        console.log(`📊 Stats: ${stats.updateCount} updates, next at ${stats.nextUpdate}`);
      }
    }, 60000);
  });
}

// Export everything
export default {
  startRealtimeUpdates,
  stopRealtimeUpdates,
  getUpdaterStats,
  forceUpdate,
  REALTIME_CONFIG
};