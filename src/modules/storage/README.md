# Advanced Storage System Module

A comprehensive storage system with advanced features for managing application data securely and efficiently, including session management, history tracking, and settings management.

## Core Features

### Advanced Storage

- 🔐 **Encryption**: AES-256 encryption for sensitive data
- 🗜️ **Compression**: Reduce storage size with gzip compression
- 🔄 **Sync**: Automatic synchronization between devices
- 📦 **Bulk Operations**: Process multiple items atomically
- 🔍 **Query System**: Search and filter data with complex queries
- 📥 **Import/Export**: Backup and restore data
- 🏷️ **Versioning**: Track change history
- 📊 **Quota Management**: Monitor and manage storage usage

### Session Manager

- 🔑 **Automatic Session Tracking**: Track user sessions and login state
- 📊 **Activity Monitoring**: Record user activities within sessions
- ⏱️ **Idle Timeout Detection**: Automatically end inactive sessions
- 📱 **Device Information**: Capture browser and device details
- 📚 **Session Archiving**: Store and retrieve past sessions

### History Manager

- 📜 **Searchable History**: Find past activities and actions
- ⏲️ **Timeline Grouping**: Organize history items by time periods
- 📤 **Export/Import**: Save and restore history data
- 📊 **Activity Statistics**: Analyze usage patterns
- 🏷️ **Tag-based Filtering**: Filter history by custom tags

### Settings Store

- ✅ **Schema Validation**: Type-safe settings with Zod validation
- 🔔 **Change Events**: Subscribe to settings changes
- 📤 **Import/Export**: Save and restore settings
- 🔍 **Nested Key Support**: Access nested settings with dot notation
- 🔒 **Type-safe Access**: Strongly typed settings values

## Installation

Add the following dependencies to your `package.json`:

```json
{
  "dependencies": {
    "dexie": "^3.2.4",
    "crypto-js": "^4.2.0",
    "pako": "^2.1.0",
    "zod": "^3.22.4",
    "date-fns": "^2.30.0"
  }
}
```

## Usage

### Basic Storage Operations

```typescript
import { storageManager } from '~modules/storage';

// Get default storage instance
const storage = storageManager.get();

// Store data with optional tags
await storage.set('user_preferences', {
  theme: 'dark',
  language: 'en',
  notifications: true
}, ['settings']); // tags for categorization

// Retrieve data
const prefs = await storage.get('user_preferences');

// Update data
await storage.update('user_preferences', (current) => ({
  ...current,
  theme: 'light'
}));

// Delete data
await storage.delete('user_preferences');

// Check if key exists
const exists = await storage.has('user_preferences');
```

### Using React Hooks

```typescript
import { useAdvancedStorage } from '~modules/storage/hooks';

function SettingsComponent() {
  // Automatically loads and updates when data changes
  const {
    value,
    set,
    update,
    remove,
    loading,
    error
  } = useAdvancedStorage('user_preferences', {
    theme: 'light',
    language: 'en'
  });

  const toggleTheme = async () => {
    await update(current => ({
      ...current,
      theme: current.theme === 'light' ? 'dark' : 'light'
    }));
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <p>Current theme: {value.theme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

### Session Management

```typescript
import { SessionManager } from '~modules/storage/session';
import { useSession } from '~modules/storage/hooks';

// Direct usage
const sessionManager = new SessionManager({
  maxDuration: 480,     // 8 hours
  idleTimeout: 30,      // 30 minutes
  persistSession: true,
  trackActivities: true,
  maxActivities: 1000
});

// Start a session
const session = await sessionManager.startSession('user123', {
  source: 'login',
  device: 'desktop'
});

// Track activities
sessionManager.trackActivity('page_view', {
  url: window.location.href,
  title: document.title
});

// End session
await sessionManager.endSession('logout');

// React Hook usage
function UserSession() {
  const {
    session,
    isActive,
    startSession,
    endSession,
    trackActivity
  } = useSession();

  // Auto-tracking on mount
  useEffect(() => {
    trackActivity('component_view', { name: 'UserSession' });
  }, []);

  return (
    <div>
      {isActive ? (
        <>
          <p>Session active for {session.duration}</p>
          <button onClick={() => endSession()}>Logout</button>
        </>
      ) : (
        <button onClick={() => startSession('user123')}>
          Login
        </button>
      )}
    </div>
  );
}
```

### History Tracking

```typescript
import { HistoryManager } from '~modules/storage/history';
import { useHistory } from '~modules/storage/hooks';

// Direct usage
const historyManager = new HistoryManager({
  maxItems: 10000,
  groupByTime: true
});

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
});

// Search history
const results = await historyManager.searchHistory('climate');

// Get timeline view
const timeline = await historyManager.getTimeline(7); // Last 7 days

// Get statistics
const stats = await historyManager.getStats(30); // Last 30 days

// React Hook usage
function DocumentHistory() {
  const {
    current,
    history,
    saveVersion,
    revertTo,
    clearHistory
  } = useHistory('document_123', initialContent);

  const saveDocument = async (content) => {
    // Save current state to history
    await saveVersion(content);
  };

  return (
    <div>
      <textarea
        value={current}
        onChange={(e) => saveDocument(e.target.value)}
      />
      <div>
        <h3>History ({history.length} versions)</h3>
        {history.map((version, index) => (
          <button key={index} onClick={() => revertTo(index)}>
            Version {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Settings Management

```typescript
import { SettingsStore } from '~modules/storage/settings';
import { useSettings } from '~modules/storage/hooks';
import { z } from 'zod';

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
});

// Direct usage
const settings = new SettingsStore();

// Load settings
await settings.load();

// Get value
const theme = settings.get('appearance.theme');

// Set value
await settings.set('appearance.theme', 'dark');

// Update multiple values
await settings.update({
  appearance: { theme: 'dark', compactMode: true }
});

// Subscribe to changes
const unsubscribe = settings.subscribe('appearance.theme', (event) => {
  console.log(`Theme changed from ${event.oldValue} to ${event.newValue}`);
});

// Reset to defaults
await settings.reset('appearance');

// React Hook usage
function SettingsComponent() {
  const { value, update, reset, subscribe } = useSettings('appearance');

  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      console.log('Settings changed:', event);
    });
    return unsubscribe;
  }, []);

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
  );
}
```

### Query System

```typescript
import { useStorageQuery } from '~modules/storage/hooks';

function BookmarksList() {
  // Query with filtering, sorting, and pagination
  const {
    data,
    loading,
    error,
    refresh,
    pagination
  } = useStorageQuery({
    where: {
      'metadata.tags': 'bookmark',
      'value.category': 'work'
    },
    orderBy: 'metadata.updated:desc',
    limit: 10,
    offset: 0
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Bookmarks</h2>
      <ul>
        {data.map(item => (
          <li key={item.id}>{item.value.title}</li>
        ))}
      </ul>
      <button onClick={() => pagination.next()}>
        Next Page
      </button>
    </div>
  );
}
```

### Bulk Operations

```typescript
import { storageManager } from '~modules/storage';

// Execute multiple operations atomically
await storageManager.get().bulk([
  {
    type: 'set',
    key: 'item1',
    value: { name: 'Item 1' }
  },
  {
    type: 'update',
    key: 'item2',
    updateFn: (v) => ({ ...v, updated: true })
  },
  {
    type: 'delete',
    key: 'item3'
  }
]);
```

### Import/Export

```typescript
import { storageManager } from '~modules/storage';

// Export all data
const exportData = async () => {
  const blob = await storageManager.get().export({
    format: 'json',
    encrypted: true,
    compressed: true
  });

  // Create download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'backup.json.gz';
  a.click();
};

// Import data
const importData = async (file) => {
  await storageManager.get().import(file, {
    format: 'json',
    compressed: true
  });
};

// Export history
const historyManager = new HistoryManager();
const historyBlob = await historyManager.exportHistory();

// Export settings
const settingsStore = new SettingsStore();
const settingsJson = await settingsStore.export();
```

## UI Components

### Storage Manager UI

```typescript
import { StorageProvider } from '~modules/storage';
import { StorageManagerUI } from '~modules/storage/components';

function OptionsPage() {
  return (
    <StorageProvider config={{
      encryption: { enabled: true },
      compression: { enabled: true },
      quota: { maxSize: 50 } // 50MB
    }}>
      <StorageManagerUI />
    </StorageProvider>
  );
}
```

### Storage Explorer

```typescript
import { StorageExplorer } from '~modules/storage/components';

// Visual interface to browse, search, and manage stored items
function DataExplorer() {
  return (
    <StorageExplorer
      title="Data Explorer"
      allowDelete={true}
      allowExport={true}
      filterTags={['settings', 'user', 'cache']}
    />
  );
}
```

### Session Viewer

```typescript
import { SessionViewer } from '~modules/storage/components';

// Complete session management UI
function SessionPage() {
  return (
    <SessionViewer
      showActivities={true}
      allowManualEnd={true}
      showDeviceInfo={true}
    />
  );
}
```

### History Timeline

```typescript
import { HistoryTimeline } from '~modules/storage/components';

// Full-featured history UI with timeline, stats, and search
function HistoryPage() {
  return (
    <HistoryTimeline
      days={30}
      showStats={true}
      allowExport={true}
      allowDelete={true}
      filters={{
        types: ['analysis', 'search'],
        tags: ['important']
      }}
    />
  );
}
```

### Settings Editor

```typescript
import { SettingsEditor } from '~modules/storage/components';

// UI for editing application settings
function SettingsPage() {
  return (
    <SettingsEditor
      settingsKey="app_settings"
      schema={settingsSchema}
      onSave={(newSettings) => console.log('Settings saved', newSettings)}
      allowReset={true}
      allowExport={true}
    />
  );
}
```

## Complete Integration Example

```typescript
// src/options/storage-page.tsx
import { StorageProvider } from '~modules/storage';
import {
  StorageManagerUI,
  SessionViewer,
  HistoryTimeline,
  SettingsEditor
} from '~modules/storage/components';

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
  );
}
```

## Configuration

```typescript
import { storageManager, StorageConfig } from '~modules/storage';

const config: StorageConfig = {
  encryption: {
    enabled: true,
    algorithm: 'AES-GCM' // or 'AES-CBC'
  },
  compression: {
    enabled: true,
    algorithm: 'gzip' // or 'lz4', 'brotli'
  },
  sync: {
    enabled: true,
    interval: 300000, // 5 minutes
    conflictResolution: 'merge' // or 'local', 'remote'
  },
  quota: {
    maxSize: 100, // MB
    warnAt: 80 // percentage
  },
  versioning: {
    enabled: true,
    maxVersions: 10
  }
};

// Create configured instance
const customStorage = storageManager.create('myStorage', config);
```

## API Reference

### Core Services

- `storageManager`: Factory for creating and managing storage instances
- `AdvancedStorage`: Main storage implementation with all features
- `SessionManager`: Manages user sessions and activities
- `HistoryManager`: Tracks and organizes history items
- `SettingsStore`: Type-safe settings management

### Types

#### Storage Types

```typescript
interface StorageConfig {
  encryption?: {
    enabled: boolean;
    key?: string;
    algorithm?: 'AES-GCM' | 'AES-CBC';
  };
  compression?: {
    enabled: boolean;
    algorithm?: 'gzip' | 'lz4' | 'brotli';
  };
  sync?: {
    enabled: boolean;
    interval?: number;
    conflictResolution?: 'local' | 'remote' | 'merge';
  };
  quota?: {
    maxSize?: number; // in MB
    warnAt?: number; // percentage
  };
  versioning?: {
    enabled: boolean;
    maxVersions?: number;
  };
}

interface StorageItem<T = any> {
  id: string;
  key: string;
  value: T;
  metadata: {
    created: Date;
    updated: Date;
    version: number;
    size: number;
    encrypted: boolean;
    compressed: boolean;
    tags?: string[];
  };
}

interface QueryOptions {
  where?: Record<string, any>;
  orderBy?: string;
  limit?: number;
  offset?: number;
  select?: string[];
  include?: string[];
}

interface StorageStats {
  totalSize: number;
  itemCount: number;
  quotaUsed: number;
  quotaAvailable: number;
  lastSync?: Date;
  lastBackup?: Date;
}
```

#### Session Types

```typescript
interface Session {
  id: string;
  userId?: string;
  startedAt: Date;
  lastActiveAt: Date;
  expiresAt?: Date;
  data: Record<string, any>;
  device?: {
    browser: string;
    os: string;
    screen: string;
  };
  activities: SessionActivity[];
}

interface SessionActivity {
  timestamp: Date;
  type: 'page_view' | 'action' | 'api_call' | 'error';
  details: Record<string, any>;
}

interface SessionConfig {
  maxDuration?: number; // in minutes
  idleTimeout?: number; // in minutes
  persistSession?: boolean;
  trackActivities?: boolean;
  maxActivities?: number;
}
```

#### History Types

```typescript
interface HistoryItem {
  id: string;
  timestamp: Date;
  type: 'analysis' | 'fact_check' | 'search' | 'action' | 'view' | 'custom';
  title: string;
  description?: string;
  url?: string;
  data: Record<string, any>;
  metadata?: {
    duration?: number;
    status?: 'success' | 'failure' | 'pending';
    tags?: string[];
    source?: string;
  };
  groupId?: string;
}

interface HistoryGroup {
  id: string;
  title: string;
  date: Date;
  items: HistoryItem[];
  collapsed?: boolean;
}

interface HistoryFilters {
  types?: HistoryItem['type'][];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
  tags?: string[];
  status?: string[];
}

interface HistoryStats {
  totalItems: number;
  itemsByType: Record<string, number>;
  itemsByDay: Array<{ date: string; count: number }>;
  recentActivity: HistoryItem[];
  topTags: Array<{ tag: string; count: number }>;
}
```

#### Settings Types

```typescript
interface SettingsChangeEvent {
  key: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
}

// Example settings schema
const SettingsSchema = z.object({
  appearance: z.object({
    theme: z.enum(['light', 'dark', 'system']),
    fontSize: z.enum(['small', 'medium', 'large']),
    compactMode: z.boolean(),
    animations: z.boolean(),
    highContrast: z.boolean()
  }),
  notifications: z.object({
    enabled: z.boolean(),
    sound: z.boolean(),
    desktop: z.boolean(),
    types: z.object({
      info: z.boolean(),
      warning: z.boolean(),
      error: z.boolean(),
      success: z.boolean()
    })
  }),
  privacy: z.object({
    trackingEnabled: z.boolean(),
    shareAnalytics: z.boolean(),
    storageEncryption: z.boolean(),
    clearDataOnUninstall: z.boolean()
  }),
  features: z.record(z.boolean()),
  shortcuts: z.record(z.string()),
  advanced: z.record(z.any())
});

type Settings = z.infer<typeof SettingsSchema>;
```

### React Hooks

- `useAdvancedStorage(key, defaultValue?)`: Basic storage operations
- `useSession()`: Session management and activity tracking
- `useHistory(key, initialValue?)`: Version history tracking
- `useSettings(key?)`: Type-safe settings management
- `useStorageStats()`: Storage usage statistics
- `useStorageQuery(queryOptions)`: Advanced data querying

## Security Features

1. **Automatic Encryption**: Data is automatically encrypted when enabled
2. **Secure Key Management**: Keys are generated and stored securely
3. **Encrypted Exports**: Backup files can be encrypted
4. **No Plain Text**: Sensitive data is never stored as plain text
5. **Session Timeout**: Automatic session expiration for security

## Performance Optimization

1. **IndexedDB Backend**: Uses Dexie for optimal performance
2. **Compression**: Reduces size up to 70% with gzip
3. **Batch Processing**: Processes multiple operations in a single transaction
4. **Lazy Loading**: Only loads data when needed
5. **Efficient Queries**: Uses indexed fields for fast lookups
6. **Activity Batching**: Groups session activities for better performance
7. **History Cleanup**: Automatically removes old history items

## Testing

```typescript
// Mock storage for tests
jest.mock('~modules/storage', () => ({
  storageManager: {
    get: () => ({
      set: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      query: jest.fn()
    })
  }
}));

// Mock session manager
jest.mock('~modules/storage/session', () => ({
  SessionManager: jest.fn().mockImplementation(() => ({
    startSession: jest.fn(),
    endSession: jest.fn(),
    trackActivity: jest.fn()
  }))
}));

// Test example
describe('Session Tracking', () => {
  it('should track page views', async () => {
    const manager = new SessionManager();
    await manager.startSession();

    manager.trackActivity('page_view', { url: '/test' });

    const session = manager.getCurrentSession();
    expect(session.activities).toHaveLength(1);
  });
});
```

## Best Practices

### Storage Management

1. **Use Tags**: Categorize items with tags for easier querying
2. **Set Quotas**: Prevent storage overflow
3. **Regular Backups**: Export data periodically
4. **Vacuum Periodically**: Clean up old versions
5. **Monitor Usage**: Track storage statistics
6. **Use Transactions**: Group related operations with bulk operations
7. **Handle Errors**: Always catch and handle storage errors

### Session Management

1. **Start Sessions on Activation**: Initialize sessions when the app starts
2. **Track Meaningful Activities**: Only record important user actions
3. **Clean Up Old Sessions**: Periodically archive and remove old sessions
4. **Use Session Data for Analytics**: Analyze user behavior patterns
5. **Handle Timeouts Gracefully**: Provide clear UI for expired sessions

### History Management

1. **Set Reasonable Limits**: Configure appropriate maxItems limit
2. **Use Tags for Organization**: Tag history items for better filtering
3. **Export Before Updates**: Backup history before major app updates
4. **Implement Retention Policies**: Define how long to keep history items
5. **Group Related Actions**: Use groupId to associate related history items

### Settings Management

1. **Define Clear Schemas**: Use Zod for type-safe settings validation
2. **Provide Migration Paths**: Handle settings format changes gracefully
3. **Validate on Import**: Ensure imported settings match your schema
4. **Use Change Events Sparingly**: Only subscribe to necessary changes
5. **Provide Defaults**: Always define sensible default values
