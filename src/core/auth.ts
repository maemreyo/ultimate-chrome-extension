import { Storage } from "@plasmohq/storage"
import { apiClient } from "./api"

export class AuthManager {
  private storage: Storage
  
  constructor() {
    this.storage = new Storage({ area: "local" })
  }
  
  async login(credentials: { email: string; password: string }) {
    try {
      const response = await apiClient.request({
        endpoint: "/auth/login",
        method: "POST",
        data: credentials
      })
      
      await this.storage.set("auth_token", response.token)
      await this.storage.set("user", response.user)
      
      return response.user
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    }
  }
  
  async loginWithGoogle() {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, async (token) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
          return
        }
        
        try {
          const response = await apiClient.request({
            endpoint: "/auth/google",
            method: "POST",
            data: { token }
          })
          
          await this.storage.set("auth_token", response.token)
          await this.storage.set("user", response.user)
          
          resolve(response.user)
        } catch (error) {
          reject(error)
        }
      })
    })
  }
  
  async logout() {
    await this.storage.remove("auth_token")
    await this.storage.remove("user")
  }
  
  async isAuthenticated(): Promise<boolean> {
    const token = await this.storage.get("auth_token")
    return !!token
  }
  
  async getUser() {
    return this.storage.get("user")
  }
}

export const authManager = new AuthManager()

export function initializeAuth() {
  // Setup auth state listeners
  chrome.identity.onSignInChanged.addListener((account, signedIn) => {
    console.log("Sign in state changed:", account, signedIn)
  })
}