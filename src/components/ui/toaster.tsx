import { Toaster as HotToaster } from "react-hot-toast"

export function Toaster() {
  return (
    <HotToaster
      position="bottom-right"
      toastOptions={{
        className: "bg-background text-foreground border border-border shadow-lg",
        duration: 3000,
        style: {
          padding: "16px",
          borderRadius: "8px",
        },
      }}
    />
  )
}