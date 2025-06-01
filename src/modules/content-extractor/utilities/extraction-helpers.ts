// src/modules/content-extractor/utilities/extraction-helpers.ts
// Utility functions for content extraction operations

import type {
  ExtractedContent,
  ExtractionOptions,
  ExtractionResult
} from "../types"

/**
 * Extract content from a URL
 * @param url - The URL to extract content from
 * @param options - Extraction options
 * @returns Promise with extraction result
 */
export const extractFromUrl = async (
  url: string,
  options?: ExtractionOptions
): Promise<ExtractionResult<ExtractedContent>> => {
  const { contentExtractor } = await import("../content-extractor-service")
  return contentExtractor.extract(url, options)
}

/**
 * Extract content from the current browser tab
 * @param options - Extraction options
 * @returns Promise with extraction result
 */
export const extractFromCurrentTab = async (
  options?: ExtractionOptions
): Promise<ExtractionResult<ExtractedContent>> => {
  const { contentExtractor } = await import("../content-extractor-service")
  return contentExtractor.extractFromCurrentTab(options)
}

/**
 * Extract content from multiple URLs in batch
 * @param urls - Array of URLs to extract content from
 * @param options - Extraction options
 * @param concurrency - Number of concurrent extractions (default: 3)
 * @returns Promise with array of extraction results
 */
export const extractBatch = async (
  urls: string[],
  options?: ExtractionOptions,
  concurrency: number = 3
): Promise<ExtractionResult<ExtractedContent>[]> => {
  const { contentExtractor } = await import("../content-extractor-service")
  return contentExtractor.extractBatch(urls, options, concurrency)
}

/**
 * Extract content from a DOM document
 * @param document - The DOM document to extract from
 * @param url - The URL of the document
 * @param options - Extraction options
 * @returns Promise with extraction result
 */
export const extractFromDocument = async (
  document: Document,
  url: string,
  options?: ExtractionOptions
): Promise<ExtractionResult<ExtractedContent>> => {
  const { contentExtractor } = await import("../content-extractor-service")
  return contentExtractor.extractFromDocument(document, url, options)
}

/**
 * Extract content from HTML string
 * @param html - The HTML string to extract from
 * @param url - The URL of the content
 * @param options - Extraction options
 * @returns Promise with extraction result
 */
export const extractFromHTML = async (
  html: string,
  url: string,
  options?: ExtractionOptions
): Promise<ExtractionResult<ExtractedContent>> => {
  const { contentExtractor } = await import("../content-extractor-service")
  return contentExtractor.extractFromHTML(html, url, options)
}
