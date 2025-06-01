interface PooledConnection {
  id: string
  provider: string
  inUse: boolean
  lastUsed: number
  requestCount: number
  errorCount: number
}

export class ConnectionPool {
  private connections = new Map<string, PooledConnection[]>()
  private maxConnectionsPerProvider = 5
  private connectionTimeout = 30000 // 30 seconds
  private healthCheckInterval = 60000 // 1 minute

  constructor() {
    // Start health check interval
    setInterval(() => this.healthCheck(), this.healthCheckInterval)
  }

  async getConnection(provider: string): Promise<PooledConnection> {
    if (!this.connections.has(provider)) {
      this.connections.set(provider, [])
    }

    const pool = this.connections.get(provider)!

    // Try to find an available connection
    let connection = pool.find(c => !c.inUse && Date.now() - c.lastUsed < this.connectionTimeout)

    if (!connection && pool.length < this.maxConnectionsPerProvider) {
      // Create new connection
      connection = {
        id: crypto.randomUUID(),
        provider,
        inUse: false,
        lastUsed: Date.now(),
        requestCount: 0,
        errorCount: 0
      }
      pool.push(connection)
    } else if (!connection) {
      // Wait for a connection to become available
      connection = await this.waitForConnection(provider)
    }

    connection.inUse = true
    connection.lastUsed = Date.now()
    connection.requestCount++

    return connection
  }

  releaseConnection(connectionId: string, hadError: boolean = false) {
    for (const pool of this.connections.values()) {
      const connection = pool.find(c => c.id === connectionId)
      if (connection) {
        connection.inUse = false
        if (hadError) connection.errorCount++

        // Remove connection if too many errors
        if (connection.errorCount > 5) {
          const index = pool.indexOf(connection)
          pool.splice(index, 1)
        }
        break
      }
    }
  }

  private async waitForConnection(provider: string, timeout: number = 10000): Promise<PooledConnection> {
    const start = Date.now()

    while (Date.now() - start < timeout) {
      const pool = this.connections.get(provider)!
      const available = pool.find(c => !c.inUse)

      if (available) return available

      await new Promise(resolve => setTimeout(resolve, 100))
    }

    throw new Error(`Connection timeout for provider: ${provider}`)
  }

  private healthCheck() {
    for (const [provider, pool] of this.connections.entries()) {
      // Remove stale connections
      const now = Date.now()
      const activeConnections = pool.filter(c => {
        if (!c.inUse && now - c.lastUsed > this.connectionTimeout) {
          return false
        }
        return true
      })

      this.connections.set(provider, activeConnections)
    }
  }

  getPoolStats() {
    const stats: Record<string, any> = {}

    for (const [provider, pool] of this.connections.entries()) {
      stats[provider] = {
        total: pool.length,
        inUse: pool.filter(c => c.inUse).length,
        available: pool.filter(c => !c.inUse).length,
        totalRequests: pool.reduce((sum, c) => sum + c.requestCount, 0),
        totalErrors: pool.reduce((sum, c) => sum + c.errorCount, 0)
      }
    }

    return stats
  }
}