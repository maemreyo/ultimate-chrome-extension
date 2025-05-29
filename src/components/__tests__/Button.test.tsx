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
- [GitHub Issues](https://github.com/yourusername/ultimate-chrome-extension/issues)
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