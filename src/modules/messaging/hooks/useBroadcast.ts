import { useCallback } from 'react'
import { messageBus } from '../message-bus'
import { MessageMetadata } from '../types'

export function useBroadcast() {
  const broadcast = useCallback(async <T = any>(
    type: string,
    payload: T,
    options?: Partial<MessageMetadata>
  ) => {
    await messageBus.broadcast(type, payload, options)
  }, [])

  return broadcast
}