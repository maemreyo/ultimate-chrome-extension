import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "~components/ui/card"
import { Cloud, CloudRain, Sun, CloudSnow } from "lucide-react"

export function WeatherWidget() {
  const { data: weather } = useQuery({
    queryKey: ["weather"],
    queryFn: async () => {
      // Get user location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject)
      })
      
      // Fetch weather data (replace with your API)
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}&appid=YOUR_API_KEY&units=metric`
      )
      return response.json()
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: false
  })
  
  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case "Clear": return <Sun className="h-12 w-12" />
      case "Clouds": return <Cloud className="h-12 w-12" />
      case "Rain": return <CloudRain className="h-12 w-12" />
      case "Snow": return <CloudSnow className="h-12 w-12" />
      default: return <Cloud className="h-12 w-12" />
    }
  }
  
  if (!weather) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Weather</p>
              <p className="text-2xl font-bold">Loading...</p>
            </div>
            <Cloud className="h-12 w-12 text-muted-foreground animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{weather.name}</p>
            <p className="text-3xl font-bold">{Math.round(weather.main.temp)}°C</p>
            <p className="text-sm capitalize">{weather.weather[0].description}</p>
          </div>
          {getWeatherIcon(weather.weather[0].main)}
        </div>
      </CardContent>
    </Card>
  )
}