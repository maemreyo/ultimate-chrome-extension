# Enhanced Storage Module Documentation

## Overview

The Enhanced Storage Module extends the Advanced Storage System with three powerful sub-modules:

1. **Session Manager** - Track user sessions and activities
2. **History Manager** - Maintain searchable history with timeline view
3. **Settings Store** - Type-safe settings management with validation

## 📦 Installation

Add the following dependencies:

```json
{
  "dependencies": {
    "zod": "^3.22.4",
    "date-fns": "^2.30.0"
  }
}
```

## 🎯 Session Manager

### Features
- Automatic session tracking
- Activity monitoring
- Idle timeout detection
- Device information capture
- Session archiving

### Basic Usage

```typescript
import { SessionManager } from '~modules/storage/session'

// Initialize
const sessionManager = new SessionManager({
  maxDuration: 480,     // 8 hours
  idleTimeout: 30,      // 30 minutes
  persistSession: true,
  trackActivities: true,
  maxActivities: 1000
})

// Start a session
const session = await sessionManager.startSession(userId, {
  source: 'login',
  device: 'desktop'
})

// Track activities
sessionManager.trackActivity('page_view', {
  url: window.location.href,
  title: document.title
})

// End session
await sessionManager.endSession('logout')
```

### React Hook Usage

```typescript
import { useSession } from '~modules/storage/hooks'

function MyComponent() {
  const {
    session,
    isActive,
    startSession,
    endSession,
    trackActivity
  } = useSession()

  // Auto-tracking on mount
  useEffect(() => {
    trackActivity('component_view', { name: 'MyComponent' })
  }, [])

  return (
    <div>
      {isActive ? (
        <p>Session active for {session.duration}</p>
      ) : (
        <button onClick={() => startSession()}>Start Session</button>
      )}
    </div>
  )
}
```

### Session Viewer Component

```typescript
import { SessionViewer } from '~modules/storage/components'

// Complete session management UI
<SessionViewer />
```

## 📚 History Manager

### Features
- Searchable history
- Timeline grouping
- Export/Import functionality
- Activity statistics
- Tag-based filtering

### Basic Usage

```typescript
import { HistoryManager } from '~modules/storage/history'

const historyManager = new HistoryManager({
  maxItems: 10000,
  groupByTime: true
})

// Add history item
await historyManager.addItem({
  type: 'analysis',
  title: 'Fact check performed',
  description: 'Checked claim about climate change',
  url: 'https://example.com/article',
  data: {
    claimCount: 5,
    verifiedCount: 3
  },
  metadata: {
    duration: 1500,
    status: 'success',
    tags: ['climate', 'fact-check']
  }
})

// Search history
const results = await historyManager.searchHistory('climate')

// Get timeline view
const timeline = await historyManager.getTimeline(7) // Last 7 days

// Get statistics
const stats = await historyManager.getStats(30) // Last 30 days
```

### React Hook Usage

```typescript
import { useHistory } from '~modules/storage/hooks'

function HistoryComponent() {
  const {
    items,
    loading,
    addItem,
    searchHistory,
    getTimeline,
    exportHistory
  } = useHistory()

  const handleAction = async () => {
    await addItem({
      type: 'action',
      title: 'User clicked button',
      data: { timestamp: Date.now() }
    })
  }

  const handleExport = async () => {
    const blob = await exportHistory()
    // Download blob
  }
}
```

### History Timeline Component

```typescript
import { HistoryTimeline } from '~modules/storage/components'

// Full-featured history UI with timeline, stats, and search
<HistoryTimeline />
```

## ⚙️ Settings Store

### Features
- Schema validation with Zod
- Change event system
- Import/Export settings
- Nested key support
- Type-safe access

### Schema Definition

```typescript
import { z } from 'zod'

// Define your settings schema
const SettingsSchema = z.object({
  appearance: z.object({
    theme: z.enum(['light', 'dark', 'system']),
    fontSize: z.enum(['small', 'medium', 'large']),
    compactMode: z.boolean(),
    animations: z.boolean()
  }),
  notifications: z.object({
    enabled: z.boolean(),
    sound: z.boolean(),
    types: z.record(z.boolean())
  }),
  privacy: z.object({
    trackingEnabled: z.boolean(),
    storageEncryption: z.boolean()
  })
})
```

### Basic Usage

```typescript
import { SettingsStore } from '~modules/storage/settings'

const settings = new SettingsStore()

// Load settings
await settings.load()

// Get value
const theme = settings.get('appearance.theme')

// Set value
await settings.set('appearance.theme', 'dark')

// Update multiple values
await settings.update({
  appearance: { theme: 'dark', compactMode: true }
})

// Subscribe to changes
const unsubscribe = settings.subscribe('appearance.theme', (event) => {
  console.log(`Theme changed from ${event.oldValue} to ${event.newValue}`)
})

// Reset to defaults
await settings.reset('appearance')
```

### React Hook Usage

```typescript
import { useSettings } from '~modules/storage/hooks'

function SettingsComponent() {
  const { value, update, reset, subscribe } = useSettings('appearance')

  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      console.log('Settings changed:', event)
    })
    return unsubscribe
  }, [])

  return (
    <div>
      <select
        value={value?.theme}
        onChange={(e) => update({ ...value, theme: e.target.value })}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </div>
  )
}
```

### Settings Editor Component

```typescript
import { SettingsEditor } from '~modules/storage/components'

// Complete settings management UI
<SettingsEditor />
```

## 🎨 Complete Integration Example

```typescript
// src/options/storage-page.tsx
import { StorageProvider } from '~modules/storage'
import {
  StorageManagerUI,
  SessionViewer,
  HistoryTimeline,
  SettingsEditor
} from '~modules/storage/components'

export function StoragePage() {
  return (
    <StorageProvider config={{
      encryption: { enabled: true },
      compression: { enabled: true },
      versioning: { enabled: true, maxVersions: 10 }
    }}>
      <div className="space-y-8">
        {/* Main storage management */}
        <StorageManagerUI />

        {/* Session tracking */}
        <SessionViewer />

        {/* History timeline */}
        <HistoryTimeline />

        {/* Settings editor */}
        <SettingsEditor />
      </div>
    </StorageProvider>
  )
}
```

## 🔄 Data Flow

```
User Action → Session Tracking → History Recording → Storage
     ↓              ↓                    ↓              ↓
  Settings     Activity Log        Timeline View    Encrypted
```

## 🛡️ Best Practices

### 1. Session Management
- Start sessions on extension activation
- Track meaningful activities only
- Clean up old sessions periodically
- Use session data for analytics

### 2. History Management
- Set reasonable maxItems limit
- Use tags for better organization
- Export history before major updates
- Implement data retention policies

### 3. Settings Management
- Define clear schemas
- Provide migration paths
- Validate on import
- Use change events sparingly

## 🧪 Testing

```typescript
// Mock for tests
jest.mock('~modules/storage/session', () => ({
  SessionManager: jest.fn().mockImplementation(() => ({
    startSession: jest.fn(),
    endSession: jest.fn(),
    trackActivity: jest.fn()
  }))
}))

// Test example
describe('Session Tracking', () => {
  it('should track page views', async () => {
    const manager = new SessionManager()
    await manager.startSession()

    manager.trackActivity('page_view', { url: '/test' })

    const session = manager.getCurrentSession()
    expect(session.activities).toHaveLength(1)
  })
})
```

## 🚀 Performance Tips

1. **Batch Operations**: Group multiple history items
2. **Debounce Settings**: Avoid too many saves
3. **Limit Activities**: Don't track every mouse move
4. **Archive Old Data**: Move old sessions to archive
5. **Index History**: Use tags for faster search

## 📊 Analytics Integration

```typescript
// Track user behavior
const analytics = {
  async trackEvent(event: string, data: any) {
    // Add to history
    await historyManager.addItem({
      type: 'action',
      title: event,
      data
    })

    // Track in session
    sessionManager.trackActivity('action', { event, ...data })

    // Send to analytics service
    if (settings.get('privacy.trackingEnabled')) {
      await sendToAnalytics(event, data)
    }
  }
}
```

## 🔧 Troubleshooting

### Session not persisting
- Check `persistSession` config
- Verify storage permissions
- Clear corrupted session data

### History search slow
- Reduce `maxItems` limit
- Add indexes to frequently searched fields
- Use pagination for large datasets

### Settings not saving
- Check schema validation errors
- Verify storage quota
- Look for circular references

## 🎯 Next Steps

1. Implement custom activity types
2. Add session replay functionality
3. Create history visualization
4. Build settings migration system
5. Add multi-device sync
