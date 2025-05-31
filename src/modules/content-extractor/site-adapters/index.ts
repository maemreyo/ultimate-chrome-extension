import { SiteAdapter } from "../types"
import { MediumAdapter } from "./medium"
import { GenericNewsAdapter } from "./news-sites"
import { SubstackAdapter } from "./substack"

export { GenericNewsAdapter, MediumAdapter, SubstackAdapter }

const adapters: SiteAdapter[] = [
  new MediumAdapter(),
  new SubstackAdapter(),
  new GenericNewsAdapter()
]

export function getSiteAdapter(url: string): SiteAdapter | null {
  for (const adapter of adapters) {
    if (adapter.patterns.some((pattern) => pattern.test(url))) {
      return adapter
    }
  }
  return null
}

export function registerAdapter(adapter: SiteAdapter) {
  adapters.push(adapter)
}
