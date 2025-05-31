export { useFloatingIcon } from './floating-icon'
export { useContextMenu } from './context-menu'
export { useSidebar } from './sidebar'
export { useNotifications } from './notifications'

// Re-export common hook
export function useExtensionUI() {
  const notifications = useNotifications()
  const contextMenu = useContextMenu()
  const sidebar = useSidebar()

  return {
    notifications,
    contextMenu,
    sidebar
  }
}