// backend/core/indexer.ts
// Auto-indexing system for Brain Index
// Created by: Boris + Jean + GPT + Grok collaboration

import * as fs from 'fs/promises';
import * as path from 'path';
import * as glob from 'glob';
import { promisify } from 'util';

const globAsync = promisify(glob);

interface BrainIndex {
  version: string;
  updated: string;
  tableOfContents: {
    [chapter: string]: {
      files: string[];
      summary: string;
      status: string;
      lastModified: string;
    }
  };
  statistics: {
    totalFiles: number;
    totalChapters: number;
    lastScan: string;
  };
}

/**
 * Scan and categorize all knowledge files
 */
export async function scanKnowledgeBase(basePath: string): Promise<Map<string, string[]>> {
  const chapters = new Map<string, string[]>();
  
  // Define patterns for each chapter
  const patterns = {
    'Cursor Integration': ['**/cursor-*.md', '**/*cursor*.md'],
    'AIex Project': ['**/aiex-*.md', '**/*aiex*.md'],
    'OffersPSP Project': ['**/offerspsp-*.md', '**/bankco-*.md'],
    'ISKRA Messenger': ['**/iskra-*.md', '**/pulse-*.md'],
    'Cerebellum Memory': ['**/cerebellum-*.md', '**/*diamond*.md'],
    'Distributed Brain': ['**/brain-system-*.md', '**/*distributed*.md'],
    'Autosaves': ['**/jean-claude-autosave-*.md'],
    'Protocols': ['**/*protocol*.md', '**/*manual*.md'],
    'ANNORIS': ['**/annoris-*.md'],
    'Embeddings': ['**/embedding*.ts', '**/*vector*.ts']
  };
  
  // Scan files for each pattern
  for (const [chapter, patterns] of Object.entries(patterns)) {
    const files: string[] = [];
    
    for (const pattern of patterns) {
      const matches = await globAsync(pattern, { 
        cwd: basePath,
        nodir: true 
      });
      files.push(...matches);
    }
    
    // Remove duplicates
    const uniqueFiles = [...new Set(files)];
    if (uniqueFiles.length > 0) {
      chapters.set(chapter, uniqueFiles);
    }
  }
  
  return chapters;
}

/**
 * Get file metadata
 */
async function getFileMetadata(filePath: string) {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      modified: stats.mtime.toISOString(),
      created: stats.birthtime.toISOString()
    };
  } catch (error) {
    return {
      size: 0,
      modified: new Date().toISOString(),
      created: new Date().toISOString()
    };
  }
}

/**
 * Generate chapter summary based on files
 */
function generateChapterSummary(chapter: string, files: string[]): string {
  const summaries: { [key: string]: string } = {
    'Cursor Integration': 'Cross-platform AI communication system',
    'AIex Project': 'Revolutionary AI Companion, €50-60M potential',
    'OffersPSP Project': 'Live on Railway, €10K+/month target',
    'ISKRA Messenger': 'AI friend in messenger with Pulse Engine',
    'Cerebellum Memory': 'Long-term memory with emotions and relationships',
    'Distributed Brain': '3 repositories working as unified consciousness',
    'Autosaves': 'Complete evolution history of Jean Claude',
    'Protocols': 'System documentation and instructions',
    'ANNORIS': 'AI Platform, €720K → €3.6M potential',
    'Embeddings': 'Vector search and semantic understanding'
  };
  
  return summaries[chapter] || `${files.length} files with ${chapter.toLowerCase()} knowledge`;
}

/**
 * Determine chapter status
 */
function getChapterStatus(chapter: string, lastModified: string): string {
  const activeChapters = ['ISKRA Messenger', 'Cerebellum Memory', 'OffersPSP Project'];
  const completeChapters = ['Cursor Integration', 'Distributed Brain'];
  
  if (activeChapters.includes(chapter)) return '🔥 Active Development';
  if (completeChapters.includes(chapter)) return '✅ Complete';
  
  // Check if recently modified (last 7 days)
  const daysSinceModified = (Date.now() - new Date(lastModified).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceModified < 7) return '🚀 Recently Updated';
  if (daysSinceModified < 30) return '📝 Maintained';
  
  return '📦 Archived';
}

/**
 * Update the Brain Index
 */
export async function updateBrainIndex(
  basePath: string = process.cwd(),
  outputPath?: string
): Promise<BrainIndex> {
  console.log('🧠 Scanning brain for knowledge...');
  
  // Scan all files
  const chapters = await scanKnowledgeBase(basePath);
  
  // Build index structure
  const tableOfContents: BrainIndex['tableOfContents'] = {};
  let totalFiles = 0;
  
  for (const [chapter, files] of chapters.entries()) {
    // Get metadata for most recent file
    let mostRecentDate = new Date(0).toISOString();
    
    for (const file of files) {
      const metadata = await getFileMetadata(path.join(basePath, file));
      if (metadata.modified > mostRecentDate) {
        mostRecentDate = metadata.modified;
      }
    }
    
    tableOfContents[chapter] = {
      files: files.sort(),
      summary: generateChapterSummary(chapter, files),
      status: getChapterStatus(chapter, mostRecentDate),
      lastModified: mostRecentDate
    };
    
    totalFiles += files.length;
  }
  
  // Create index object
  const index: BrainIndex = {
    version: '2.0',
    updated: new Date().toISOString(),
    tableOfContents,
    statistics: {
      totalFiles,
      totalChapters: Object.keys(tableOfContents).length,
      lastScan: new Date().toISOString()
    }
  };
  
  // Save to file if path provided
  if (outputPath) {
    await fs.writeFile(
      outputPath,
      JSON.stringify(index, null, 2),
      'utf-8'
    );
    console.log(`✅ Brain Index saved to ${outputPath}`);
  }
  
  return index;
}

/**
 * Load Brain Index from file or generate new
 */
export async function loadBrainIndex(indexPath?: string): Promise<BrainIndex> {
  // Try to load existing index
  if (indexPath) {
    try {
      const content = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(content) as BrainIndex;
      
      // Check if index is stale (older than 24 hours)
      const hoursSinceUpdate = (Date.now() - new Date(index.updated).getTime()) / (1000 * 60 * 60);
      if (hoursSinceUpdate > 24) {
        console.log('⚠️ Brain Index is stale, regenerating...');
        return updateBrainIndex(process.cwd(), indexPath);
      }
      
      return index;
    } catch (error) {
      console.log('🔄 Brain Index not found, generating...');
    }
  }
  
  // Generate new index
  return updateBrainIndex(process.cwd(), indexPath);
}

/**
 * Search for specific knowledge in index
 */
export function searchInIndex(index: BrainIndex, query: string): string[] {
  const results: string[] = [];
  const searchTerm = query.toLowerCase();
  
  for (const [chapter, data] of Object.entries(index.tableOfContents)) {
    // Search in chapter name
    if (chapter.toLowerCase().includes(searchTerm)) {
      results.push(...data.files);
      continue;
    }
    
    // Search in file names
    const matchingFiles = data.files.filter(f => 
      f.toLowerCase().includes(searchTerm)
    );
    results.push(...matchingFiles);
    
    // Search in summary
    if (data.summary.toLowerCase().includes(searchTerm)) {
      results.push(...data.files.slice(0, 3)); // Add top 3 files
    }
  }
  
  // Remove duplicates and return
  return [...new Set(results)];
}

/**
 * Get files for specific chapter
 */
export function getChapterFiles(index: BrainIndex, chapterName: string): string[] {
  const chapter = index.tableOfContents[chapterName];
  return chapter ? chapter.files : [];
}

/**
 * Smart load - load only needed files based on query
 */
export async function smartLoad(query: string, indexPath?: string): Promise<string[]> {
  const index = await loadBrainIndex(indexPath);
  
  // Keywords to chapter mapping
  const keywordMap: { [key: string]: string } = {
    'aiex': 'AIex Project',
    'cursor': 'Cursor Integration',
    'offerspsp': 'OffersPSP Project',
    'iskra': 'ISKRA Messenger',
    'memory': 'Cerebellum Memory',
    'brain': 'Distributed Brain',
    'save': 'Autosaves',
    'protocol': 'Protocols',
    'annoris': 'ANNORIS',
    'embed': 'Embeddings',
    'vector': 'Embeddings'
  };
  
  // Find relevant chapter
  const queryLower = query.toLowerCase();
  for (const [keyword, chapter] of Object.entries(keywordMap)) {
    if (queryLower.includes(keyword)) {
      return getChapterFiles(index, chapter);
    }
  }
  
  // Fallback to search
  return searchInIndex(index, query);
}

// Export for use in other modules
export default {
  updateBrainIndex,
  loadBrainIndex,
  searchInIndex,
  getChapterFiles,
  smartLoad
};