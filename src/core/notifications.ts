export function setupNotifications() {
  // Request permission if needed
  chrome.notifications.getPermissionLevel((level) => {
    if (level !== "granted") {
      console.log("Notification permission not granted")
    }
  })
  
  // Set up notification handlers
  chrome.notifications.onClicked.addListener((notificationId) => {
    console.log("Notification clicked:", notificationId)
    
    // Handle specific notification types
    if (notificationId.startsWith("update-")) {
      chrome.tabs.create({ url: "tabs/changelog.html" })
    }
  })
  
  chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    console.log("Notification button clicked:", notificationId, buttonIndex)
  })
}

export function showNotification(options: chrome.notifications.NotificationOptions) {
  const id = `notification-${Date.now()}`
  chrome.notifications.create(id, {
    type: "basic",
    iconUrl: chrome.runtime.getURL("assets/icon-128.png"),
    ...options
  })
  return id
}