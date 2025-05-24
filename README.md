# Ultimate Chrome Extension Template

A comprehensive Chrome extension template with all modern features and best practices.

## Features

- 🚀 **Plasmo Framework** - Modern extension development
- ⚛️ **React 18** - UI components
- 📦 **TypeScript** - Type safety
- 🎨 **Tailwind CSS** - Styling
- 🔄 **React Query** - Data fetching
- 💾 **Storage API** - Local/sync storage with encryption
- 📨 **Messaging System** - Background/content script communication
- 🔐 **Authentication** - OAuth and credential-based auth
- 🌐 **API Integration** - Ready-to-use API client
- 📊 **Analytics** - Event tracking
- 🎯 **Content Scripts** - Page injection and manipulation
- 🖼️ **Shadow DOM** - Isolated UI components
- 🔔 **Notifications** - Browser notifications
- 📝 **Context Menus** - Right-click actions
- ⏰ **Alarms** - Scheduled tasks
- 🎛️ **Options Page** - Settings management
- 📱 **Popup UI** - Extension popup
- 🆕 **Side Panel** - Chrome 114+ side panel
- 🛠️ **DevTools** - Custom developer tools panel

## Quick Start

1. Clone this template:
```bash
git clone https://github.com/yourusername/ultimate-chrome-extension
cd ultimate-chrome-extension
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.development
```

4. Start development:
```bash
npm run dev
```

5. Load extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `build/chrome-mv3-dev` folder

## Project Structure

```
src/
├── background/          # Background service worker
├── contents/           # Content scripts
├── popup/             # Popup UI
├── options/           # Options page
├── components/        # Shared React components
├── core/             # Core utilities (storage, auth, api)
├── hooks/            # React hooks
├── lib/              # Utility functions
└── styles/           # Global styles
```

## Development

### Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code

### Key Concepts

1. **Messaging**: Use `@plasmohq/messaging` for communication
2. **Storage**: Use `@plasmohq/storage` for data persistence
3. **Content UI**: Use Shadow DOM for isolated components
4. **Background**: Keep service worker alive with alarms
5. **Types**: Use TypeScript for all code

## Building for Production

1. Update version in `package.json`
2. Build the extension:
```bash
npm run build
```
3. Package for distribution:
```bash
npm run package
```
4. Upload to Chrome Web Store

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details