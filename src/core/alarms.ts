import { Storage } from "@plasmohq/storage"
import { apiClient } from "./api"

export function setupAlarms() {
  if (typeof chrome === 'undefined' || !chrome.alarms) return
  
  // Clear existing alarms
  chrome.alarms.clearAll()
  
  // Create periodic alarms
  chrome.alarms.create("sync-data", { periodInMinutes: 30 })
  chrome.alarms.create("cleanup-cache", { periodInMinutes: 60 })
  chrome.alarms.create("check-updates", { periodInMinutes: 720 }) // 12 hours
  chrome.alarms.create("keep-alive", { periodInMinutes: 1 })
  
  // Handle alarms
  chrome.alarms.onAlarm.addListener(handleAlarm)
}

async function handleAlarm(alarm: chrome.alarms.Alarm) {
  console.log(`Alarm triggered: ${alarm.name}`)
  
  switch (alarm.name) {
    case "sync-data":
      await syncData()
      break
    case "cleanup-cache":
      await cleanupCache()
      break
    case "check-updates":
      await checkForUpdates()
      break
    case "keep-alive":
      // Just a ping to keep service worker alive
      console.log("Keep-alive ping")
      break
  }
}

async function syncData() {
  const storage = new Storage()
  const settings = await storage.get("settings")
  
  // Check if settings exists and has autoSync property
  if (!settings || typeof settings !== 'object' || !('autoSync' in settings)) {
    console.log("Settings not properly initialized")
    return
  }
  
  if (!settings.autoSync) return
  
  try {
    // Sync data with backend
    const response = await apiClient.request({
      endpoint: "/sync",
      method: "POST",
      data: {
        lastSync: await storage.get("lastSync") || null
      }
    })
    
    await storage.set("lastSync", new Date().toISOString())
    console.log("Data synced successfully")
  } catch (error) {
    console.error("Sync failed:", error)
  }
}

async function cleanupCache() {
  const storage = new Storage()
  const cache = await storage.get("cache") || {}
  const now = Date.now()
  const ONE_DAY = 24 * 60 * 60 * 1000
  
  // Remove cache entries older than 1 day
  const cleanedCache = Object.entries(cache).reduce((acc, [key, value]: [string, any]) => {
    if (value.timestamp && now - value.timestamp < ONE_DAY) {
      acc[key] = value
    }
    return acc
  }, {} as Record<string, any>)
  
  await storage.set("cache", cleanedCache)
  console.log("Cache cleaned")
}

async function checkForUpdates() {
  try {
    const currentVersion = chrome.runtime.getManifest().version
    const response = await fetch("https://api.yourdomain.com/extension/version")
    const { latestVersion } = await response.json()
    
    if (latestVersion && latestVersion !== currentVersion) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: chrome.runtime.getURL("assets/icon-128.png"),
        title: "Update Available",
        message: `A new version (${latestVersion}) is available!`
      })
    }
  } catch (error) {
    console.error("Update check failed:", error)
  }
}