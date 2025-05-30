export interface Message<T = any> {
  id: string
  channel: string
  type: string
  payload: T
  metadata: MessageMetadata
  timestamp: number
}

export interface MessageMetadata {
  sender: SenderInfo
  priority: MessagePriority
  ttl?: number // Time to live in ms
  correlationId?: string
  replyTo?: string
  headers?: Record<string, string>
  retryCount?: number
  encrypted?: boolean
}

export interface SenderInfo {
  id: string
  type: 'background' | 'content' | 'popup' | 'options' | 'devtools' | 'tab'
  tabId?: number
  frameId?: number
  url?: string
}

export enum MessagePriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  URGENT = 3
}

export interface Channel {
  name: string
  description?: string
  options: ChannelOptions
  subscribers: Set<SubscriptionHandler>
  messageCount: number
  createdAt: Date
}

export interface ChannelOptions {
  persistent?: boolean
  maxMessages?: number
  ttl?: number
  exclusive?: boolean
  encrypted?: boolean
  allowedSenders?: SenderInfo['type'][]
}

export type SubscriptionHandler<T = any> = (message: Message<T>) => void | Promise<void>

export interface Subscription {
  id: string
  channel: string
  handler: SubscriptionHandler
  filter?: MessageFilter
  unsubscribe: () => void
}

export interface MessageFilter {
  type?: string | string[]
  sender?: Partial<SenderInfo>
  metadata?: Partial<MessageMetadata>
  custom?: (message: Message) => boolean
}

export interface QueuedMessage extends Message {
  attempts: number
  nextRetry?: number
  error?: Error
}

export interface QueueOptions {
  maxRetries?: number
  retryDelay?: number
  retryBackoff?: 'linear' | 'exponential'
  deadLetterQueue?: string
  persistent?: boolean
}

export interface MessageRequest<T = any, R = any> {
  channel: string
  type: string
  payload: T
  timeout?: number
  priority?: MessagePriority
}

export interface MessageResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export interface MessageStats {
  sent: number
  received: number
  failed: number
  queued: number
  avgProcessingTime: number
  channelStats: Map<string, ChannelStats>
}

export interface ChannelStats {
  messageCount: number
  subscriberCount: number
  lastActivity: Date
  errorRate: number
}