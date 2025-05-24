import { TypedStorage } from "~core/storage"

describe("TypedStorage", () => {
  let storage: TypedStorage
  
  beforeEach(() => {
    storage = new TypedStorage()
    // Mock chrome.storage
    global.chrome = {
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn(),
          remove: jest.fn()
        }
      }
    } as any
  })
  
  test("should get value with correct type", async () => {
    const mockUser = { id: "1", email: "test@example.com", name: "Test User" }
    chrome.storage.local.get.mockResolvedValue({ user: mockUser })
    
    const user = await storage.get("user")
    expect(user).toEqual(mockUser)
  })
  
  test("should set value with correct type", async () => {
    const settings = { theme: "dark" as const, notifications: true, autoSync: false }
    await storage.set("settings", settings)
    
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ settings })
  })
})