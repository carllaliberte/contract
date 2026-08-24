/**
 * Generates PNG launcher icons from public/favicon.svg (requires sharp).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.resolve(__dirname, '..', 'public')
const iconsDir = path.join(publicDir, 'icons')

async function main() {
  const sharp = (await import('sharp')).default
  const svgPath = path.join(publicDir, 'favicon.svg')
  const svg = fs.readFileSync(svgPath)

  fs.mkdirSync(iconsDir, { recursive: true })

  const sizes = [192, 512]
  for (const size of sizes) {
    const out = path.join(iconsDir, `icon-${size}.png`)
    await sharp(svg).resize(size, size).png().toFile(out)
    console.log('Wrote', out)
  }

  const playStore = path.join(iconsDir, 'play-store-512.png')
  await sharp(svg).resize(512, 512).png().toFile(playStore)
  console.log('Wrote', playStore)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
