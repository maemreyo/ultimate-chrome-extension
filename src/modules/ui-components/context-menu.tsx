import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '~lib/utils'
import type { ContextMenuItem, Position } from './types'

interface ContextMenuProps {
  items: ContextMenuItem[]
  position: Position
  onClose: () => void
  className?: string
}

export function ContextMenu({ items, position, onClose, className }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [adjustedPosition, setAdjustedPosition] = useState(position)
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let x = position.x
      let y = position.y

      // Adjust horizontal position
      if (x + rect.width > viewportWidth) {
        x = viewportWidth - rect.width - 10
      }

      // Adjust vertical position
      if (y + rect.height > viewportHeight) {
        y = viewportHeight - rect.height - 10
      }

      setAdjustedPosition({ x, y })
    }
  }, [position])

  const handleItemClick = (item: ContextMenuItem) => {
    if (!item.disabled && !item.children) {
      item.onClick?.()
      onClose()
    }
  }

  const renderMenuItem = (item: ContextMenuItem, index: number) => {
    if (item.separator) {
      return <div key={item.id || index} className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
    }

    const hasChildren = item.children && item.children.length > 0

    return (
      <div
        key={item.id || index}
        className={cn(
          'relative px-3 py-2 text-sm cursor-pointer rounded-md transition-colors',
          'hover:bg-gray-100 dark:hover:bg-gray-700',
          item.disabled && 'opacity-50 cursor-not-allowed',
          item.danger && 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
        )}
        onClick={() => handleItemClick(item)}
        onMouseEnter={() => hasChildren && setActiveSubmenu(item.id)}
        onMouseLeave={() => hasChildren && setActiveSubmenu(null)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {item.icon && <span className="w-4 h-4">{item.icon}</span>}
            <span>{item.label}</span>
          </div>
          <div className="flex items-center gap-2">
            {item.shortcut && (
              <span className="text-xs text-gray-500 dark:text-gray-400">{item.shortcut}</span>
            )}
            {hasChildren && <ChevronRight className="w-4 h-4" />}
          </div>
        </div>

        {/* Submenu */}
        {hasChildren && activeSubmenu === item.id && (
          <div
            className={cn(
              'absolute left-full top-0 ml-1 min-w-[200px]',
              'bg-white dark:bg-gray-800 rounded-lg shadow-lg',
              'border border-gray-200 dark:border-gray-700 p-1'
            )}
          >
            {item.children.map((child, idx) => renderMenuItem(child, idx))}
          </div>
        )}
      </div>
    )
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.1 }}
        style={{
          position: 'fixed',
          left: adjustedPosition.x,
          top: adjustedPosition.y,
          zIndex: 10000
        }}
        className={cn(
          'min-w-[200px] bg-white dark:bg-gray-800 rounded-lg shadow-lg',
          'border border-gray-200 dark:border-gray-700 p-1',
          className
        )}
      >
        {items.map((item, index) => renderMenuItem(item, index))}
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}

// Hook for context menu
export function useContextMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 })
  const [items, setItems] = useState<ContextMenuItem[]>([])

  const open = (event: MouseEvent, menuItems: ContextMenuItem[]) => {
    event.preventDefault()
    setPosition({ x: event.clientX, y: event.clientY })
    setItems(menuItems)
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
  }

  const ContextMenuComponent = () =>
    isOpen ? <ContextMenu items={items} position={position} onClose={close} /> : null

  return { open, close, ContextMenuComponent }
}
