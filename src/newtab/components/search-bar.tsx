import { Globe, Image, Newspaper, Search, Video } from "lucide-react"
import { useState } from "react"

import { Button } from "~components/ui/button"
import { Input } from "~components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "~components/ui/tabs"

export function SearchBar() {
  const [query, setQuery] = useState("")
  const [searchType, setSearchType] = useState("web")

  const searchEngines = {
    web: "https://www.google.com/search?q=",
    images: "https://www.google.com/search?tbm=isch&q=",
    videos: "https://www.youtube.com/results?search_query=",
    news: "https://news.google.com/search?q="
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    const url =
      searchEngines[searchType as keyof typeof searchEngines] +
      encodeURIComponent(query)
    window.location.href = url
  }

  return (
    <form onSubmit={handleSearch} className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
        <Input
          type="text"
          placeholder="Search the web..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-4 py-6 text-lg"
          autoFocus
        />
      </div>

      <Tabs value={searchType} onValueChange={setSearchType}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="web" className="gap-2">
            <Globe className="h-4 w-4" />
            Web
          </TabsTrigger>
          <TabsTrigger value="images" className="gap-2">
            <Image className="h-4 w-4" />
            Images
          </TabsTrigger>
          <TabsTrigger value="videos" className="gap-2">
            <Video className="h-4 w-4" />
            Videos
          </TabsTrigger>
          <TabsTrigger value="news" className="gap-2">
            <Newspaper className="h-4 w-4" />
            News
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </form>
  )
}
