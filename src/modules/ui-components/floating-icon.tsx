import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '~lib/utils'
import type { FloatingIconConfig, Position } from './types'

interface FloatingIconProps extends FloatingIconConfig {
  targetElement: HTMLElement | null
  isVisible?: boolean
}

export function FloatingIcon({
  targetElement,
  icon,
  tooltip,
  onClick,
  onHover,
  position = 'left',
  offset = 20,
  showOn = 'hover',
  className,
  delay = 300,
  isVisible: externalIsVisible
}: FloatingIconProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [iconPosition, setIconPosition] = useState<Position>({ x: 0, y: 0 })
  const timeoutRef = useRef<NodeJS.Timeout>()
  const iconRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!targetElement) return

    const updatePosition = () => {
      const rect = targetElement.getBoundingClientRect()
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

      const x = position === 'left'
        ? rect.left + scrollLeft - offset - 40 // 40 is icon width
        : rect.right + scrollLeft + offset

      const y = rect.top + scrollTop + (rect.height / 2) - 20 // Center vertically

      setIconPosition({ x, y })
    }

    const handleMouseEnter = () => {
      if (showOn === 'hover') {
        timeoutRef.current = setTimeout(() => {
          setIsVisible(true)
          updatePosition()
        }, delay)
      }
    }

    const handleMouseLeave = () => {
      if (showOn === 'hover') {
        clearTimeout(timeoutRef.current)
        setIsVisible(false)
      }
    }

    const handleSelection = () => {
      if (showOn === 'selection') {
        const selection = window.getSelection()
        if (selection && selection.toString().trim() && targetElement.contains(selection.anchorNode)) {
          updatePosition()
          setIsVisible(true)
        } else {
          setIsVisible(false)
        }
      }
    }

    // Event listeners
    targetElement.addEventListener('mouseenter', handleMouseEnter)
    targetElement.addEventListener('mouseleave', handleMouseLeave)

    if (showOn === 'selection') {
      document.addEventListener('selectionchange', handleSelection)
    }

    // Update position on scroll/resize
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    // Initial setup
    if (showOn === 'always') {
      setIsVisible(true)
      updatePosition()
    }

    return () => {
      clearTimeout(timeoutRef.current)
      targetElement.removeEventListener('mouseenter', handleMouseEnter)
      targetElement.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('selectionchange', handleSelection)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [targetElement, position, offset, showOn, delay])

  // Handle external visibility control
  useEffect(() => {
    if (externalIsVisible !== undefined) {
      setIsVisible(externalIsVisible)
    }
  }, [externalIsVisible])

  const portalElement = useMemo(() => {
    const container = document.getElementById('extension-portal-container')
    if (container) return container

    const newContainer = document.createElement('div')
    newContainer.id = 'extension-portal-container'
    document.body.appendChild(newContainer)
    return newContainer
  }, [])

  if (!targetElement) return null

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={iconRef}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'absolute',
            left: iconPosition.x,
            top: iconPosition.y,
            zIndex: 9999
          }}
          className={cn(
            'flex items-center justify-center w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg cursor-pointer hover:shadow-xl transition-shadow',
            className
          )}
          onClick={onClick}
          onMouseEnter={onHover}
        >
          {icon}
          {tooltip && (
            <div className="absolute bottom-full mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
              {tooltip}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    portalElement
  )
}

// Hook for easy usage
export function useFloatingIcon(config: FloatingIconConfig) {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)

  const attach = (element: HTMLElement) => {
    setTargetElement(element)
  }

  const detach = () => {
    setTargetElement(null)
  }

  const FloatingIconComponent = () => (
    <FloatingIcon {...config} targetElement={targetElement} />
  )

  return { attach, detach, FloatingIconComponent }
}
