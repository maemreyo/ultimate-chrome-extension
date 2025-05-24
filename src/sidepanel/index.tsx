import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "react-hot-toast"
import { ThemeProvider } from "~components/theme-provider"
import { SidePanelApp } from "./app"
import "~styles/globals.css"

const queryClient = new QueryClient()

function SidePanel() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <SidePanelApp />
        <Toaster position="bottom-center" />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default SidePanel