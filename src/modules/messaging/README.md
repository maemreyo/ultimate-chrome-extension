# Messaging System Module

A robust messaging system for communication between different parts of your application, supporting pub/sub patterns, request-response, and message queuing.

## Features

- 📨 **Pub/Sub Messaging**: Channel-based publish/subscribe system
- 🔄 **Request-Response**: Async request-response pattern
- 📋 **Message Queuing**: Reliable message delivery with retries
- 🔀 **Message Routing**: Route messages to appropriate handlers
- 🔍 **Message Filtering**: Filter messages by type, sender, or custom criteria
- 🔒 **Secure Messaging**: Optional encryption for sensitive data
- 📊 **Message Statistics**: Track message flow and performance

## Installation

```bash
# No external dependencies required
```

## Usage

### Basic Pub/Sub

```typescript
import { messageBus } from '~modules/messaging';

// Subscribe to a channel
const subscription = messageBus.subscribe('notifications', (message) => {
  console.log('Received notification:', message.payload);
});

// Publish a message
messageBus.publish('notifications', {
  type: 'new_message',
  payload: {
    from: 'user123',
    text: 'Hello world!'
  }
});

// Unsubscribe when done
subscription.unsubscribe();
```

### Using React Hooks

```typescript
import { useMessage } from '~modules/messaging/hooks';

function NotificationComponent() {
  const { messages, publish } = useMessage('notifications');

  // Messages will update when new messages arrive
  console.log(messages);

  const sendNotification = () => {
    publish('new_message', {
      from: 'user123',
      text: 'Hello from React!'
    });
  };

  return (
    <button onClick={sendNotification}>
      Send Notification
    </button>
  );
}
```

### Request-Response Pattern

```typescript
import { useRequest } from '~modules/messaging/hooks';

// In the responder component
function DataProvider() {
  useMessage('data-requests', async (message, respond) => {
    if (message.type === 'get_user') {
      const user = await fetchUser(message.payload.id);
      respond({
        success: true,
        data: user
      });
    }
  });

  return null;
}

// In the requester component
function UserProfile() {
  const { request, response, loading, error } = useRequest('data-requests');

  const fetchUserData = async (userId) => {
    await request('get_user', { id: userId });
    // response will be updated when the response arrives
  };

  return (
    <div>
      {loading ? 'Loading...' : response?.data?.name}
      <button onClick={() => fetchUserData('user123')}>
        Load User
      </button>
    </div>
  );
}
```

### Message Channels

```typescript
import { MessageChannel } from '~modules/messaging';

// Create a dedicated channel
const userChannel = new MessageChannel('user-events', {
  persistent: true,
  maxMessages: 100,
  ttl: 3600000 // 1 hour
});

// Subscribe to specific message types
userChannel.subscribe((message) => {
  if (message.type === 'user_login') {
    // Handle login
  }
}, {
  type: ['user_login', 'user_logout']
});

// Publish to channel
userChannel.publish('user_login', {
  userId: 'user123',
  timestamp: Date.now()
});
```

### Message Queuing

```typescript
import { messageQueue } from '~modules/messaging';

// Add message to queue
await messageQueue.enqueue('data-processing', {
  type: 'process_image',
  payload: {
    imageUrl: 'https://example.com/image.jpg'
  }
}, {
  priority: MessagePriority.HIGH,
  retries: 3
});

// Process queue
messageQueue.process('data-processing', async (message) => {
  try {
    await processImage(message.payload.imageUrl);
    return true; // Success
  } catch (error) {
    return false; // Will retry
  }
});
```

### Broadcasting

```typescript
import { useBroadcast } from '~modules/messaging/hooks';

function BroadcastComponent() {
  const { broadcast, messages } = useBroadcast();

  const sendToAll = () => {
    broadcast('global_announcement', {
      text: 'Important announcement for all components!'
    });
  };

  return (
    <button onClick={sendToAll}>
      Broadcast Message
    </button>
  );
}
```

## API Reference

### Core Services

- `messageBus`: Main messaging service for pub/sub
- `messageRouter`: Routes messages to appropriate handlers
- `messageQueue`: Reliable message delivery with retries

### Message Types

```typescript
interface Message<T = any> {
  id: string;
  channel: string;
  type: string;
  payload: T;
  metadata: MessageMetadata;
  timestamp: number;
}

interface MessageMetadata {
  sender: SenderInfo;
  priority: MessagePriority;
  ttl?: number; // Time to live in ms
  correlationId?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  retryCount?: number;
  encrypted?: boolean;
}

enum MessagePriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  URGENT = 3
}
```

### React Hooks

- `useMessage(channel, handler?)`: Subscribe to messages on a channel
- `useRequest(channel)`: Make request-response calls
- `useBroadcast()`: Broadcast messages to all subscribers
- `useMessageChannel(channelName, options?)`: Create and use a message channel

### Components

- `MessageDebugger`: Debug UI for monitoring message flow
- `MessageSender`: UI component for sending test messages

## Best Practices

1. **Use Channels**: Organize messages by logical channels
2. **Message Types**: Always include a descriptive message type
3. **Error Handling**: Handle message processing errors gracefully
4. **Cleanup**: Always unsubscribe when components unmount
5. **Prioritization**: Use message priorities for important messages
6. **Correlation**: Use correlationId to track related messages

## Advanced Usage

### Message Filtering

```typescript
messageBus.subscribe('events', (message) => {
  console.log('Filtered message:', message);
}, {
  type: ['user_login', 'user_logout'],
  sender: {
    type: 'background'
  },
  custom: (message) => message.payload.importance > 5
});
```

### Secure Messaging

```typescript
// Enable encryption for sensitive channels
const secureChannel = new MessageChannel('secure-data', {
  encrypted: true
});

// Messages will be automatically encrypted/decrypted
secureChannel.publish('sensitive_data', {
  creditCard: '1234-5678-9012-3456'
});
```

### Message Statistics

```typescript
import { messageBus } from '~modules/messaging';

// Get messaging statistics
const stats = messageBus.getStats();
console.log(`Messages sent: ${stats.sent}`);
console.log(`Messages received: ${stats.received}`);
console.log(`Failed messages: ${stats.failed}`);
console.log(`Average processing time: ${stats.avgProcessingTime}ms`);
```
