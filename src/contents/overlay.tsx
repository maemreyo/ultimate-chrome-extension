import cssText from "data-text:~styles/content.css"
import type { PlasmoCSConfig } from "plasmo"
import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "~components/theme-provider"
import { ExtensionWidget } from "~components/extension-widget"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  exclude_matches: ["*://localhost/*"],
  css: ["font.css"]
}

const queryClient = new QueryClient()

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

export const getShadowHostId = () => "ultimate-extension-root"

const ContentOverlay = () => {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <div className="fixed bottom-4 right-4 z-[9999]">
          <ExtensionWidget isOpen={isOpen} onToggle={setIsOpen} />
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default ContentOverlay