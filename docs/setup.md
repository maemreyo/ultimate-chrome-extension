
# 🚀 Extension Setup Guide

This guide will walk you through setting up your new Chrome extension from the Ultimate Chrome Extension Template.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Setup](#environment-setup)
3. [Database Setup (Supabase)](#database-setup-supabase)
4. [Payment Setup (Stripe)](#payment-setup-stripe)
5. [Authentication Setup](#authentication-setup)
6. [Development Workflow](#development-workflow)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

## 🏃 Quick Start

### Using the Setup Script (Recommended)

```bash
# Download and run the setup script
curl -o create-extension.sh https://raw.githubusercontent.com/maemreyo/ultimate-chrome-extension/main/create-extension.sh
chmod +x create-extension.sh
./create-extension.sh
```

### Manual Setup

```bash
# Clone the template
git clone https://github.com/maemreyo/ultimate-chrome-extension.git my-extension
cd my-extension

# Install dependencies
pnpm install # or npm install

# Copy environment files
cp .env.example .env.development
cp .env.example .env.production

# Start development
pnpm dev
```

## 🔧 Environment Setup

### 1. Install Prerequisites

- **Node.js** 18+ (check with `node -v`)
- **pnpm** (recommended) or npm
  ```bash
  npm install -g pnpm
  ```
- **Git** for version control
- **Chrome/Edge/Brave** browser for testing

### 2. Configure Environment Variables

Edit `.env.development`:

```env
# Required for basic functionality
PLASMO_PUBLIC_API_URL=http://localhost:3000

# Add these as you set up each service
PLASMO_PUBLIC_SUPABASE_URL=your_supabase_url
PLASMO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# ... etc
```

## 🗄️ Database Setup (Supabase)

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Wait for the project to be provisioned

### 2. Get API Keys

1. Go to Settings → API
2. Copy:
   - `Project URL` → `PLASMO_PUBLIC_SUPABASE_URL`
   - `anon public` key → `PLASMO_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_KEY` (backend only)

### 3. Run Database Migrations

1. Go to SQL Editor in Supabase Dashboard
2. Copy and run the migration from `supabase/migrations/001_initial_schema.sql`
3. Verify tables are created: `users`, `user_data`

### 4. Configure Authentication

1. Go to Authentication → Providers
2. Enable Email/Password
3. Enable Google OAuth (optional):
   - Add authorized redirect URLs:
     ```
     http://localhost:3000/auth/callback
     https://yourdomain.com/auth/callback
     ```

### 5. Set Row Level Security (RLS)

RLS is already configured in the migration, but verify:
1. Go to Database → Tables
2. Check that RLS is enabled on `users` and `user_data` tables
3. Review policies in Authentication → Policies

## 💳 Payment Setup (Stripe)

### 1. Create Stripe Account

1. Sign up at [stripe.com](https://stripe.com)
2. Use test mode for development

### 2. Get API Keys

From Dashboard → Developers → API keys:
- `Publishable key` → `PLASMO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `Secret key` → `STRIPE_SECRET_KEY`

### 3. Create Products and Prices

1. Go to Products → Add product
2. Create subscription products:
   ```
   Pro Plan - $9/month
   Premium Plan - $19/month
   ```
3. Copy price IDs to your `.env` file

### 4. Set Up Webhooks

1. Go to Developers → Webhooks
2. Add endpoint:
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
3. Copy signing secret → `STRIPE_WEBHOOK_SECRET`

### 5. Configure Customer Portal

1. Go to Settings → Billing → Customer portal
2. Enable and configure features
3. Save configuration

## 🔐 Authentication Setup

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable APIs:
   - Chrome Identity API
   - Google+ API
4. Create credentials:
   - OAuth 2.0 Client ID
   - Application type: Chrome Extension
   - Add your extension ID (get from `chrome://extensions` after loading)
5. Copy Client ID → `GOOGLE_OAUTH_CLIENT_ID`

### Extension Permissions

Update `manifest.json` permissions:
```json
{
  "permissions": ["identity"],
  "oauth2": {
    "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "scopes": ["openid", "email", "profile"]
  }
}
```

## 💻 Development Workflow

### 1. Start Development Server

```bash
pnpm dev
```

This will:
- Start Plasmo dev server
- Enable hot reload
- Build to `build/chrome-mv3-dev`

### 2. Load Extension in Browser

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `build/chrome-mv3-dev` folder

### 3. Development Tips

- **Popup**: Click extension icon to test
- **Options**: Right-click icon → Options
- **Background**: Check service worker in DevTools
- **Content Scripts**: Test on matching URLs

### 4. Project Structure

```
src/
├── background/      # Service worker
├── contents/        # Content scripts
├── popup/          # Extension popup
├── options/        # Options page
├── newtab/         # New tab override
├── sidepanel/      # Chrome side panel
├── tabs/           # Extension pages
├── core/           # Shared utilities
├── hooks/          # React hooks
└── components/     # UI components
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage
```

### Writing Tests

Example test file:
```typescript
// src/components/__tests__/Button.test.tsx
import { render, screen } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
```

### E2E Testing

For end-to-end testing, use Playwright:
```bash
# Install Playwright
pnpm add -D @playwright/test

# Run E2E tests
pnpm test:e2e
```

## 🚀 Deployment

### 1. Build for Production

```bash
# Build all versions
pnpm build

# Build specific browser
pnpm build:chrome
pnpm build:firefox
pnpm build:edge
```

### 2. Package Extension

```bash
pnpm package
```

Creates:
- `chrome-extension.zip`
- `firefox-extension.zip`
- `edge-extension.zip`

### 3. Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay one-time $5 developer fee
3. Upload `chrome-extension.zip`
4. Fill in listing details:
   - Description
   - Screenshots (1280x800 or 640x400)
   - Icons
   - Categories
5. Submit for review

### 4. Automated Publishing

Set up GitHub Actions secrets:
- `CHROME_BPP_KEYS`
- `FIREFOX_BPP_KEYS`
- `EDGE_BPP_KEYS`

Then tag a release:
```bash
git tag v1.0.0
git push origin v1.0.0
```

## 🐛 Troubleshooting

### Common Issues

#### Extension not loading
- Check for errors in `chrome://extensions/`
- Verify manifest.json is valid
- Check console for errors

#### Hot reload not working
- Restart dev server
- Manually reload extension
- Check if using correct build folder

#### Content script not injecting
- Verify URL matches pattern
- Check permissions in manifest
- Look for errors in page console

#### API calls failing
- Check CORS settings
- Verify environment variables
- Check network tab for errors

### Debug Tips

1. **Background Script**
   ```javascript
   // Add logging
   console.log('[Background]', 'Message received:', message)
   ```

2. **Storage Issues**
   ```javascript
   // Check storage contents
   chrome.storage.local.get(null, (data) => {
     console.log('Storage:', data)
   })
   ```

3. **Message Passing**
   ```javascript
   // Log all messages
   chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
     console.log('Message:', msg, 'From:', sender)
   })
   ```

## 📚 Resources

### Documentation
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Plasmo Framework](https://docs.plasmo.com/)
- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)

### Support
- [Discord Community](https://discord.gg/yourcommunity)
- [GitHub Issues](https://github.com/maemreyo/ultimate-chrome-extension/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/chrome-extension)

### Examples
- [Example Extensions](https://github.com/GoogleChrome/chrome-extensions-samples)
- [Plasmo Examples](https://github.com/PlasmoHQ/examples)

---

## 🎉 Next Steps

1. **Customize UI**: Update colors and branding in `tailwind.config.js`
2. **Add Features**: Implement your unique functionality
3. **Set Up Analytics**: Configure Google Analytics or PostHog
4. **Configure Error Tracking**: Set up Sentry
5. **Create Landing Page**: Build a website for your extension
6. **Plan Marketing**: Prepare launch strategy

Good luck with your extension! 🚀
