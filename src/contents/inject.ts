import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_start",
  world: "MAIN"
}

// Type-safe injection
const script = () => {
  // Mark extension as injected
  (window as any).__EXTENSION_INJECTED__ = true
  
  // Expose API to webpage
  (window as any).extensionAPI = {
    version: "1.0.0", // You'll need to pass this from manifest
    sendMessage: async (message: any) => {
      return new Promise((resolve) => {
        window.postMessage({
          source: "extension",
          type: "request",
          payload: message
        }, "*")
        
        const handler = (event: MessageEvent) => {
          if (event.data.source === "extension" && event.data.type === "response") {
            window.removeEventListener("message", handler)
            resolve(event.data.payload)
          }
        }
        
        window.addEventListener("message", handler)
      })
    }
  }
}

// Inject the script
const scriptEl = document.createElement('script')
scriptEl.textContent = `(${script.toString()})()`
document.documentElement.appendChild(scriptEl)
scriptEl.remove()