import { useState, useEffect } from "react"
import { format } from "date-fns"
import { motion } from "framer-motion"
import { Search, Plus, Settings, TrendingUp, Calendar } from "lucide-react"
import { useSupabaseAuth } from "~hooks/useSupabaseAuth"
import { QuickLinks } from "./components/quick-links"
import { RecentActivity } from "./components/recent-activity"
import { SearchBar } from "./components/search-bar"
import { WeatherWidget } from "./components/weather-widget"
import { ProductivityStats } from "./components/productivity-stats"

export function NewTabApp() {
  const { user } = useSupabaseAuth()
  const [greeting, setGreeting] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())
  
  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours()
      if (hour < 12) setGreeting("Good morning")
      else if (hour < 18) setGreeting("Good afternoon")
      else setGreeting("Good evening")
    }
    
    updateGreeting()
    const interval = setInterval(() => {
      setCurrentTime(new Date())
      updateGreeting()
    }, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-2">
            {greeting}, {user?.user_metadata?.full_name || "there"}!
          </h1>
          <p className="text-2xl text-muted-foreground">
            {format(currentTime, "EEEE, MMMM d, yyyy")}
          </p>
          <p className="text-4xl font-mono mt-2">
            {format(currentTime, "HH:mm")}
          </p>
        </motion.div>
        
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <SearchBar />
        </motion.div>
        
        {/* Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <QuickLinks />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ProductivityStats />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <WeatherWidget />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-3"
          >
            <RecentActivity />
          </motion.div>
        </div>
      </div>
    </div>
  )
}