import React from 'react'
import { NotificationProvider, NotificationListener } from './notifications'

export function ExtensionUIProvider({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <NotificationListener />
      {children}
    </NotificationProvider>
  )
}