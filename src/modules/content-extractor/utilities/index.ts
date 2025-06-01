// src/modules/content-extractor/utilities/index.ts
// Centralized exports for all utility functions

// Extraction utilities
export {
  extractBatch,
  extractFromCurrentTab,
  extractFromDocument,
  extractFromHTML,
  extractFromUrl
} from "./extraction-helpers"

// Plugin utilities
export {
  createExtractorPlugin,
  createPlugin,
  createTransformerPlugin,
  mergePlugins,
  validatePlugin
} from "./plugin-helpers"

// Quality assessment utilities
export {
  calculateQualityScore,
  compareQuality,
  getQualityAssessment,
  getReadabilityAssessment,
  getReadabilityDescription,
  getReadabilityLevel,
  isHighQualityContent
} from "./quality-helpers"

// DOM manipulation utilities
export {
  calculateReadingTime,
  detectLanguage,
  extractCleanText,
  extractImages,
  extractStructuredData,
  extractTables,
  findBestContentElement
} from "./dom-helpers"

// Readability analysis utilities
export {
  analyzeSentenceComplexity,
  analyzeVocabulary,
  calculateReadabilityMetrics,
  getReadabilityRecommendations
} from "./readability-helpers"

// Performance monitoring utilities
export {
  BatchProcessor,
  debounce,
  ExtractionPerformanceMonitor,
  getPerformanceRecommendations,
  MemoryTracker,
  PerformanceTimer,
  throttle
} from "./performance-helpers"

// Cache optimization utilities
export {
  AdvancedLRUCache,
  CacheAnalyzer,
  CacheInvalidator,
  CacheWarmer,
  ContentFingerprinter
} from "./cache-optimization-helpers"
