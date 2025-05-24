import { storage } from "./storage"

export class ApiClient {
  private baseUrl: string
  private token: string | null = null
  
  constructor(baseUrl: string = process.env.PLASMO_PUBLIC_API_URL || "") {
    this.baseUrl = baseUrl
    this.loadToken()
  }
  
  private async loadToken() {
    this.token = await storage.get("auth_token")
  }
  
  async request<T = any>({
    endpoint,
    method = "GET",
    data,
    headers = {}
  }: {
    endpoint: string
    method?: string
    data?: any
    headers?: Record<string, string>
  }): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers
      }
    }
    
    if (this.token) {
      config.headers["Authorization"] = `Bearer ${this.token}`
    }
    
    if (data && method !== "GET") {
      config.body = JSON.stringify(data)
    }
    
    const response = await fetch(url, config)
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  }
}

export const apiClient = new ApiClient()