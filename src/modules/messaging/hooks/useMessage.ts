import { useState, useEffect, useCallback, useRef } from 'react'
import { messageBus } from '../message-bus'
import { Message, MessageFilter, SubscriptionHandler } from '../types'

export function useMessage<T = any>(
  channel: string,
  filter?: MessageFilter
) {
  const [messages, setMessages] = useState<Message<T>[]>([])
  const [lastMessage, setLastMessage] = useState<Message<T> | null>(null)
  const subscriptionRef = useRef<any>(null)

  useEffect(() => {
    const handler: SubscriptionHandler<T> = (message) => {
      setMessages(prev => [...prev, message])
      setLastMessage(message)
    }

    // Create channel if it doesn't exist
    if (!messageBus.getChannel(channel)) {
      messageBus.createChannel(channel)
    }

    subscriptionRef.current = messageBus.subscribe(channel, handler, filter)

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [channel, filter])

  const sendMessage = useCallback(async (type: string, payload: T, options?: any) => {
    await messageBus.publish(channel, type, payload, options)
  }, [channel])

  const clearMessages = useCallback(() => {
    setMessages([])
    setLastMessage(null)
  }, [])

  return {
    messages,
    lastMessage,
    sendMessage,
    clearMessages
  }
}