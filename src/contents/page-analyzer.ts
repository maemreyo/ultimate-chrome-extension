import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_idle"
}

// Analyze page structure and content
export function analyzePage() {
  const analysis = {
    title: document.title,
    url: window.location.href,
    meta: {} as Record<string, string>,
    headings: [] as string[],
    images: [] as string[],
    links: [] as string[],
    scripts: [] as string[],
    performance: {} as Record<string, number>
  }
  
  // Extract meta tags
  document.querySelectorAll("meta").forEach((meta) => {
    const name = meta.getAttribute("name") || meta.getAttribute("property")
    const content = meta.getAttribute("content")
    if (name && content) {
      analysis.meta[name] = content
    }
  })
  
  // Extract headings
  document.querySelectorAll("h1, h2, h3").forEach((heading) => {
    analysis.headings.push(heading.textContent?.trim() || "")
  })
  
  // Extract images
  document.querySelectorAll("img").forEach((img) => {
    if (img.src) analysis.images.push(img.src)
  })
  
  // Extract links
  document.querySelectorAll("a[href]").forEach((link) => {
    analysis.links.push(link.getAttribute("href") || "")
  })
  
  // Extract scripts
  document.querySelectorAll("script[src]").forEach((script) => {
    analysis.scripts.push(script.getAttribute("src") || "")
  })
  
  // Performance metrics
  if (window.performance) {
    const perfData = window.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
    analysis.performance = {
      domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
      loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
      domInteractive: perfData.domInteractive,
      responseTime: perfData.responseEnd - perfData.requestStart
    }
  }
  
  return analysis
}

// Send analysis to background
chrome.runtime.sendMessage({
  action: "page-analyzed",
  data: analyzePage()
})