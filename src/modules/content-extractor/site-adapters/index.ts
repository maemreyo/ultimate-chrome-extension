import { SiteAdapter } from "../types"
import { GitHubAdapter } from "./github"
import { LinkedInAdapter } from "./linkedin"
import { MediumAdapter } from "./medium"
import { GenericNewsAdapter } from "./news-sites"
import { RedditAdapter } from "./reddit"
import { SubstackAdapter } from "./substack"
import { TwitterAdapter } from "./twitter"
import { WikipediaAdapter } from "./wikipedia"

// Export all adapters
export {
  GenericNewsAdapter,
  GitHubAdapter,
  LinkedInAdapter,
  MediumAdapter,
  RedditAdapter,
  SubstackAdapter,
  TwitterAdapter,
  WikipediaAdapter
}

// Internal adapters registry
const adapters: SiteAdapter[] = [
  new MediumAdapter(),
  new SubstackAdapter(),
  new GenericNewsAdapter(),
  new GitHubAdapter(),
  new LinkedInAdapter(),
  new RedditAdapter(),
  new TwitterAdapter(),
  new WikipediaAdapter()
]

/**
 * Get the appropriate site adapter for a given URL
 * @param url - The URL to find an adapter for
 * @returns The matching adapter or null if none found
 */
export function getSiteAdapter(url: string): SiteAdapter | null {
  // Sort adapters by priority (higher priority first)
  const sortedAdapters = [...adapters].sort(
    (a, b) => (b.priority || 0) - (a.priority || 0)
  )

  for (const adapter of sortedAdapters) {
    if (adapter.patterns.some((pattern) => pattern.test(url))) {
      return adapter
    }
  }
  return null
}

/**
 * Register a new site adapter
 * @param adapter - The adapter to register
 */
export function registerAdapter(adapter: SiteAdapter): void {
  // Check if adapter with same name already exists
  const existingIndex = adapters.findIndex((a) => a.name === adapter.name)
  if (existingIndex !== -1) {
    // Replace existing adapter
    adapters[existingIndex] = adapter
  } else {
    // Add new adapter
    adapters.push(adapter)
  }
}

/**
 * Unregister a site adapter by name
 * @param name - The name of the adapter to unregister
 * @returns True if adapter was found and removed, false otherwise
 */
export function unregisterAdapter(name: string): boolean {
  const index = adapters.findIndex((adapter) => adapter.name === name)
  if (index !== -1) {
    adapters.splice(index, 1)
    return true
  }
  return false
}

/**
 * Get all registered adapters
 * @returns Array of all registered adapters
 */
export function getRegisteredAdapters(): SiteAdapter[] {
  return [...adapters] // Return a copy to prevent external modification
}

/**
 * Clear all registered adapters
 */
export function clearAdapters(): void {
  adapters.length = 0
}

/**
 * Get adapter by name
 * @param name - The name of the adapter to find
 * @returns The adapter if found, null otherwise
 */
export function getAdapterByName(name: string): SiteAdapter | null {
  return adapters.find((adapter) => adapter.name === name) || null
}
