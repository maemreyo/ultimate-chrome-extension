import { createClient } from "@supabase/supabase-js"
import { Storage } from "@plasmohq/storage"

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          subscription_status: "free" | "pro" | "premium"
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>
      }
      user_data: {
        Row: {
          id: string
          user_id: string
          title: string
          content: any
          url: string | null
          tags: string[]
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["user_data"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["user_data"]["Insert"]>
      }
    }
  }
}

// Custom storage adapter for Supabase Auth
const storage = new Storage({
  area: "local"
})

const supabaseStorage = {
  getItem: async (key: string) => {
    const data = await storage.get(key)
    return data ? JSON.stringify(data) : null
  },
  setItem: async (key: string, value: string) => {
    await storage.set(key, JSON.parse(value))
  },
  removeItem: async (key: string) => {
    await storage.remove(key)
  }
}

// Create Supabase client
export const supabase = createClient<Database>(
  process.env.PLASMO_PUBLIC_SUPABASE_URL!,
  process.env.PLASMO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: supabaseStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  }
)

// Auth helpers
export const supabaseAuth = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  },

  async signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })
    if (error) throw error
    return data
  },

  async signInWithGoogle() {
    // This will be handled via Chrome Identity API
    const token = await chrome.identity.getAuthToken({ interactive: true })
    if (!token) throw new Error("No auth token received")
    
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token
    })
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Database helpers
export const db = {
  async getUserData(userId: string) {
    const { data, error } = await supabase
      .from("user_data")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    
    if (error) throw error
    return data
  },

  async saveUserData(data: Database["public"]["Tables"]["user_data"]["Insert"]) {
    const { data: result, error } = await supabase
      .from("user_data")
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return result
  },

  async deleteUserData(id: string) {
    const { error } = await supabase
      .from("user_data")
      .delete()
      .eq("id", id)
    
    if (error) throw error
  },

  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single()
    
    if (error) throw error
    return data
  },

  async updateUserProfile(userId: string, updates: Database["public"]["Tables"]["users"]["Update"]) {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}