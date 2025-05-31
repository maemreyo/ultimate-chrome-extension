import { ReactNode } from "react"

export interface Position {
  x: number
  y: number
}

export interface Rect {
  top: number
  left: number
  width: number
  height: number
  right: number
  bottom: number
}

export interface FloatingIconConfig {
  icon: ReactNode
  tooltip?: string
  onClick?: () => void
  onHover?: () => void
  position?: "left" | "right"
  offset?: number
  showOn?: "hover" | "always" | "selection"
  className?: string
  delay?: number
}

export interface ContextMenuItem {
  id: string
  label: string
  icon?: ReactNode
  shortcut?: string
  disabled?: boolean
  danger?: boolean
  separator?: boolean
  onClick?: () => void
  children?: ContextMenuItem[]
}

export interface SidebarConfig {
  position?: "left" | "right"
  width?: number | string
  minWidth?: number
  maxWidth?: number
  resizable?: boolean
  collapsible?: boolean
  defaultCollapsed?: boolean
  overlay?: boolean
  pushContent?: boolean
  className?: string
  zIndex?: number
}

export interface NotificationConfig {
  id?: string
  title?: string
  message: string
  type?: "info" | "success" | "warning" | "error"
  duration?: number
  closable?: boolean
  action?: {
    label: string
    onClick: () => void
  }
  icon?: ReactNode
  position?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "top-center"
    | "bottom-center"
}

// Re-export from mini-menu.tsx
export { MiniMenuItem } from "./mini-menu"

// Re-export from loading-states.tsx
export { LoadingProps } from "./loading-states"
