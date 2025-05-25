import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "~components/ui/toaster"
import { OptionsLayout } from "./layout"
import { ThemeProvider } from "~components/theme-provider"
import "~styles/globals.css"

const queryClient = new QueryClient()

function OptionsIndex() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <OptionsLayout />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default OptionsIndex