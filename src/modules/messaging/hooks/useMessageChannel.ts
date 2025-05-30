import { useRef, useEffect } from 'react'
import { MessageChannel } from '../message-channel'
import { ChannelOptions } from '../types'

export function useMessageChannel(name: string, options?: ChannelOptions) {
  const channelRef = useRef<MessageChannel | null>(null)

  useEffect(() => {
    channelRef.current = new MessageChannel(name, options)

    return () => {
      channelRef.current?.destroy()
    }
  }, [name])

  return channelRef.current!
}