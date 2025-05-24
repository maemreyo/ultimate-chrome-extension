import { useEffect, useState } from "react"
import { useStorage } from "./useStorage"

export function useTheme() {
  const [settings] = useStorage("settings")
  const [theme, setTheme] = useState<"light" | "dark">("light")
  
  useEffect(() => {
    const root = document.documentElement
    
    if (settings?.theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      setTheme(mediaQuery.matches ? "dark" : "light")
      
      const handler = (e: MediaQueryListEvent) => {
        setTheme(e.matches ? "dark" : "light")
      }
      
      mediaQuery.addEventListener("change", handler)
      return () => mediaQuery.removeEventListener("change", handler)
    } else {
      setTheme(settings?.theme || "light")
    }
  }, [settings?.theme])
  
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])
  
  return theme
}