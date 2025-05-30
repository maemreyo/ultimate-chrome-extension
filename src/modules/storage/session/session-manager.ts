import { z } from 'zod'
import { storageManager } from '../storage-manager'
import { AdvancedStorage } from '../advanced-storage'

export interface Session {
  id: string
  userId?: string
  startedAt: Date
  lastActiveAt: Date
  expiresAt?: Date
  data: Record<string, any>
  device?: {
    browser: string
    os: string
    screen: string
  }
  activities: SessionActivity[]
}

export interface SessionActivity {
  timestamp: Date
  type: 'page_view' | 'action' | 'api_call' | 'error'
  details: Record<string, any>
}

export interface SessionConfig {
  maxDuration?: number // in minutes
  idleTimeout?: number // in minutes
  persistSession?: boolean
  trackActivities?: boolean
  maxActivities?: number
}

export class SessionManager {
  private storage: AdvancedStorage
  private currentSession: Session | null = null
  private config: SessionConfig
  private activityBuffer: SessionActivity[] = []
  private idleTimer: NodeJS.Timer | null = null
  private sessionKey = '__current_session__'

  constructor(config: SessionConfig = {}) {
    this.config = {
      maxDuration: 480, // 8 hours
      idleTimeout: 30, // 30 minutes
      persistSession: true,
      trackActivities: true,
      maxActivities: 1000,
      ...config
    }

    this.storage = storageManager.get()
    this.initialize()
  }

  private async initialize() {
    // Load existing session
    if (this.config.persistSession) {
      const stored = await this.storage.get<Session>(this.sessionKey)
      if (stored && this.isSessionValid(stored)) {
        this.currentSession = stored
        this.startIdleTimer()
      }
    }

    // Listen for activity
    this.setupActivityListeners()
  }

  private setupActivityListeners() {
    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, this.handleUserActivity, { passive: true })
    })

    // Track page visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackActivity('page_view', { action: 'hidden' })
      } else {
        this.trackActivity('page_view', { action: 'visible' })
        this.updateLastActive()
      }
    })

    // Track navigation
    if (chrome.webNavigation) {
      chrome.webNavigation.onCompleted.addListener((details) => {
        if (details.frameId === 0) {
          this.trackActivity('page_view', {
            url: details.url,
            tabId: details.tabId
          })
        }
      })
    }
  }

  private handleUserActivity = () => {
    this.updateLastActive()
    this.resetIdleTimer()
  }

  private startIdleTimer() {
    this.resetIdleTimer()
  }

  private resetIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer)
    }

    if (this.config.idleTimeout) {
      this.idleTimer = setTimeout(() => {
        this.handleIdleTimeout()
      }, this.config.idleTimeout * 60 * 1000)
    }
  }

  private handleIdleTimeout() {
    if (this.currentSession) {
      this.trackActivity('action', { type: 'idle_timeout' })
      this.endSession('idle_timeout')
    }
  }

  async startSession(userId?: string, data?: Record<string, any>): Promise<Session> {
    // End current session if exists
    if (this.currentSession) {
      await this.endSession('new_session')
    }

    const now = new Date()
    const session: Session = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      startedAt: now,
      lastActiveAt: now,
      expiresAt: this.config.maxDuration
        ? new Date(now.getTime() + this.config.maxDuration * 60 * 1000)
        : undefined,
      data: data || {},
      device: this.getDeviceInfo(),
      activities: []
    }

    this.currentSession = session
    await this.saveSession()

    this.startIdleTimer()
    this.trackActivity('action', { type: 'session_start' })

    // Dispatch event
    window.dispatchEvent(new CustomEvent('session-started', { detail: session }))

    return session
  }

  async endSession(reason: string = 'manual'): Promise<void> {
    if (!this.currentSession) return

    this.trackActivity('action', { type: 'session_end', reason })

    // Save final state
    await this.saveSession()

    // Archive session
    await this.archiveSession(this.currentSession)

    // Clear current session
    this.currentSession = null
    await this.storage.delete(this.sessionKey)

    // Clear timers
    if (this.idleTimer) {
      clearTimeout(this.idleTimer)
      this.idleTimer = null
    }

    // Dispatch event
    window.dispatchEvent(new CustomEvent('session-ended', { detail: { reason } }))
  }

  async updateSession(data: Partial<Session['data']>): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session')
    }

    this.currentSession.data = {
      ...this.currentSession.data,
      ...data
    }

    await this.saveSession()
  }

  trackActivity(type: SessionActivity['type'], details: Record<string, any> = {}) {
    if (!this.currentSession || !this.config.trackActivities) return

    const activity: SessionActivity = {
      timestamp: new Date(),
      type,
      details
    }

    this.activityBuffer.push(activity)

    // Batch save activities
    if (this.activityBuffer.length >= 10) {
      this.flushActivities()
    }
  }

  private async flushActivities() {
    if (!this.currentSession || this.activityBuffer.length === 0) return

    this.currentSession.activities.push(...this.activityBuffer)

    // Limit activities
    if (this.config.maxActivities && this.currentSession.activities.length > this.config.maxActivities) {
      this.currentSession.activities = this.currentSession.activities.slice(-this.config.maxActivities)
    }

    this.activityBuffer = []
    await this.saveSession()
  }

  private async saveSession() {
    if (!this.currentSession || !this.config.persistSession) return

    await this.storage.set(this.sessionKey, this.currentSession, ['session'])
  }

  private async archiveSession(session: Session) {
    const archiveKey = `session_archive_${session.id}`
    await this.storage.set(archiveKey, session, ['session', 'archive'])
  }

  private updateLastActive() {
    if (!this.currentSession) return

    this.currentSession.lastActiveAt = new Date()
    this.saveSession()
  }

  private isSessionValid(session: Session): boolean {
    const now = new Date()

    // Check expiration
    if (session.expiresAt && now > new Date(session.expiresAt)) {
      return false
    }

    // Check idle timeout
    if (this.config.idleTimeout) {
      const idleTime = now.getTime() - new Date(session.lastActiveAt).getTime()
      if (idleTime > this.config.idleTimeout * 60 * 1000) {
        return false
      }
    }

    return true
  }

  private getDeviceInfo() {
    return {
      browser: navigator.userAgent,
      os: navigator.platform,
      screen: `${screen.width}x${screen.height}`
    }
  }

  // Public methods
  getCurrentSession(): Session | null {
    return this.currentSession
  }

  isActive(): boolean {
    return this.currentSession !== null && this.isSessionValid(this.currentSession)
  }

  async getSessionHistory(userId?: string, limit: number = 10): Promise<Session[]> {
    const sessions = await this.storage.query<Session>({
      where: userId ? { userId } : undefined,
      orderBy: 'startedAt:desc',
      limit
    })

    return sessions
  }

  async getSessionById(sessionId: string): Promise<Session | null> {
    return this.storage.get(`session_archive_${sessionId}`)
  }

  async clearOldSessions(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const oldSessions = await this.storage.query<Session>({
      where: {
        'metadata.tags': 'archive',
        'startedAt': { $lt: cutoffDate }
      }
    })

    for (const session of oldSessions) {
      await this.storage.delete(`session_archive_${session.id}`)
    }

    return oldSessions.length
  }

  destroy() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer)
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => {
      document.removeEventListener(event, this.handleUserActivity)
    })
  }
}