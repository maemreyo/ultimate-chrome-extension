const sharp = require('sharp')
const fs = require('fs').promises
const path = require('path')

const SIZES = [16, 48, 128, 512]
const SOURCE_ICON = 'assets/icon-source.png' // Your source icon (should be 512x512 or larger)
const OUTPUT_DIR = 'assets'

async function generateIcons() {
  try {
    // Ensure output directory exists
    await fs.mkdir(OUTPUT_DIR, { recursive: true })

    // Check if source icon exists
    try {
      await fs.access(SOURCE_ICON)
    } catch {
      console.log('Source icon not found. Creating placeholder icons...')
      await createPlaceholderIcons()
      return
    }

    // Generate icons from source
    console.log('Generating icons from source...')

    for (const size of SIZES) {
      const outputPath = path.join(OUTPUT_DIR, `icon-${size}.png`)

      await sharp(SOURCE_ICON)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath)

      console.log(`✓ Generated ${outputPath}`)
    }

    console.log('\n✅ All icons generated successfully!')

  } catch (error) {
    console.error('Error generating icons:', error)
    process.exit(1)
  }
}

async function createPlaceholderIcons() {
  const svg = (size) => `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#4F46E5" rx="${size * 0.2}"/>
      <text
        x="50%"
        y="50%"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="white"
        font-family="Arial, sans-serif"
        font-size="${size * 0.4}px"
        font-weight="bold"
      >
        ${size}
      </text>
    </svg>
  `

  for (const size of SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}.png`)

    await sharp(Buffer.from(svg(size)))
      .png()
      .toFile(outputPath)

    console.log(`✓ Created placeholder ${outputPath}`)
  }

  console.log('\n⚠️  Placeholder icons created. Replace with your actual icon!')
  console.log(`Place your source icon at: ${SOURCE_ICON}`)
}

// Run the script
generateIcons()
