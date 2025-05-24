import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "~components/theme-provider"
import { NewTabApp } from "./app"
import "~styles/globals.css"

const queryClient = new QueryClient()

function NewTab() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <NewTabApp />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default NewTab