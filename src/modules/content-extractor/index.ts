// src/modules/content-extractor/index.ts
// Enhanced exports with new functionality and types

// Core services
export * from "./content-cleaner"
export {
  contentExtractor,
  ContentExtractorService
} from "./content-extractor-service"
export * from "./paragraph-detector"
export * from "./text-extractor"

// Site adapters
export * from "./site-adapters"
export {
  clearAdapters,
  GenericNewsAdapter,
  getAdapterByName,
  getRegisteredAdapters,
  getSiteAdapter,
  GitHubAdapter,
  LinkedInAdapter,
  MediumAdapter,
  RedditAdapter,
  registerAdapter,
  SubstackAdapter,
  TwitterAdapter,
  unregisterAdapter,
  WikipediaAdapter
} from "./site-adapters"

// Types
export * from "./types"
export type {
  CacheOptions,
  CleaningOptions,
  ContentExtractorPlugin,
  ContentMetadata,
  ContentQuality,
  CustomExtractor,
  Embed,
  Entity,
  ExtractedContent,
  ExtractionEvents,
  ExtractionOptions,
  ExtractionProgress,
  ExtractionResult,
  ImageMetadata,
  List,
  ListItem,
  Paragraph,
  ReadabilityScore,
  Section,
  SiteAdapter,
  SocialMetadata,
  StructuredData,
  Table
} from "./types"

// Utilities - Re-export from utilities module
export * from "./utilities"
