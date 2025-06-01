// src/modules/storage/utilities/storage-migration-helpers.ts
// Database migration and schema evolution utilities

import type { Migration } from "./storage-validation-helpers"

/**
 * Migration status
 */
export interface MigrationStatus {
  currentVersion: number
  targetVersion: number
  pendingMigrations: Migration[]
  appliedMigrations: AppliedMigration[]
  isUpToDate: boolean
}

/**
 * Applied migration record
 */
export interface AppliedMigration {
  version: number
  appliedAt: Date
  duration: number
  checksum: string
}

/**
 * Migration execution result
 */
export interface MigrationResult {
  success: boolean
  version: number
  duration: number
  error?: string
  rollback?: boolean
}

/**
 * Migration plan
 */
export interface MigrationPlan {
  fromVersion: number
  toVersion: number
  migrations: Migration[]
  estimatedDuration: number
  backupRequired: boolean
}

/**
 * Database migration manager
 */
export class MigrationManager {
  private db: any
  private migrations: Map<number, Migration> = new Map()
  private appliedMigrations: Map<number, AppliedMigration> = new Map()

  constructor(db: any) {
    this.db = db
  }

  /**
   * Register a migration
   * @param migration - Migration to register
   */
  registerMigration(migration: Migration): void {
    if (this.migrations.has(migration.version)) {
      throw new Error(`Migration version ${migration.version} already exists`)
    }
    this.migrations.set(migration.version, migration)
  }

  /**
   * Register multiple migrations
   * @param migrations - Migrations to register
   */
  registerMigrations(migrations: Migration[]): void {
    for (const migration of migrations) {
      this.registerMigration(migration)
    }
  }

  /**
   * Get current database version
   * @returns Current version
   */
  async getCurrentVersion(): Promise<number> {
    try {
      const versionRecord = await this.db.metadata?.get("schema_version")
      return versionRecord?.value || 0
    } catch {
      return 0
    }
  }

  /**
   * Set database version
   * @param version - Version to set
   */
  async setCurrentVersion(version: number): Promise<void> {
    await this.db.metadata?.put({
      key: "schema_version",
      value: version,
      updatedAt: new Date()
    })
  }

  /**
   * Get migration status
   * @param targetVersion - Target version (optional)
   * @returns Migration status
   */
  async getMigrationStatus(targetVersion?: number): Promise<MigrationStatus> {
    const currentVersion = await this.getCurrentVersion()
    const target = targetVersion || this.getLatestVersion()

    await this.loadAppliedMigrations()

    const pendingMigrations = this.getPendingMigrations(currentVersion, target)

    return {
      currentVersion,
      targetVersion: target,
      pendingMigrations,
      appliedMigrations: Array.from(this.appliedMigrations.values()),
      isUpToDate: pendingMigrations.length === 0
    }
  }

  /**
   * Create migration plan
   * @param targetVersion - Target version
   * @returns Migration plan
   */
  async createMigrationPlan(targetVersion?: number): Promise<MigrationPlan> {
    const currentVersion = await this.getCurrentVersion()
    const target = targetVersion || this.getLatestVersion()

    const migrations = this.getPendingMigrations(currentVersion, target)
    const estimatedDuration = this.estimateMigrationDuration(migrations)
    const backupRequired = this.requiresBackup(migrations)

    return {
      fromVersion: currentVersion,
      toVersion: target,
      migrations,
      estimatedDuration,
      backupRequired
    }
  }

  /**
   * Execute migrations to target version
   * @param targetVersion - Target version (optional)
   * @param options - Migration options
   * @returns Array of migration results
   */
  async migrate(
    targetVersion?: number,
    options: {
      dryRun?: boolean
      backup?: boolean
      continueOnError?: boolean
    } = {}
  ): Promise<MigrationResult[]> {
    const plan = await this.createMigrationPlan(targetVersion)
    const results: MigrationResult[] = []

    if (options.dryRun) {
      console.log(
        "Dry run - would execute migrations:",
        plan.migrations.map((m) => m.version)
      )
      return results
    }

    // Create backup if required
    if (options.backup || plan.backupRequired) {
      await this.createBackup()
    }

    // Execute migrations in order
    for (const migration of plan.migrations) {
      try {
        const result = await this.executeMigration(migration)
        results.push(result)

        if (!result.success && !options.continueOnError) {
          break
        }
      } catch (error) {
        const result: MigrationResult = {
          success: false,
          version: migration.version,
          duration: 0,
          error: error.message
        }
        results.push(result)

        if (!options.continueOnError) {
          break
        }
      }
    }

    return results
  }

  /**
   * Rollback to specific version
   * @param targetVersion - Version to rollback to
   * @returns Array of rollback results
   */
  async rollback(targetVersion: number): Promise<MigrationResult[]> {
    const currentVersion = await this.getCurrentVersion()

    if (targetVersion >= currentVersion) {
      throw new Error("Target version must be lower than current version")
    }

    const results: MigrationResult[] = []

    // Get migrations to rollback (in reverse order)
    const migrationsToRollback = Array.from(this.migrations.values())
      .filter((m) => m.version > targetVersion && m.version <= currentVersion)
      .sort((a, b) => b.version - a.version)

    for (const migration of migrationsToRollback) {
      try {
        const result = await this.rollbackMigration(migration)
        results.push(result)

        if (!result.success) {
          break
        }
      } catch (error) {
        const result: MigrationResult = {
          success: false,
          version: migration.version,
          duration: 0,
          error: error.message,
          rollback: true
        }
        results.push(result)
        break
      }
    }

    return results
  }

  /**
   * Validate migration integrity
   * @returns Validation result
   */
  async validateMigrations(): Promise<{
    isValid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    // Check for version gaps
    const versions = Array.from(this.migrations.keys()).sort((a, b) => a - b)
    for (let i = 1; i < versions.length; i++) {
      if (versions[i] - versions[i - 1] > 1) {
        warnings.push(
          `Version gap detected: ${versions[i - 1]} -> ${versions[i]}`
        )
      }
    }

    // Check for duplicate versions
    const duplicates = this.findDuplicateVersions()
    if (duplicates.length > 0) {
      errors.push(`Duplicate migration versions: ${duplicates.join(", ")}`)
    }

    // Validate migration functions
    for (const [version, migration] of this.migrations) {
      if (typeof migration.up !== "function") {
        errors.push(`Migration ${version}: 'up' function is required`)
      }
      if (typeof migration.down !== "function") {
        errors.push(`Migration ${version}: 'down' function is required`)
      }
      if (!migration.description) {
        warnings.push(`Migration ${version}: missing description`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Execute a single migration
   * @param migration - Migration to execute
   * @returns Migration result
   */
  private async executeMigration(
    migration: Migration
  ): Promise<MigrationResult> {
    const startTime = Date.now()

    try {
      console.log(
        `Executing migration ${migration.version}: ${migration.description}`
      )

      await migration.up(this.db)

      const duration = Date.now() - startTime

      // Record applied migration
      await this.recordAppliedMigration(migration, duration)

      // Update current version
      await this.setCurrentVersion(migration.version)

      return {
        success: true,
        version: migration.version,
        duration
      }
    } catch (error) {
      const duration = Date.now() - startTime

      return {
        success: false,
        version: migration.version,
        duration,
        error: error.message
      }
    }
  }

  /**
   * Rollback a single migration
   * @param migration - Migration to rollback
   * @returns Migration result
   */
  private async rollbackMigration(
    migration: Migration
  ): Promise<MigrationResult> {
    const startTime = Date.now()

    try {
      console.log(
        `Rolling back migration ${migration.version}: ${migration.description}`
      )

      await migration.down(this.db)

      const duration = Date.now() - startTime

      // Remove applied migration record
      await this.removeAppliedMigration(migration.version)

      // Update current version
      const previousVersion = this.getPreviousVersion(migration.version)
      await this.setCurrentVersion(previousVersion)

      return {
        success: true,
        version: migration.version,
        duration,
        rollback: true
      }
    } catch (error) {
      const duration = Date.now() - startTime

      return {
        success: false,
        version: migration.version,
        duration,
        error: error.message,
        rollback: true
      }
    }
  }

  /**
   * Get latest migration version
   * @returns Latest version
   */
  private getLatestVersion(): number {
    const versions = Array.from(this.migrations.keys())
    return versions.length > 0 ? Math.max(...versions) : 0
  }

  /**
   * Get pending migrations
   * @param currentVersion - Current version
   * @param targetVersion - Target version
   * @returns Array of pending migrations
   */
  private getPendingMigrations(
    currentVersion: number,
    targetVersion: number
  ): Migration[] {
    return Array.from(this.migrations.values())
      .filter((m) => m.version > currentVersion && m.version <= targetVersion)
      .sort((a, b) => a.version - b.version)
  }

  /**
   * Get previous version
   * @param version - Current version
   * @returns Previous version
   */
  private getPreviousVersion(version: number): number {
    const versions = Array.from(this.migrations.keys())
      .filter((v) => v < version)
      .sort((a, b) => b - a)

    return versions.length > 0 ? versions[0] : 0
  }

  /**
   * Load applied migrations from database
   */
  private async loadAppliedMigrations(): Promise<void> {
    try {
      const records = (await this.db.migrations?.toArray()) || []

      this.appliedMigrations.clear()
      for (const record of records) {
        this.appliedMigrations.set(record.version, {
          version: record.version,
          appliedAt: new Date(record.appliedAt),
          duration: record.duration,
          checksum: record.checksum
        })
      }
    } catch (error) {
      console.warn("Failed to load applied migrations:", error)
    }
  }

  /**
   * Record applied migration
   * @param migration - Applied migration
   * @param duration - Execution duration
   */
  private async recordAppliedMigration(
    migration: Migration,
    duration: number
  ): Promise<void> {
    const checksum = this.calculateMigrationChecksum(migration)

    const record = {
      version: migration.version,
      appliedAt: new Date(),
      duration,
      checksum,
      description: migration.description
    }

    await this.db.migrations?.put(record)

    this.appliedMigrations.set(migration.version, {
      version: migration.version,
      appliedAt: record.appliedAt,
      duration,
      checksum
    })
  }

  /**
   * Remove applied migration record
   * @param version - Migration version
   */
  private async removeAppliedMigration(version: number): Promise<void> {
    await this.db.migrations?.where("version").equals(version).delete()
    this.appliedMigrations.delete(version)
  }

  /**
   * Calculate migration checksum
   * @param migration - Migration to checksum
   * @returns Checksum string
   */
  private calculateMigrationChecksum(migration: Migration): string {
    const content = migration.up.toString() + migration.down.toString()
    return btoa(content).slice(0, 16)
  }

  /**
   * Estimate migration duration
   * @param migrations - Migrations to estimate
   * @returns Estimated duration in milliseconds
   */
  private estimateMigrationDuration(migrations: Migration[]): number {
    // Simple estimation based on number of migrations
    // In practice, this could be more sophisticated
    return migrations.length * 1000 // 1 second per migration
  }

  /**
   * Check if backup is required
   * @param migrations - Migrations to check
   * @returns True if backup is required
   */
  private requiresBackup(migrations: Migration[]): boolean {
    // Require backup for any migration (conservative approach)
    return migrations.length > 0
  }

  /**
   * Create database backup
   */
  private async createBackup(): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const backupKey = `backup_${timestamp}`

      // Export all data
      const allData = await this.exportAllData()

      // Store backup
      await this.db.backups?.put({
        key: backupKey,
        data: allData,
        createdAt: new Date(),
        version: await this.getCurrentVersion()
      })

      console.log(`Backup created: ${backupKey}`)
    } catch (error) {
      console.error("Failed to create backup:", error)
      throw new Error("Backup creation failed")
    }
  }

  /**
   * Export all database data
   * @returns Exported data
   */
  private async exportAllData(): Promise<any> {
    const data: any = {}

    try {
      // Export all tables
      for (const tableName of this.db.tables.map((t: any) => t.name)) {
        data[tableName] = (await this.db[tableName]?.toArray()) || []
      }
    } catch (error) {
      console.warn("Failed to export some data:", error)
    }

    return data
  }

  /**
   * Find duplicate migration versions
   * @returns Array of duplicate versions
   */
  private findDuplicateVersions(): number[] {
    const versions = Array.from(this.migrations.keys())
    const seen = new Set<number>()
    const duplicates: number[] = []

    for (const version of versions) {
      if (seen.has(version)) {
        duplicates.push(version)
      } else {
        seen.add(version)
      }
    }

    return duplicates
  }
}

/**
 * Common migration utilities
 */
export class MigrationUtils {
  /**
   * Create table migration
   * @param tableName - Table name
   * @param schema - Table schema
   * @returns Migration functions
   */
  static createTable(
    tableName: string,
    schema: string
  ): {
    up: (db: any) => Promise<void>
    down: (db: any) => Promise<void>
  } {
    return {
      up: async (db: any) => {
        await db.version(db.verno + 1).stores({
          [tableName]: schema
        })
      },
      down: async (db: any) => {
        await db.version(db.verno + 1).stores({
          [tableName]: null
        })
      }
    }
  }

  /**
   * Add column migration
   * @param tableName - Table name
   * @param columnName - Column name
   * @param defaultValue - Default value
   * @returns Migration functions
   */
  static addColumn(
    tableName: string,
    columnName: string,
    defaultValue?: any
  ): {
    up: (db: any) => Promise<void>
    down: (db: any) => Promise<void>
  } {
    return {
      up: async (db: any) => {
        const items = await db[tableName].toArray()
        for (const item of items) {
          item[columnName] = defaultValue
          await db[tableName].put(item)
        }
      },
      down: async (db: any) => {
        const items = await db[tableName].toArray()
        for (const item of items) {
          delete item[columnName]
          await db[tableName].put(item)
        }
      }
    }
  }

  /**
   * Rename column migration
   * @param tableName - Table name
   * @param oldName - Old column name
   * @param newName - New column name
   * @returns Migration functions
   */
  static renameColumn(
    tableName: string,
    oldName: string,
    newName: string
  ): {
    up: (db: any) => Promise<void>
    down: (db: any) => Promise<void>
  } {
    return {
      up: async (db: any) => {
        const items = await db[tableName].toArray()
        for (const item of items) {
          if (oldName in item) {
            item[newName] = item[oldName]
            delete item[oldName]
            await db[tableName].put(item)
          }
        }
      },
      down: async (db: any) => {
        const items = await db[tableName].toArray()
        for (const item of items) {
          if (newName in item) {
            item[oldName] = item[newName]
            delete item[newName]
            await db[tableName].put(item)
          }
        }
      }
    }
  }

  /**
   * Data transformation migration
   * @param tableName - Table name
   * @param transform - Transform function
   * @param reverse - Reverse transform function
   * @returns Migration functions
   */
  static transformData(
    tableName: string,
    transform: (item: any) => any,
    reverse: (item: any) => any
  ): {
    up: (db: any) => Promise<void>
    down: (db: any) => Promise<void>
  } {
    return {
      up: async (db: any) => {
        const items = await db[tableName].toArray()
        for (const item of items) {
          const transformed = transform(item)
          await db[tableName].put(transformed)
        }
      },
      down: async (db: any) => {
        const items = await db[tableName].toArray()
        for (const item of items) {
          const reversed = reverse(item)
          await db[tableName].put(reversed)
        }
      }
    }
  }
}
