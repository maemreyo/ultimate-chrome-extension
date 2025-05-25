interface ExtensionAPI {
  version: string
  sendMessage: (message: any) => Promise<any>
}

declare global {
  interface Window {
    __EXTENSION_INJECTED__?: boolean
    extensionAPI?: ExtensionAPI
  }
}

export {}
