import { Storage } from "@plasmohq/storage"

export function setupContextMenus() {
  // Remove existing menus
  chrome.contextMenus.removeAll()
  
  // Create context menu items
  chrome.contextMenus.create({
    id: "save-selection",
    title: "Save to Extension",
    contexts: ["selection"]
  })
  
  chrome.contextMenus.create({
    id: "separator-1",
    type: "separator",
    contexts: ["selection"]
  })
  
  chrome.contextMenus.create({
    id: "analyze-page",
    title: "Analyze Page",
    contexts: ["page"]
  })
  
  chrome.contextMenus.create({
    id: "extract-images",
    title: "Extract All Images",
    contexts: ["page"]
  })
  
  // Handle clicks
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
      case "save-selection":
        handleSaveSelection(info.selectionText, tab)
        break
      case "analyze-page":
        handleAnalyzePage(tab)
        break
      case "extract-images":
        handleExtractImages(tab)
        break
    }
  })
}

async function handleSaveSelection(text: string, tab: chrome.tabs.Tab) {
  // Save selected text
  const storage = new Storage()
  const saved = await storage.get("saved-selections") || []
  saved.push({
    text,
    url: tab.url,
    title: tab.title,
    timestamp: Date.now()
  })
  await storage.set("saved-selections", saved)
  
  // Show notification
  chrome.notifications.create({
    type: "basic",
    iconUrl: chrome.runtime.getURL("assets/icon-128.png"),
    title: "Text Saved!",
    message: `Saved "${text.substring(0, 50)}..." from ${tab.title}`
  })
}