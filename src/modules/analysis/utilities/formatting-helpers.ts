// src/modules/analysis/utilities/formatting-helpers.ts
// Result formatting and presentation utilities

import type { AnalysisResult } from "../types"

/**
 * Format analysis result for display
 * @param result - Analysis result to format
 * @param format - Output format
 * @returns Formatted result
 */
export function formatResult(
  result: AnalysisResult,
  format: "html" | "markdown" | "json" | "text" = "html"
): string {
  switch (format) {
    case "html":
      return formatAsHTML(result)
    case "markdown":
      return formatAsMarkdown(result)
    case "json":
      return formatAsJSON(result)
    case "text":
      return formatAsText(result)
    default:
      return JSON.stringify(result, null, 2)
  }
}

/**
 * Format result as HTML
 * @param result - Analysis result
 * @returns HTML string
 */
function formatAsHTML(result: AnalysisResult): string {
  const { type, output, metadata } = result

  let html = `<div class="analysis-result" data-type="${type}">`
  html += `<div class="analysis-header">`
  html += `<h2>${type.replace(/([A-Z])/g, " $1").trim()}</h2>`
  html += `<div class="analysis-meta">`
  html += `<span class="duration">${formatDuration(metadata.duration)}</span>`
  html += `<span class="status ${result.status}">${result.status}</span>`
  html += `</div></div>`

  if (output) {
    html += `<div class="analysis-content">`
    html += formatOutputAsHTML(output)
    html += `</div>`
  }

  html += `</div>`
  return html
}

/**
 * Format result as Markdown
 * @param result - Analysis result
 * @returns Markdown string
 */
function formatAsMarkdown(result: AnalysisResult): string {
  const { type, output, metadata } = result

  let md = `# ${type.replace(/([A-Z])/g, " $1").trim()}\n\n`
  md += `**Status:** ${result.status}\n`
  md += `**Duration:** ${formatDuration(metadata.duration)}\n`
  md += `**Completed:** ${metadata.completedAt?.toLocaleString() || "N/A"}\n\n`

  if (output) {
    md += `## Results\n\n`
    md += formatOutputAsMarkdown(output)
  }

  return md
}

/**
 * Format result as JSON
 * @param result - Analysis result
 * @returns JSON string
 */
function formatAsJSON(result: AnalysisResult): string {
  return JSON.stringify(result, null, 2)
}

/**
 * Format result as plain text
 * @param result - Analysis result
 * @returns Plain text string
 */
function formatAsText(result: AnalysisResult): string {
  const { type, output, metadata } = result

  let text = `${type.replace(/([A-Z])/g, " $1").trim()}\n`
  text += `${"=".repeat(text.length - 1)}\n\n`
  text += `Status: ${result.status}\n`
  text += `Duration: ${formatDuration(metadata.duration)}\n`
  text += `Completed: ${metadata.completedAt?.toLocaleString() || "N/A"}\n\n`

  if (output) {
    text += `Results:\n--------\n`
    text += formatOutputAsText(output)
  }

  return text
}

/**
 * Format output data as HTML
 * @param output - Output data
 * @returns HTML string
 */
function formatOutputAsHTML(output: any): string {
  if (typeof output === "string") {
    return `<div class="text-content">${escapeHTML(output)}</div>`
  }

  if (Array.isArray(output)) {
    return `<ul class="list-content">${output
      .map((item) => `<li>${formatOutputAsHTML(item)}</li>`)
      .join("")}</ul>`
  }

  if (typeof output === "object" && output !== null) {
    let html = `<div class="object-content">`
    for (const [key, value] of Object.entries(output)) {
      html += `<div class="field">`
      html += `<label class="field-label">${escapeHTML(key)}:</label>`
      html += `<div class="field-value">${formatOutputAsHTML(value)}</div>`
      html += `</div>`
    }
    html += `</div>`
    return html
  }

  return `<span class="primitive-value">${escapeHTML(String(output))}</span>`
}

/**
 * Format output data as Markdown
 * @param output - Output data
 * @returns Markdown string
 */
function formatOutputAsMarkdown(output: any, level: number = 3): string {
  if (typeof output === "string") {
    return output + "\n\n"
  }

  if (Array.isArray(output)) {
    return output
      .map((item) => `- ${formatOutputAsMarkdown(item, level)}`)
      .join("")
  }

  if (typeof output === "object" && output !== null) {
    let md = ""
    for (const [key, value] of Object.entries(output)) {
      md += `${"#".repeat(level)} ${key}\n\n`
      md += formatOutputAsMarkdown(value, level + 1)
    }
    return md
  }

  return String(output) + "\n\n"
}

/**
 * Format output data as plain text
 * @param output - Output data
 * @param indent - Indentation level
 * @returns Plain text string
 */
function formatOutputAsText(output: any, indent: number = 0): string {
  const spaces = "  ".repeat(indent)

  if (typeof output === "string") {
    return spaces + output + "\n"
  }

  if (Array.isArray(output)) {
    return output
      .map(
        (item, index) =>
          `${spaces}${index + 1}. ${formatOutputAsText(item, indent + 1)}`
      )
      .join("")
  }

  if (typeof output === "object" && output !== null) {
    let text = ""
    for (const [key, value] of Object.entries(output)) {
      text += `${spaces}${key}:\n`
      text += formatOutputAsText(value, indent + 1)
    }
    return text
  }

  return spaces + String(output) + "\n"
}

/**
 * Format duration in human-readable format
 * @param duration - Duration in milliseconds
 * @returns Formatted duration string
 */
function formatDuration(duration?: number): string {
  if (!duration) return "N/A"

  if (duration < 1000) {
    return `${duration}ms`
  }

  const seconds = Math.floor(duration / 1000)
  if (seconds < 60) {
    return `${seconds}s`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

/**
 * Escape HTML special characters
 * @param text - Text to escape
 * @returns Escaped text
 */
function escapeHTML(text: string): string {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

/**
 * Create summary card for result
 * @param result - Analysis result
 * @returns Summary object
 */
export function createSummaryCard(result: AnalysisResult): {
  title: string
  status: string
  duration: string
  preview: string
  score?: number
} {
  const title = result.type.replace(/([A-Z])/g, " $1").trim()
  const status = result.status
  const duration = formatDuration(result.metadata.duration)

  // Extract preview from output
  let preview = "No output available"
  if (result.output) {
    if (typeof result.output === "string") {
      preview = result.output.substring(0, 100) + "..."
    } else if (result.output.summary) {
      preview = result.output.summary.substring(0, 100) + "..."
    } else {
      preview = JSON.stringify(result.output).substring(0, 100) + "..."
    }
  }

  // Extract score if available
  let score: number | undefined
  if (result.output && typeof result.output === "object") {
    score = result.output.score || result.output.rating || result.output.quality
  }

  return { title, status, duration, preview, score }
}

/**
 * Format multiple results as comparison table
 * @param results - Array of results to compare
 * @returns HTML table string
 */
export function formatComparisonTable(results: AnalysisResult[]): string {
  if (results.length === 0) return "<p>No results to compare</p>"

  let html = '<table class="comparison-table">'
  html += "<thead><tr>"
  html += "<th>Type</th><th>Status</th><th>Duration</th><th>Score</th>"
  html += "</tr></thead><tbody>"

  for (const result of results) {
    const summary = createSummaryCard(result)
    html += "<tr>"
    html += `<td>${escapeHTML(summary.title)}</td>`
    html += `<td class="status ${summary.status}">${summary.status}</td>`
    html += `<td>${summary.duration}</td>`
    html += `<td>${summary.score ? summary.score.toFixed(2) : "N/A"}</td>`
    html += "</tr>"
  }

  html += "</tbody></table>"
  return html
}
