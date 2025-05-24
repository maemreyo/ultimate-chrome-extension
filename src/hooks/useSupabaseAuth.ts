import type { User } from "@supabase/supabase-js"
import { useEffect, useState } from "react"

import { supabase, supabaseAuth } from "~core/supabase"

import { useStorage } from "./useStorage"

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [, setStoredUser] = useStorage("user")

  useEffect(() => {
    // Get initial session
    supabaseAuth.getSession().then((session) => {
      setUser(session?.user || null)
      if (session?.user) {
        setStoredUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.full_name || ""
        })
      }
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabaseAuth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        setStoredUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.full_name || ""
        })
      } else {
        setStoredUser(undefined)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { user } = await supabaseAuth.signIn(email, password)
    return user
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { user } = await supabaseAuth.signUp(email, password, fullName)
    return user
  }

  const signInWithGoogle = async () => {
    const { user } = await supabaseAuth.signInWithGoogle()
    return user
  }

  const signOut = async () => {
    await supabaseAuth.signOut()
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signInWithGoogle,
    signOut
  }
}
