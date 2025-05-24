import "@plasmohq/messaging/background"

import { startHub } from "@plasmohq/messaging/pub-sub"
import { Storage } from "@plasmohq/storage"

import { setupAlarms } from "~core/alarms"
import { setupContextMenus } from "~core/context-menus"
import { setupNotifications } from "~core/notifications"
import { supabase } from "~core/supabase"

console.log("Background service worker started")

// Start messaging hub
startHub()

// Initialize core services
setupAlarms()
setupContextMenus()
setupNotifications()

// Initialize Supabase auth listener
supabase.auth.onAuthStateChange((event, session) => {
  console.log("Auth state changed:", event, session?.user?.email)

  if (event === "SIGNED_IN") {
    // User signed in
    chrome.action.setBadgeText({ text: "" })
  } else if (event === "SIGNED_OUT") {
    // User signed out
    chrome.action.setBadgeText({ text: "!" })
    chrome.action.setBadgeBackgroundColor({ color: "#ef4444" })
  }
})

// Handle extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
  const storage = new Storage()

  if (details.reason === "install") {
    await storage.set("installed_at", new Date().toISOString())

    // Initialize Supabase session
    const {
      data: { session }
    } = await supabase.auth.getSession()
    if (session) {
      console.log("Existing session found:", session.user.email)
    }

    // Open welcome/onboarding page
    chrome.tabs.create({
      url: chrome.runtime.getURL("tabs/welcome.html")
    })
  }
})

// Handle side panel
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error))
