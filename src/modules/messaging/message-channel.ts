import { Channel, ChannelOptions, Message, SubscriptionHandler, MessageFilter } from './types'
import { messageBus } from './message-bus'

export class MessageChannel {
  private channel: Channel

  constructor(name: string, options?: ChannelOptions) {
    this.channel = messageBus.createChannel(name, options) || messageBus.getChannel(name)!
  }

  subscribe<T = any>(
    handler: SubscriptionHandler<T>,
    filter?: MessageFilter
  ) {
    return messageBus.subscribe(this.channel.name, handler, filter)
  }

  async publish<T = any>(
    type: string,
    payload: T,
    options?: any
  ): Promise<void> {
    return messageBus.publish(this.channel.name, type, payload, options)
  }

  async request<T = any, R = any>(
    type: string,
    payload: T,
    timeout?: number
  ): Promise<R> {
    return messageBus.request<T, R>(this.channel.name, type, payload, timeout)
  }

  getHistory(limit?: number): Message[] {
    return messageBus.getHistory(this.channel.name, limit)
  }

  destroy() {
    messageBus.deleteChannel(this.channel.name)
  }
}