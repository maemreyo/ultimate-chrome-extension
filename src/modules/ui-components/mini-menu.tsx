import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '~lib/utils'

interface MiniMenuItem {
  id: string
  label: string
  icon?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  selected?: boolean
}

interface MiniMenuProps {
  items: MiniMenuItem[]
  trigger?: React.ReactNode
  label?: string
  className?: string
  position?: 'bottom' | 'top' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  offset?: number
}

export function MiniMenu({
  items,
  trigger,
  label,
  className,
  position = 'bottom',
  align = 'start',
  offset = 8
}: MiniMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        triggerRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const positionClasses = {
    bottom: `top-full mt-${offset / 4}`,
    top: `bottom-full mb-${offset / 4}`,
    left: `right-full mr-${offset / 4}`,
    right: `left-full ml-${offset / 4}`
  }

  const alignClasses = {
    start: position === 'bottom' || position === 'top' ? 'left-0' : 'top-0',
    center: position === 'bottom' || position === 'top' ? 'left-1/2 -translate-x-1/2' : 'top-1/2 -translate-y-1/2',
    end: position === 'bottom' || position === 'top' ? 'right-0' : 'bottom-0'
  }

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1 px-3 py-2 rounded-md transition-colors',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          isOpen && 'bg-gray-100 dark:bg-gray-800',
          className
        )}
      >
        {trigger || (
          <>
            {label && <span className="text-sm">{label}</span>}
            <ChevronDown className={cn(
              'w-4 h-4 transition-transform',
              isOpen && 'rotate-180'
            )} />
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className={cn(
              'absolute z-50 min-w-[150px] py-1',
              'bg-white dark:bg-gray-800 rounded-md shadow-lg',
              'border border-gray-200 dark:border-gray-700',
              positionClasses[position],
              alignClasses[align]
            )}
          >
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick?.()
                    setIsOpen(false)
                  }
                }}
                disabled={item.disabled}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm transition-colors',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  item.selected && 'bg-gray-100 dark:bg-gray-700 font-medium'
                )}
              >
                <div className="flex items-center gap-2">
                  {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                  <span>{item.label}</span>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}