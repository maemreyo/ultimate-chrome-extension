import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { sendToBackground } from "@plasmohq/messaging"
import { useStorage } from "./useStorage"

export function useAuth() {
  const [user, setUser] = useStorage("user")
  const queryClient = useQueryClient()
  
  const { data: isAuthenticated, isLoading } = useQuery({
    queryKey: ["auth", "status"],
    queryFn: async () => {
      const response = await sendToBackground({
        name: "auth",
        body: { action: "check" }
      })
      return response.isAuthenticated
    }
  })
  
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await sendToBackground({
        name: "auth",
        body: { action: "login", credentials }
      })
      if (!response.success) throw new Error(response.error)
      return response.user
    },
    onSuccess: (user) => {
      setUser(user)
      queryClient.invalidateQueries({ queryKey: ["auth"] })
    }
  })
  
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await sendToBackground({
        name: "auth",
        body: { action: "logout" }
      })
      if (!response.success) throw new Error(response.error)
    },
    onSuccess: () => {
      setUser(undefined)
      queryClient.invalidateQueries({ queryKey: ["auth"] })
    }
  })
  
  return {
    user,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending
  }
}