import { Storage } from "@plasmohq/storage"

export function setupAlarms() {
  // Clear existing alarms
  chrome.alarms.clearAll()
  
  // Create periodic alarms
  chrome.alarms.create("sync-data", { periodInMinutes: 30 })
  chrome.alarms.create("cleanup-cache", { periodInMinutes: 60 })
  chrome.alarms.create("check-updates", { periodInMinutes: 720 }) // 12 hours
  
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
  }
}

async function syncData() {
  const storage = new Storage()
  const settings = await storage.get("settings")
  
  if (!settings?.autoSync) return
  
  // Sync logic here
  console.log("Syncing data...")
}