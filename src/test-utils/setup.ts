import '@testing-library/jest-dom'
import { TextDecoder, TextEncoder } from 'util'

// Polyfill for TextEncoder/TextDecoder
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

// Mock chrome API
global.chrome = {
  runtime: {
    id: 'test-extension-id',
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn(),
    },
    getManifest: jest.fn(() => ({
      version: '1.0.0',
      name: 'Test Extension',
    })),
    getURL: jest.fn((path) => `chrome-extension://test-extension-id/${path}`),
    lastError: null,
  },
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        callback?.({})
        return Promise.resolve({})
      }),
      set: jest.fn((items, callback) => {
        callback?.()
        return Promise.resolve()
      }),
      remove: jest.fn((keys, callback) => {
        callback?.()
        return Promise.resolve()
      }),
      clear: jest.fn((callback) => {
        callback?.()
        return Promise.resolve()
      }),
    },
    sync: {
      get: jest.fn((keys, callback) => {
        callback?.({})
        return Promise.resolve({})
      }),
      set: jest.fn((items, callback) => {
        callback?.()
        return Promise.resolve()
      }),
      remove: jest.fn((keys, callback) => {
        callback?.()
        return Promise.resolve()
      }),
      clear: jest.fn((callback) => {
        callback?.()
        return Promise.resolve()
      }),
    },
  },
  tabs: {
    query: jest.fn((queryInfo, callback) => {
      callback?.([])
      return Promise.resolve([])
    }),
    create: jest.fn((createProperties, callback) => {
      const tab = { id: 1, ...createProperties }
      callback?.(tab)
      return Promise.resolve(tab)
    }),
    update: jest.fn((tabId, updateProperties, callback) => {
      const tab = { id: tabId, ...updateProperties }
      callback?.(tab)
      return Promise.resolve(tab)
    }),
    remove: jest.fn((tabIds, callback) => {
      callback?.()
      return Promise.resolve()
    }),
  },
  identity: {
    getAuthToken: jest.fn((details, callback) => {
      callback?.('test-auth-token')
      return Promise.resolve('test-auth-token')
    }),
  },
  contextMenus: {
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    removeAll: jest.fn(),
    onClicked: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  notifications: {
    create: jest.fn((notificationId, options, callback) => {
      callback?.(notificationId)
      return Promise.resolve(notificationId)
    }),
    clear: jest.fn((notificationId, callback) => {
      callback?.(true)
      return Promise.resolve(true)
    }),
    getPermissionLevel: jest.fn((callback) => {
      callback?.('granted')
      return Promise.resolve('granted')
    }),
  },
  alarms: {
    create: jest.fn(),
    clear: jest.fn(),
    clearAll: jest.fn(),
    onAlarm: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  action: {
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn(),
    setIcon: jest.fn(),
    setTitle: jest.fn(),
  },
} as any

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return []
  }
} as any

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any

// Suppress console errors during tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
       args[0].includes('Warning: `ReactDOMTestUtils.act`'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
