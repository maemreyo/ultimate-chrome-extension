import { useState } from "react"
import toast from "react-hot-toast"

import { Avatar, AvatarFallback, AvatarImage } from "~components/ui/avatar"
import { Button } from "~components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "~components/ui/card"
import { Input } from "~components/ui/input"
import { Label } from "~components/ui/label"
import { db } from "~core/supabase"
import { useSupabaseAuth } from "~hooks/useSupabaseAuth"

export function AccountSettings() {
  const { user, signOut } = useSupabaseAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [profile, setProfile] = useState({
    full_name: user?.user_metadata?.full_name || "",
    avatar_url: user?.user_metadata?.avatar_url || ""
  })

  const handleUpdateProfile = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      await db.updateUserProfile(user.id, profile)
      toast.success("Profile updated successfully!")
    } catch (error) {
      toast.error("Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      chrome.tabs.create({ url: chrome.runtime.getURL("tabs/auth.html") })
      window.close()
    } catch (error) {
      toast.error("Failed to sign out")
    }
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            You need to sign in to manage your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() =>
              chrome.tabs.create({
                url: chrome.runtime.getURL("tabs/auth.html")
              })
            }>
            Sign In
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback>
                {profile.full_name?.[0] || user.email?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {profile.full_name || "No name set"}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={profile.full_name}
              onChange={(e) =>
                setProfile({ ...profile, full_name: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar_url">Avatar URL</Label>
            <Input
              id="avatar_url"
              value={profile.avatar_url}
              onChange={(e) =>
                setProfile({ ...profile, avatar_url: e.target.value })
              }
            />
          </div>

          <Button onClick={handleUpdateProfile} disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Profile"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
          <CardDescription>Manage your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            onClick={() =>
              chrome.tabs.create({
                url: chrome.runtime.getURL("tabs/pricing.html")
              })
            }>
            Manage Subscription
          </Button>
          <Button variant="destructive" onClick={handleSignOut}>
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
