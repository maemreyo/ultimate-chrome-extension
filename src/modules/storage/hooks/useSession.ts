import { useState, useEffect } from 'react'
import { SessionManager, Session } from '../session/session-manager'

let sessionManager: SessionManager | null = null

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (!sessionManager) {
      sessionManager = new SessionManager()
    }

    // Get current session
    const current = sessionManager.getCurrentSession()
    setSession(current)
    setIsActive(sessionManager.isActive())

    // Listen for session changes
    const handleSessionStart = (event: CustomEvent<Session>) => {
      setSession(event.detail)
      setIsActive(true)
    }

    const handleSessionEnd = () => {
      setSession(null)
      setIsActive(false)
    }

    window.addEventListener('session-started', handleSessionStart as EventListener)
    window.addEventListener('session-ended', handleSessionEnd)

    return () => {
      window.removeEventListener('session-started', handleSessionStart as EventListener)
      window.removeEventListener('session-ended', handleSessionEnd)
    }
  }, [])

  return {
    session,
    isActive,
    startSession: (userId?: string, data?: any) => sessionManager!.startSession(userId, data),
    endSession: (reason?: string) => sessionManager!.endSession(reason),
    updateSession: (data: any) => sessionManager!.updateSession(data),
    trackActivity: (type: any, details?: any) => sessionManager!.trackActivity(type, details)
  }
}