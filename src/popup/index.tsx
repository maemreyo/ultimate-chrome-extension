import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "~components/theme-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~components/ui/tabs"
import { HomeTab } from "./tabs/home"
import { SettingsTab } from "./tabs/settings"
import { DataTab } from "./tabs/data"
import "~styles/globals.css"

const queryClient = new QueryClient()

function IndexPopup() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <div className="w-[400px] h-[600px] bg-background">
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Extension Control Panel</h1>
            
            <Tabs defaultValue="home" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="home">Home</TabsTrigger>
                <TabsTrigger value="data">Data</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="home">
                <HomeTab />
              </TabsContent>
              
              <TabsContent value="data">
                <DataTab />
              </TabsContent>
              
              <TabsContent value="settings">
                <SettingsTab />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default IndexPopup