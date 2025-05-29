# 🚀 Ultimate Chrome Extension Template

> **The most comprehensive Chrome Extension template with modern tech stack, premium features, and enterprise-ready architecture**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-626CD9?style=for-the-badge&logo=Stripe&logoColor=white)](https://stripe.com/)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Core Concepts](#core-concepts)
- [Development Guide](#development-guide)
- [Monetization](#monetization)
- [Deployment](#deployment)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Resources](#resources)

## 🎯 Overview

This template is designed for developers who want to build **professional, scalable, and monetizable Chrome extensions**. It includes everything you need:

- 🔐 **Authentication** (Supabase + Google OAuth)
- 💳 **Payments** (Stripe subscriptions)
- 💾 **Database** (Supabase with RLS)
- 🎨 **Modern UI** (Tailwind + Radix UI)
- 📊 **Analytics** (Google Analytics + Custom)
- 🔄 **Real-time sync** (Supabase Realtime)
- 🚀 **Performance optimized**
- 📱 **Cross-browser support**

## ✨ Features

### Core Extension Features
- ✅ **Manifest V3** - Latest Chrome extension standard
- ✅ **Background Service Worker** - Persistent background tasks
- ✅ **Content Scripts** - Page manipulation with React
- ✅ **Popup UI** - Beautiful extension popup
- ✅ **Options Page** - Full settings management
- ✅ **Side Panel** - Chrome 114+ side panel support
- ✅ **New Tab Override** - Custom new tab page
- ✅ **Context Menus** - Right-click actions
- ✅ **Notifications** - Browser notifications
- ✅ **Storage** - Local/Sync/Secure storage
- ✅ **Messaging** - Type-safe message passing

### Premium Features
- 💰 **Stripe Integration** - Subscription management
- 🔐 **Supabase Auth** - Email/Password + OAuth
- 📊 **Analytics Dashboard** - User insights
- 🔄 **Real-time Sync** - Cross-device sync
- 🎯 **User Segmentation** - Free/Pro/Premium tiers
- 📧 **Email Integration** - Transactional emails
- 🔔 **Push Notifications** - Engagement features
- 📈 **Usage Tracking** - Monitor API limits

### Developer Experience
- 🔥 **Hot Reload** - Instant feedback
- 📝 **TypeScript** - Full type safety
- 🧪 **Testing** - Jest + React Testing Library
- 📦 **Auto Build** - GitHub Actions
- 🚀 **One-click Deploy** - Web Store publishing
- 📖 **Documentation** - Comprehensive guides
- 🛠️ **Dev Tools** - Custom DevTools panel
- 🐛 **Error Tracking** - Sentry integration ready

## 🛠️ Tech Stack

- **Framework**: [Plasmo](https://plasmo.com/) - The browser extension framework
- **UI Library**: React 18 + TypeScript
- **Styling**: Tailwind CSS + Radix UI
- **State Management**: React Query + Zustand
- **Backend**: Supabase (Auth + Database + Storage)
- **Payments**: Stripe (Subscriptions + Customer Portal)
- **Build Tool**: Plasmo + ESBuild
- **Testing**: Jest + React Testing Library
- **CI/CD**: GitHub Actions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm
- Chrome/Edge/Brave browser
- Supabase account
- Stripe account (for payments)
- Google Cloud Console access (for OAuth)

### 1. Clone and Install

```bash
# Clone the template
git clone https://github.com/maemreyo/ultimate-chrome-extension.git my-extension
cd my-extension

# Install dependencies
pnpm install # or npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env.development

# Fill in your credentials
code .env.development
```

Required environment variables:
```env
# Supabase
PLASMO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PLASMO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe
PLASMO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=1234567890-xxx.apps.googleusercontent.com

# Extension
CRX_PUBLIC_KEY=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
```

### 3. Supabase Setup

```sql
-- Run migrations in Supabase SQL editor
-- File: supabase/migrations/001_initial_schema.sql
```

Enable providers in Supabase Dashboard:
- Email/Password
- Google OAuth
- Configure redirect URLs

### 4. Stripe Setup

1. Create products and prices in Stripe Dashboard
2. Set up webhooks:
   ```
   https://your-api.com/stripe/webhook
   ```
3. Configure customer portal

### 5. Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

### 6. Load Extension

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `build/chrome-mv3-dev` folder

## 📁 Project Structure

```
my-extension/
├── src/
│   ├── background/              # Background service worker
│   │   ├── index.ts            # Main background script
│   │   ├── messages/           # Message handlers
│   │   └── ports/              # Port handlers
│   │
│   ├── contents/               # Content scripts
│   │   ├── overlay.tsx         # React overlay
│   │   ├── inject.ts          # Page script injection
│   │   └── styles.css         # Content styles
│   │
│   ├── popup/                  # Extension popup
│   │   ├── index.tsx          # Popup entry
│   │   └── tabs/              # Popup tabs
│   │
│   ├── options/                # Options page
│   │   ├── index.tsx          # Options entry
│   │   └── components/        # Settings components
│   │
│   ├── sidepanel/             # Side panel (Chrome 114+)
│   │   ├── index.tsx          # Panel entry
│   │   └── components/        # Panel components
│   │
│   ├── newtab/                # New tab override
│   │   ├── index.tsx          # New tab entry
│   │   └── components/        # Dashboard widgets
│   │
│   ├── tabs/                  # Extension pages
│   │   ├── welcome.tsx        # Onboarding
│   │   ├── pricing.tsx        # Pricing page
│   │   └── dashboard.tsx      # Analytics
│   │
│   ├── core/                  # Core utilities
│   │   ├── supabase.ts       # Supabase client
│   │   ├── stripe.ts         # Stripe integration
│   │   ├── storage.ts        # Storage helpers
│   │   ├── messaging.ts      # Message system
│   │   └── auth.ts           # Authentication
│   │
│   ├── hooks/                 # React hooks
│   │   ├── useAuth.ts        # Auth hook
│   │   ├── useStorage.ts     # Storage hook
│   │   └── useMessage.ts     # Messaging hook
│   │
│   ├── components/            # Shared components
│   │   ├── ui/               # Base UI components
│   │   └── common/           # Business components
│   │
│   └── styles/               # Global styles
│       └── globals.css       # Tailwind imports
│
├── public/                    # Static assets
├── assets/                    # Icons and images
├── supabase/                 # Database migrations
├── scripts/                  # Build scripts
├── tests/                    # Test files
│
├── .env.example              # Environment template
├── package.json              # Dependencies
├── tailwind.config.js        # Tailwind config
├── tsconfig.json             # TypeScript config
└── README.md                 # Documentation
```

## 🔑 Core Concepts

### 1. Authentication Flow

```typescript
// Simple authentication with Supabase
import { useSupabaseAuth } from "~hooks/useSupabaseAuth"

function LoginComponent() {
  const { signIn, signInWithGoogle, user } = useSupabaseAuth()

  // Email/Password login
  const handleLogin = async () => {
    await signIn(email, password)
  }

  // OAuth login
  const handleGoogleLogin = async () => {
    await signInWithGoogle()
  }
}
```

### 2. Message Passing

```typescript
// Type-safe messaging between components
import { sendToBackground } from "@plasmohq/messaging"

// From content script or popup
const response = await sendToBackground({
  name: "get-user-data",
  body: { userId: "123" }
})

// Background handler
export const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const data = await fetchUserData(req.body.userId)
  res.send({ success: true, data })
}
```

### 3. Storage Management

```typescript
// Typed storage with encryption support
import { useStorage } from "~hooks/useStorage"

function SettingsComponent() {
  const [settings, setSettings] = useStorage("settings", {
    theme: "light",
    notifications: true
  })

  // Auto-synced across devices
  const updateTheme = (theme: "light" | "dark") => {
    setSettings({ ...settings, theme })
  }
}
```

### 4. Subscription Management

```typescript
// Stripe subscription handling
import { stripeService } from "~core/stripe"

function PricingComponent() {
  const handleSubscribe = async (priceId: string) => {
    const sessionId = await stripeService.createCheckoutSession(priceId)
    await stripeService.redirectToCheckout(sessionId)
  }

  const handleManageBilling = async () => {
    const portalUrl = await stripeService.createCustomerPortalSession()
    window.open(portalUrl)
  }
}
```

## 💻 Development Guide

### Component Development

1. **Popup Components** - Small, focused UI
   ```typescript
   // src/popup/tabs/home.tsx
   export function HomeTab() {
     // Keep it lightweight
     // Use messaging for heavy operations
   }
   ```

2. **Content Scripts** - Page manipulation
   ```typescript
   // src/contents/overlay.tsx
   export const config: PlasmoCSConfig = {
     matches: ["https://example.com/*"],
     css: ["content.css"]
   }
   ```

3. **Background Tasks** - Long-running operations
   ```typescript
   // src/background/index.ts
   chrome.alarms.create("sync", { periodInMinutes: 30 })
   ```

### State Management

1. **Local State** - Component-specific
   ```typescript
   const [isOpen, setIsOpen] = useState(false)
   ```

2. **Extension Storage** - Persistent data
   ```typescript
   const [userData] = useStorage("userData")
   ```

3. **Supabase** - Cloud sync
   ```typescript
   const { data } = await supabase
     .from("user_data")
     .select("*")
   ```

### Styling Guidelines

1. **Tailwind Classes** - Utility-first
   ```tsx
   <Button className="px-4 py-2 bg-primary text-white rounded-lg">
     Click me
   </Button>
   ```

2. **Component Variants** - CVA
   ```typescript
   const buttonVariants = cva("base-classes", {
     variants: {
       size: {
         sm: "px-2 py-1",
         md: "px-4 py-2"
       }
     }
   })
   ```

3. **Dark Mode** - System preference
   ```css
   @media (prefers-color-scheme: dark) {
     /* Dark mode styles */
   }
   ```

## 💰 Monetization

### Subscription Tiers

```typescript
const plans = [
  {
    name: "Free",
    price: 0,
    features: ["Basic features", "Limited storage"],
    limits: { storage: 100, apiCalls: 1000 }
  },
  {
    name: "Pro",
    price: 9.99,
    features: ["All features", "Priority support"],
    limits: { storage: 10000, apiCalls: 100000 }
  }
]
```

### Implementation Steps

1. **Create Stripe Products**
   - Log into Stripe Dashboard
   - Create products and prices
   - Copy price IDs

2. **Update Pricing Page**
   ```typescript
   // src/tabs/pricing.tsx
   const PRICE_IDS = {
     pro: "price_xxxxx",
     premium: "price_yyyyy"
   }
   ```

3. **Handle Webhooks**
   ```typescript
   // api/stripe/webhook.ts
   switch (event.type) {
     case "checkout.session.completed":
       await updateUserSubscription(session)
       break
   }
   ```

4. **Gate Features**
   ```typescript
   function PremiumFeature() {
     const { subscription } = useAuth()

     if (subscription?.status !== "active") {
       return <UpgradePrompt />
     }

     return <FeatureContent />
   }
   ```

## 🚀 Deployment

### 1. Pre-deployment Checklist

- [ ] Update version in `package.json`
- [ ] Test all features
- [ ] Run production build
- [ ] Update screenshots
- [ ] Prepare store listing

### 2. Build for Production

```bash
# Build all targets
pnpm build

# Build specific browser
pnpm build --target=chrome-mv3
pnpm build --target=firefox-mv2
pnpm build --target=edge-mv3
```

### 3. Chrome Web Store

1. Create developer account ($5 one-time fee)
2. Prepare assets:
   - Icon (128x128)
   - Screenshots (1280x800 or 640x400)
   - Promotional images
3. Upload package:
   ```bash
   pnpm package
   # Upload chrome-extension.zip
   ```

### 4. Automated Publishing

```yaml
# .github/workflows/publish.yml
name: Publish Extension
on:
  push:
    tags:
      - 'v*'
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: PlasmoHQ/bpp@v3
        with:
          keys: ${{ secrets.BPP_KEYS }}
```

## 📚 Best Practices

### Security

1. **Content Security Policy**
   ```json
   {
     "content_security_policy": {
       "extension_pages": "script-src 'self'; object-src 'self'"
     }
   }
   ```

2. **Permissions** - Request only what you need
   ```json
   {
     "permissions": ["storage", "tabs"],
     "optional_permissions": ["notifications"]
   }
   ```

3. **Data Encryption** - Use SecureStorage for sensitive data
   ```typescript
   import { SecureStorage } from "@plasmohq/storage/secure"
   ```

### Performance

1. **Lazy Loading**
   ```typescript
   const HeavyComponent = lazy(() => import("./HeavyComponent"))
   ```

2. **Debouncing**
   ```typescript
   const debouncedSearch = useMemo(
     () => debounce(search, 300),
     []
   )
   ```

3. **Bundle Optimization**
   ```bash
   # Analyze bundle
   pnpm build --analyze
   ```

### User Experience

1. **Onboarding Flow**
   - Welcome page on install
   - Permission explanations
   - Feature tour

2. **Error Handling**
   ```typescript
   try {
     await riskyOperation()
   } catch (error) {
     toast.error("Something went wrong")
     Sentry.captureException(error)
   }
   ```

3. **Feedback**
   - Loading states
   - Success messages
   - Error recovery

## 🐛 Troubleshooting

### Common Issues

1. **"Cannot read properties of undefined"**
   ```typescript
   // Check if running in extension context
   if (typeof chrome !== 'undefined' && chrome.runtime) {
     // Extension code
   }
   ```

2. **CORS Errors**
   ```json
   {
     "host_permissions": ["https://api.example.com/*"]
   }
   ```

3. **Storage Quota Exceeded**
   ```typescript
   // Use sync storage sparingly (100KB limit)
   // Use local storage for larger data (10MB limit)
   ```

4. **Service Worker Inactive**
   ```typescript
   // Keep alive with alarms
   chrome.alarms.create("keep-alive", { periodInMinutes: 1 })
   ```

### Debugging

1. **Background Script**
   - Chrome DevTools > Sources > Service Workers

2. **Content Scripts**
   - Inspect element on page
   - Check for injection

3. **Popup/Options**
   - Right-click > Inspect

4. **Storage**
   ```javascript
   // In console
   chrome.storage.local.get(null, console.log)
   ```

## 📖 Resources

### Official Documentation
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Plasmo Framework](https://docs.plasmo.com/)
- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)

### Tutorials
- [Building Chrome Extensions with React](https://blog.plasmo.com/p/building-chrome-extensions-with-react)
- [Monetizing Browser Extensions](https://blog.plasmo.com/p/monetizing-browser-extensions)
- [Extension Security Best Practices](https://developer.chrome.com/docs/extensions/mv3/security/)

### Community
- [Plasmo Discord](https://discord.gg/plasmo)
- [Chrome Extension Developers](https://groups.google.com/g/chromium-extensions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/chrome-extension)

### Tools
- [Extension Monitor](https://monitor.firefox.com/)
- [Chrome Extension Source Viewer](https://chrome.google.com/webstore/detail/chrome-extension-source-v/jifpbeccnghkjeaalbbjmodiffmgedin)
- [Extension Rank](https://extensionrank.com/)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Plasmo Team](https://www.plasmo.com/) for the amazing framework
- [Shadcn](https://ui.shadcn.com/) for the UI components
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Stripe](https://stripe.com/) for payment processing

---

<div align="center">
  <p>Built with ❤️ by developers, for developers</p>
  <p>
    <a href="https://twitter.com/maemreyo">Twitter</a> •
    <a href="https://github.com/maemreyo">GitHub</a> •
    <a href="https://discord.gg/yourcommunity">Discord</a>
  </p>
</div>
