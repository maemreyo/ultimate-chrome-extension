const { execSync } = require('child_process')
const fs = require('fs').promises
const path = require('path')

const TARGETS = [
  { name: 'chrome', target: 'chrome-mv3' },
  { name: 'firefox', target: 'firefox-mv2' },
  { name: 'edge', target: 'edge-mv3' }
]

async function buildAll() {
  console.log('🚀 Building extension for all targets...\n')
  
  try {
    // Clean previous builds
    console.log('🧹 Cleaning previous builds...')
    await fs.rm('build', { recursive: true, force: true })
    
    // Build each target
    for (const { name, target } of TARGETS) {
      console.log(`\n📦 Building for ${name}...`)
      
      try {
        execSync(`pnpm plasmo build --target=${target}`, {
          stdio: 'inherit',
          env: { ...process.env, NODE_ENV: 'production' }
        })
        
        console.log(`✅ ${name} build complete!`)
        
        // Get build size
        const buildPath = path.join('build', `${target}-prod`)
        const stats = await getBuildSize(buildPath)
        console.log(`   Size: ${stats.size} (${stats.files} files)`)
        
      } catch (error) {
        console.error(`❌ Failed to build ${name}:`, error.message)
        process.exit(1)
      }
    }
    
    // Create packages
    console.log('\n📦 Creating distribution packages...')
    await createPackages()
    
    console.log('\n✅ All builds completed successfully!')
    console.log('\n📊 Build Summary:')
    
    for (const { name, target } of TARGETS) {
      const zipPath = path.join('build', `${name}-extension.zip`)
      try {
        const stats = await fs.stat(zipPath)
        console.log(`   ${name}: ${formatBytes(stats.size)}`)
      } catch (error) {
        console.log(`   ${name}: Not packaged`)
      }
    }
    
  } catch (error) {
    console.error('❌ Build failed:', error)
    process.exit(1)
  }
}

async function getBuildSize(dirPath) {
  let totalSize = 0
  let fileCount = 0
  
  async function walkDir(dir) {
    const files = await fs.readdir(dir)
    
    for (const file of files) {
      const filePath = path.join(dir, file)
      const stat = await fs.stat(filePath)
      
      if (stat.isDirectory()) {
        await walkDir(filePath)
      } else {
        totalSize += stat.size
        fileCount++
      }
    }
  }
  
  await walkDir(dirPath)
  
  return {
    size: formatBytes(totalSize),
    files: fileCount
  }
}

async function createPackages() {
  const archiver = require('archiver')
  
  for (const { name, target } of TARGETS) {
    const buildPath = path.join('build', `${target}-prod`)
    const outputPath = path.join('build', `${name}-extension.zip`)
    
    try {
      await fs.access(buildPath)
    } catch {
      console.log(`⚠️  Skipping ${name} package - build not found`)
      continue
    }
    
    await new Promise((resolve, reject) => {
      const output = require('fs').createWriteStream(outputPath)
      const archive = archiver('zip', { zlib: { level: 9 } })
      
      output.on('close', resolve)
      archive.on('error', reject)
      
      archive.pipe(output)
      archive.directory(buildPath, false)
      archive.finalize()
    })
    
    console.log(`✅ Created ${name}-extension.zip`)
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Check if archiver is installed
try {
  require('archiver')
} catch {
  console.log('📦 Installing archiver for packaging...')
  execSync('pnpm add -D archiver', { stdio: 'inherit' })
}

// Run the build
buildAll()

