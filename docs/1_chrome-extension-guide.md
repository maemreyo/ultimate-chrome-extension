# Hướng dẫn toàn diện phát triển Chrome Extension với Plasmo Framework

## Mục lục

1. [Giới thiệu](#giới-thiệu)
2. [Kiến trúc Chrome Extension](#kiến-trúc-chrome-extension)
3. [Cấu trúc Project Template](#cấu-trúc-project-template)
4. [Các thành phần chính](#các-thành-phần-chính)
5. [Tính năng nâng cao](#tính-năng-nâng-cao)
6. [Best Practices](#best-practices)
7. [Template Project](#template-project)

## Giới thiệu

Chrome Extension là ứng dụng nhỏ chạy trong trình duyệt, có thể tương tác với web pages, browser APIs và cung cấp chức năng bổ sung cho người dùng. Plasmo Framework giúp đơn giản hóa việc phát triển extension với React, TypeScript và các công cụ hiện đại.

### Lợi ích của Plasmo Framework

- **Hot Reload**: Tự động reload khi code thay đổi
- **TypeScript Support**: Type safety cho Chrome APIs
- **React Integration**: Sử dụng React cho UI components
- **Build Optimization**: Tự động optimize và bundle code
- **Multi-browser Support**: Hỗ trợ Chrome, Firefox, Brave, Edge

## Kiến trúc Chrome Extension

### 1. Manifest V3
```json
{
  "manifest_version": 3,
  "name": "Extension Name",
  "version": "1.0.0",
  "description": "Extension description",
  "permissions": ["storage", "tabs", "activeTab"],
  "host_permissions": ["https://*/*"],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"]
  }],
  "action": {
    "default_popup": "popup.html"
  }
}
```

### 2. Các thành phần chính

#### Background Service Worker
- Chạy độc lập, xử lý logic chính
- Lắng nghe events từ browser
- Quản lý state toàn cục
- API calls và xử lý dữ liệu

#### Content Scripts
- Inject vào web pages
- Tương tác với DOM
- Giao tiếp với background qua messaging

#### Popup/Options/NewTab Pages
- UI chính của extension
- React components
- Tương tác người dùng

## Cấu trúc Project Template

```
ultimate-chrome-extension/
├── src/
│   ├── background/
│   │   ├── index.ts              # Background service worker chính
│   │   ├── messages/             # Message handlers
│   │   │   ├── auth.ts
│   │   │   ├── data-sync.ts
│   │   │   └── api-handler.ts
│   │   └── ports/                # Port handlers cho persistent connections
│   │       └── websocket.ts
│   │
│   ├── contents/                 # Content scripts
│   │   ├── inject-ui.tsx        # React UI injection
│   │   ├── dom-observer.ts      # DOM monitoring
│   │   ├── main-world.ts        # Main world script
│   │   └── styles.css
│   │
│   ├── popup/                    # Popup UI
│   │   ├── index.tsx
│   │   ├── components/
│   │   └── styles.css
│   │
│   ├── options/                  # Options page
│   │   ├── index.tsx
│   │   └── components/
│   │
│   ├── newtab/                   # Override new tab
│   │   └── index.tsx
│   │
│   ├── sidepanel/               # Side panel (Chrome 114+)
│   │   └── index.tsx
│   │
│   ├── devtools/                # DevTools panel
│   │   └── index.tsx
│   │
│   ├── tabs/                    # Custom tab pages
│   │   └── dashboard.tsx
│   │
│   ├── core/                    # Core utilities
│   │   ├── storage.ts          # Storage management
│   │   ├── messaging.ts        # Message system
│   │   ├── api.ts              # API client
│   │   ├── auth.ts             # Authentication
│   │   └── analytics.ts        # Analytics
│   │
│   ├── hooks/                   # React hooks
│   │   ├── useStorage.ts
│   │   ├── useMessage.ts
│   │   └── useAuth.ts
│   │
│   ├── components/              # Shared components
│   │   ├── ui/
│   │   └── common/
│   │
│   ├── lib/                     # Libraries
│   │   └── utils.ts
│   │
│   └── assets/                  # Static assets
│       ├── icons/
│       └── images/
│
├── public/                      # Public files
├── .env.example                # Environment variables
├── package.json
├── tailwind.config.js          # Styling
├── tsconfig.json               # TypeScript config
└── README.md
```

## Các thành phần chính

### 1. Background Service Worker

```typescript
// src/background/index.ts
import { startHub } from "@plasmohq/messaging/pub-sub"
import { Storage } from "@plasmohq/storage"

// Khởi tạo messaging hub
startHub()

// Xử lý cài đặt extension
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    // Khởi tạo storage
    const storage = new Storage()
    await storage.set("installed", true)
    
    // Mở tab welcome
    chrome.tabs.create({ url: "tabs/welcome.html" })
  }
})

// Lắng nghe messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Xử lý messages
})
```

### 2. Content Script với React UI

```typescript
// src/contents/inject-ui.tsx
import type { PlasmoCSConfig } from "plasmo"
import { useState } from "react"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  css: ["font.css"]
}

// Inject vào specific element
export const getInlineAnchor = () => 
  document.querySelector("#target-element")

// Custom shadow DOM host
export const getShadowHostId = () => "my-extension-root"

const ContentUI = () => {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="extension-container">
      {/* UI Components */}
    </div>
  )
}

export default ContentUI
```

### 3. Messaging System

```typescript
// src/core/messaging.ts
import { sendToBackground, sendToContentScript } from "@plasmohq/messaging"

// Send message to background
export const callBackgroundAPI = async (action: string, data: any) => {
  const response = await sendToBackground({
    name: "api-handler",
    body: { action, data }
  })
  return response
}

// Message handler trong background
// src/background/messages/api-handler.ts
import type { PlasmoMessaging } from "@plasmohq/messaging"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const { action, data } = req.body
  
  switch (action) {
    case "fetch-data":
      const result = await fetchData(data)
      res.send({ success: true, data: result })
      break
    default:
      res.send({ success: false, error: "Unknown action" })
  }
}

export default handler
```

### 4. Storage Management

```typescript
// src/core/storage.ts
import { Storage } from "@plasmohq/storage"
import { SecureStorage } from "@plasmohq/storage/secure"

// Storage thông thường
export const storage = new Storage({
  area: "local" // hoặc "sync"
})

// Secure storage với encryption
export const secureStorage = new SecureStorage({
  area: "local"
})

// React hook
import { useStorage } from "@plasmohq/storage/hook"

export const useSettings = () => {
  const [settings, setSettings] = useStorage("settings", {
    theme: "light",
    notifications: true
  })
  
  return { settings, setSettings }
}
```

### 5. Authentication System

```typescript
// src/core/auth.ts
export class AuthManager {
  private storage: Storage
  
  constructor() {
    this.storage = new Storage({ area: "local" })
  }
  
  async login(credentials: Credentials) {
    // OAuth flow
    const token = await chrome.identity.getAuthToken({
      interactive: true
    })
    
    await this.storage.set("auth_token", token)
    return token
  }
  
  async logout() {
    const token = await this.storage.get("auth_token")
    if (token) {
      await chrome.identity.removeCachedAuthToken({ token })
      await this.storage.remove("auth_token")
    }
  }
}
```

## Tính năng nâng cao

### 1. Web Accessible Resources

```json
{
  "web_accessible_resources": [{
    "resources": ["inject.js", "styles.css"],
    "matches": ["<all_urls>"]
  }]
}
```

### 2. Context Menus

```typescript
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "my-action",
    title: "My Extension Action",
    contexts: ["selection", "image"]
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "my-action") {
    // Xử lý action
  }
})
```

### 3. Browser Action với Badge

```typescript
// Update badge
chrome.action.setBadgeText({ text: "5" })
chrome.action.setBadgeBackgroundColor({ color: "#FF0000" })

// Dynamic icon
chrome.action.setIcon({
  path: {
    "16": "icon-16.png",
    "32": "icon-32.png"
  }
})
```

### 4. Intercept Network Requests

```typescript
// Cần permission: "webRequest", "webRequestBlocking"
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    // Modify hoặc block request
    return { cancel: false }
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
)
```

### 5. Tab Management

```typescript
// Tạo tab mới
chrome.tabs.create({ url: "https://example.com" })

// Query tabs
const tabs = await chrome.tabs.query({ 
  active: true, 
  currentWindow: true 
})

// Execute script in tab
chrome.scripting.executeScript({
  target: { tabId: tabs[0].id },
  func: () => {
    // Code chạy trong page context
  }
})
```

## Best Practices

### 1. Performance Optimization

- Lazy load components không cần thiết
- Sử dụng React.memo cho components
- Debounce/throttle event handlers
- Minimize bundle size

### 2. Security

- Validate tất cả input từ content scripts
- Sử dụng HTTPS cho API calls
- Không store sensitive data trong plain text
- Implement CSP (Content Security Policy)

### 3. User Experience

- Responsive design cho popup
- Loading states cho async operations
- Error handling và user feedback
- Keyboard shortcuts support

### 4. Development Workflow

- Environment variables cho different stages
- Automated testing với Jest
- Code linting với ESLint
- Type checking với TypeScript

## Template Project

### Quick Start Script

```bash
#!/bin/bash
# create-extension.sh

PROJECT_NAME=$1

# Clone template
git clone https://github.com/your-template/chrome-extension-template $PROJECT_NAME
cd $PROJECT_NAME

# Install dependencies
npm install

# Setup environment
cp .env.example .env.development
cp .env.example .env.production

# Generate icons
npm run generate-icons

echo "Project $PROJECT_NAME created successfully!"
echo "Run 'npm run dev' to start development"
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "plasmo dev",
    "build": "plasmo build",
    "build:firefox": "plasmo build --target=firefox-mv2",
    "package": "plasmo package",
    "test": "jest",
    "lint": "eslint src/**/*.{ts,tsx}",
    "format": "prettier --write src/**/*.{ts,tsx}",
    "analyze": "plasmo build --analyze"
  }
}
```

### Environment Configuration

```env
# .env.example
PLASMO_PUBLIC_API_URL=https://api.example.com
PLASMO_PUBLIC_ANALYTICS_ID=UA-XXXXXXXX
PLASMO_PUBLIC_STRIPE_KEY=pk_test_xxxxx

# Private keys (not exposed to extension)
API_SECRET_KEY=secret_xxxxx
DATABASE_URL=postgres://...
```

## Deployment Checklist

- [ ] Update version trong manifest.json
- [ ] Test trên multiple browsers
- [ ] Minify và optimize assets
- [ ] Security audit
- [ ] Prepare store listing (screenshots, descriptions)
- [ ] Create privacy policy
- [ ] Submit for review

## Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Plasmo Documentation](https://docs.plasmo.com/)
- [Chrome Web Store Dashboard](https://chrome.google.com/webstore/devconsole)
- [Extension Examples](https://github.com/GoogleChrome/chrome-extensions-samples)