import { Storage } from "@plasmohq/storage"

export function setupContextMenus() {
  if (typeof chrome === "undefined" || !chrome.contextMenus) return

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
        if (info.selectionText && tab) {
          handleSaveSelection(info.selectionText, tab)
        }
        break
      case "analyze-page":
        if (tab) {
          handleAnalyzePage(tab)
        }
        break
      case "extract-images":
        if (tab) {
          handleExtractImages(tab)
        }
        break
    }
  })
}

async function handleSaveSelection(text: string, tab: chrome.tabs.Tab) {
  const storage = new Storage()
  const saved = (await storage.get("saved-selections")) || []
  saved.push({
    text,
    url: tab.url || "",
    title: tab.title || "",
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

async function handleAnalyzePage(tab: chrome.tabs.Tab) {
  if (!tab.id) return

  // Inject analysis script
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      // Analyze page function
      const analysis = {
        title: document.title,
        url: window.location.href,
        headings: Array.from(document.querySelectorAll("h1, h2, h3")).map(
          (h) => h.textContent
        ),
        images: Array.from(document.querySelectorAll("img")).map(
          (img) => img.src
        ),
        links: Array.from(document.querySelectorAll("a[href]")).map(
          (a) => a.href
        )
      }

      // Send to extension
      chrome.runtime.sendMessage({
        action: "page-analyzed",
        data: analysis
      })
    }
  })

  // Open analysis tab
  chrome.tabs.create({
    url: chrome.runtime.getURL(`tabs/analysis.html?tabId=${tab.id}`)
  })
}

async function handleExtractImages(tab: chrome.tabs.Tab) {
  if (!tab.id) return

  // Extract images from the page
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const images = Array.from(document.querySelectorAll("img"))
        .map((img) => ({
          src: img.src,
          alt: img.alt,
          width: img.naturalWidth,
          height: img.naturalHeight
        }))
        .filter((img) => img.src && img.width > 100 && img.height > 100)

      return images
    }
  })

  if (results[0]?.result) {
    const images = results[0].result

    // Store extracted images
    const storage = new Storage()
    await storage.set("extracted-images", {
      url: tab.url,
      title: tab.title,
      images,
      timestamp: Date.now()
    })

    // Open images viewer
    chrome.tabs.create({
      url: chrome.runtime.getURL("tabs/images.html")
    })
  }
}
