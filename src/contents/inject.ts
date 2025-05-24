import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_start",
  world: "MAIN"
}

// Inject into main world
window.__EXTENSION_INJECTED__ = true

// Expose API to webpage
window.extensionAPI = {
  version: chrome.runtime.getManifest().version,
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