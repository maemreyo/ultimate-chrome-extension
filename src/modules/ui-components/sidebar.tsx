import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, GripVertical, X } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { cn } from '~lib/utils'
import type { SidebarConfig } from './types'

interface SidebarProps extends SidebarConfig {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

export function Sidebar({
  isOpen,
  onClose,
  children,
  title,
  position = 'right',
  width = 400,
  minWidth = 300,
  maxWidth = 600,
  resizable = true,
  collapsible = true,
  overlay = true,
  pushContent = false,
  className,
  zIndex = 9998
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(
    typeof width === 'number' ? width : parseInt(width)
  )
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Handle resize
  const handleResizeStart = () => {
    setIsResizing(true)
  }

  const handleResize = (event: MouseEvent) => {
    if (!isResizing) return

    const newWidth = position === 'left'
      ? event.clientX
      : window.innerWidth - event.clientX

    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setSidebarWidth(newWidth)
    }
  }

  const handleResizeEnd = () => {
    setIsResizing(false)
  }

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResize)
      document.addEventListener('mouseup', handleResizeEnd)
      document.body.style.cursor = 'ew-resize'
      document.body.style.userSelect = 'none'

      return () => {
        document.removeEventListener('mousemove', handleResize)
        document.removeEventListener('mouseup', handleResizeEnd)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isResizing])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isOpen, onClose])

  const sidebarVariants = {
    open: {
      x: 0,
      width: isCollapsed ? 50 : sidebarWidth,
      transition: { type: 'spring', damping: 30, stiffness: 300 }
    },
    closed: {
      x: position === 'left' ? -sidebarWidth - 50 : sidebarWidth + 50,
      transition: { type: 'spring', damping: 30, stiffness: 300 }
    }
  }

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {isOpen && overlay && !pushContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black"
            style={{ zIndex: zIndex - 1 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={sidebarRef}
            variants={sidebarVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className={cn(
              'fixed top-0 h-full bg-white dark:bg-gray-900 shadow-xl',
              position === 'left' ? 'left-0' : 'right-0',
              className
            )}
            style={{
              zIndex,
              width: isCollapsed ? 50 : sidebarWidth
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              {!isCollapsed && (
                <>
                  <h2 className="text-lg font-semibold">{title}</h2>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              )}
              {collapsible && (
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className={cn(
                    'p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
                    isCollapsed && 'mx-auto'
                  )}
                >
                  {position === 'left' ? (
                    isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />
                  ) : (
                    isCollapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />
                  )}
                </button>
              )}
            </div>

            {/* Content */}
            {!isCollapsed && (
              <div className="flex-1 overflow-y-auto p-4">
                {children}
              </div>
            )}

            {/* Resize Handle */}
            {resizable && !isCollapsed && (
              <div
                className={cn(
                  'absolute top-0 w-1 h-full cursor-ew-resize hover:bg-blue-500 transition-colors',
                  position === 'left' ? 'right-0' : 'left-0'
                )}
                onMouseDown={handleResizeStart}
              >
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <GripVertical className="w-3 h-3 text-gray-400" />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Push content style */}
      {pushContent && isOpen && (
        <style jsx global>{`
          body {
            margin-${position}: ${isCollapsed ? 50 : sidebarWidth}px !important;
            transition: margin 0.3s ease;
          }
        `}</style>
      )}
    </>
  )
}

// Hook for sidebar
export function useSidebar(config?: Partial<SidebarConfig>) {
  const [isOpen, setIsOpen] = useState(false)

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)
  const toggle = () => setIsOpen(!isOpen)

  const SidebarComponent = ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <Sidebar
      {...config}
      isOpen={isOpen}
      onClose={close}
      title={title}
    >
      {children}
    </Sidebar>
  )

  return { isOpen, open, close, toggle, SidebarComponent }
}
