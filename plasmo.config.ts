import { defineConfig } from "plasmo"

export default defineConfig({
  // Extension manifest configuration
  manifest: {
    // Required fields
    name: process.env.PLASMO_PUBLIC_EXTENSION_NAME || "Ultimate Chrome Extension",
    version: process.env.npm_package_version || "1.0.0",
    description: process.env.npm_package_description || "A powerful Chrome extension",

    // Permissions
    permissions: [
      "storage",
      "tabs",
      "contextMenus",
      "notifications",
      "alarms",
      "identity",
      "sidePanel"
    ],

    optional_permissions: [
      "bookmarks",
      "history",
      "downloads",
      "webNavigation",
      "cookies",
      "management"
    ],

    // Host permissions for accessing websites
    host_permissions: [
      "https://*/*",
      "http://*/*"
    ],

    // OAuth2 configuration for Google login
    oauth2: {
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
      scopes: [
        "openid",
        "email",
        "profile"
      ]
    },

    // Extension pages
    options_ui: {
      page: "options.html",
      open_in_tab: true
    },

    // DevTools page
    devtools_page: "devtools.html",

    // Side panel configuration (Chrome 114+)
    side_panel: {
      default_path: "sidepanel.html"
    },

    // Web accessible resources
    web_accessible_resources: [
      {
        resources: [
          "assets/*",
          "tabs/*",
          "inject/*"
        ],
        matches: ["<all_urls>"]
      }
    ],

    // Content Security Policy
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'"
    },

    // Commands (keyboard shortcuts)
    commands: {
      "_execute_action": {
        suggested_key: {
          default: "Ctrl+Shift+E",
          mac: "Command+Shift+E"
        },
        description: "Open extension popup"
      },
      "toggle-feature": {
        suggested_key: {
          default: "Ctrl+Shift+X",
          mac: "Command+Shift+X"
        },
        description: "Toggle main feature"
      }
    },

    // Icons
    icons: {
      "16": "./assets/icon-16.png",
      "48": "./assets/icon-48.png",
      "128": "./assets/icon-128.png"
    },

    // Background service worker
    background: {
      service_worker: "background.js",
      type: "module"
    },

    // Extension action (toolbar icon)
    action: {
      default_popup: "popup.html",
      default_icon: {
        "16": "./assets/icon-16.png",
        "48": "./assets/icon-48.png",
        "128": "./assets/icon-128.png"
      },
      default_title: "Click to open extension"
    }
  },

  // Build configuration
  build: {
    // Override build directory
    outDir: "build",

    // Source maps for debugging
    sourceMap: process.env.NODE_ENV === "development",

    // Minification
    minify: process.env.NODE_ENV === "production",

    // Override specific entry points if needed
    entries: {
      popup: "./src/popup/index.tsx",
      options: "./src/options/index.tsx",
      newtab: "./src/newtab/index.tsx",
      sidepanel: "./src/sidepanel/index.tsx",
      background: "./src/background/index.ts",
      content: "./src/contents/overlay.tsx"
    }
  },

  // Development server configuration
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 1815,
    hostname: "localhost"
  },

  // Target browsers
  target: ["chrome-mv3", "edge-mv3", "firefox-mv2"],

  // Environment variables to expose
  env: {
    PLASMO_PUBLIC_SUPABASE_URL: process.env.PLASMO_PUBLIC_SUPABASE_URL,
    PLASMO_PUBLIC_SUPABASE_ANON_KEY: process.env.PLASMO_PUBLIC_SUPABASE_ANON_KEY,
    PLASMO_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.PLASMO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    PLASMO_PUBLIC_API_URL: process.env.PLASMO_PUBLIC_API_URL,
    PLASMO_PUBLIC_GA_MEASUREMENT_ID: process.env.PLASMO_PUBLIC_GA_MEASUREMENT_ID,
    PLASMO_PUBLIC_SENTRY_DSN: process.env.PLASMO_PUBLIC_SENTRY_DSN
  }
})
