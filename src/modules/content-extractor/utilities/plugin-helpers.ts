// src/modules/content-extractor/utilities/plugin-helpers.ts
// Utility functions for plugin management

import type { ContentExtractorPlugin } from "../types"

/**
 * Create a content extractor plugin with default values
 * @param name - Plugin name
 * @param version - Plugin version
 * @param handlers - Plugin handlers (partial implementation)
 * @returns Complete plugin object
 */
export const createPlugin = (
  name: string,
  version: string,
  handlers: Partial<ContentExtractorPlugin>
): ContentExtractorPlugin => {
  if (!name || !version) {
    throw new Error("Plugin name and version are required")
  }

  return {
    name,
    version,
    ...handlers
  }
}

/**
 * Validate plugin structure
 * @param plugin - Plugin to validate
 * @returns True if plugin is valid
 */
export const validatePlugin = (
  plugin: any
): plugin is ContentExtractorPlugin => {
  return (
    typeof plugin === "object" &&
    plugin !== null &&
    typeof plugin.name === "string" &&
    typeof plugin.version === "string" &&
    plugin.name.length > 0 &&
    plugin.version.length > 0
  )
}

/**
 * Create a simple extractor plugin
 * @param name - Plugin name
 * @param version - Plugin version
 * @param selector - CSS selector for extraction
 * @param extractor - Extraction function
 * @returns Plugin with extractor
 */
export const createExtractorPlugin = (
  name: string,
  version: string,
  selector: string,
  extractor: (element: Element) => any
): ContentExtractorPlugin => {
  return createPlugin(name, version, {
    extractors: {
      [selector]: (doc: Document) => {
        const elements = doc.querySelectorAll(selector)
        return Array.from(elements).map(extractor)
      }
    }
  })
}

/**
 * Create a content transformer plugin
 * @param name - Plugin name
 * @param version - Plugin version
 * @param transformer - Content transformation function
 * @returns Plugin with transformer
 */
export const createTransformerPlugin = (
  name: string,
  version: string,
  transformer: (content: any) => any
): ContentExtractorPlugin => {
  return createPlugin(name, version, {
    afterExtract: transformer
  })
}

/**
 * Merge multiple plugins into one
 * @param name - Combined plugin name
 * @param version - Combined plugin version
 * @param plugins - Plugins to merge
 * @returns Merged plugin
 */
export const mergePlugins = (
  name: string,
  version: string,
  plugins: ContentExtractorPlugin[]
): ContentExtractorPlugin => {
  const merged: ContentExtractorPlugin = {
    name,
    version
  }

  // Merge init functions
  const initFunctions = plugins.filter((p) => p.init).map((p) => p.init!)
  if (initFunctions.length > 0) {
    merged.init = async () => {
      for (const init of initFunctions) {
        await init()
      }
    }
  }

  // Merge beforeExtract functions
  const beforeExtractFunctions = plugins
    .filter((p) => p.beforeExtract)
    .map((p) => p.beforeExtract!)
  if (beforeExtractFunctions.length > 0) {
    merged.beforeExtract = (doc, options) => {
      return beforeExtractFunctions.reduce(
        (currentDoc, fn) => fn(currentDoc, options),
        doc
      )
    }
  }

  // Merge afterExtract functions
  const afterExtractFunctions = plugins
    .filter((p) => p.afterExtract)
    .map((p) => p.afterExtract!)
  if (afterExtractFunctions.length > 0) {
    merged.afterExtract = (content) => {
      return afterExtractFunctions.reduce(
        (currentContent, fn) => fn(currentContent),
        content
      )
    }
  }

  // Merge extractors
  const allExtractors = plugins
    .filter((p) => p.extractors)
    .map((p) => p.extractors!)
  if (allExtractors.length > 0) {
    merged.extractors = Object.assign({}, ...allExtractors)
  }

  return merged
}
