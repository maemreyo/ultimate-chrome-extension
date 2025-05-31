import React, { createContext, useContext, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { NotificationConfig } from './types'
import { cn } from '~lib/utils'

interface NotificationContextValue {
  notify: (config: NotificationConfig) => void
  dismiss: (id: string) => void
  dismissAll: () => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationConfig[]>([])

  const notify = useCallback((config: NotificationConfig) => {
    const id = config.id || Date.now().toString()
    const notification = { ...config, id }

    setNotifications(prev => [...prev, notification])

    if (config.duration !== 0) {
      setTimeout(() => {
        dismiss(id)
      }, config.duration || 5000)
    }
  }, [])

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const dismissAll = useCallback(() => {
    setNotifications([])
  }, [])

  return (
    <NotificationContext.Provider value={{ notify, dismiss, dismissAll }}>
      {children}
      <NotificationContainer notifications={notifications} onDismiss={dismiss} />
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

interface NotificationContainerProps {
  notifications: NotificationConfig[]
  onDismiss: (id: string) => void
}

function NotificationContainer({ notifications, onDismiss }: NotificationContainerProps) {
  const positions = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
  }

  // Group notifications by position
  const groupedNotifications = notifications.reduce((acc, notification) => {
    const position = notification.position || 'top-right'
    if (!acc[position]) acc[position] = []
    acc[position].push(notification)
    return acc
  }, {} as Record<string, NotificationConfig[]>)

  return createPortal(
    <>
      {Object.entries(groupedNotifications).map(([position, items]) => (
        <div
          key={position}
          className={cn('fixed z-[10001]', positions[position as keyof typeof positions])}
        >
          <AnimatePresence>
            {items.map((notification) => (
              <Notification
                key={notification.id}
                notification={notification}
                onDismiss={() => onDismiss(notification.id!)}
              />
            ))}
          </AnimatePresence>
        </div>
      ))}
    </>,
    document.body
  )
}

interface NotificationProps {
  notification: NotificationConfig
  onDismiss: () => void
}

function Notification({ notification, onDismiss }: NotificationProps) {
  const icons = {
    info: <Info className="w-5 h-5 text-blue-500" />,
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />
  }

  const bgColors = {
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
  }

  const type = notification.type || 'info'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={cn(
        'mb-4 p-4 rounded-lg shadow-lg border',
        'bg-white dark:bg-gray-800',
        bgColors[type],
        'min-w-[300px] max-w-[500px]'
      )}
    >
      <div className="flex items-start gap-3">
        {notification.icon || icons[type]}

        <div className="flex-1">
          {notification.title && (
            <h4 className="font-semibold mb-1">{notification.title}</h4>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {notification.message}
          </p>

          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              {notification.action.label}
            </button>
          )}
        </div>

        {notification.closable !== false && (
          <button
            onClick={onDismiss}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

// Simple toast-style notifications
export function toast(message: string, type: NotificationConfig['type'] = 'info') {
  // This is a standalone function that requires NotificationProvider to be set up
  const event = new CustomEvent('extension-notification', {
    detail: { message, type }
  })
  window.dispatchEvent(event)
}

// Notification listener component
export function NotificationListener() {
  const { notify } = useNotifications()

  React.useEffect(() => {
    const handler = (event: CustomEvent) => {
      notify({
        message: event.detail.message,
        type: event.detail.type,
        position: 'bottom-center'
      })
    }

    window.addEventListener('extension-notification' as any, handler)
    return () => window.removeEventListener('extension-notification' as any, handler)
  }, [notify])

  return null
}