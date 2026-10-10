/** Export the shared AI.pm vector as browser, desktop, installer, and local macOS app assets. */
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import sharp from 'sharp'
import { AI_PM_MARK_SVG } from '../../../packages/client/ui-primitives/src/ai-pm-artwork.ts'
import { packIco, renderTrayIconEntries } from './render-tray-icon.ts'

const desktop = fileURLToPath(new URL('../', import.meta.url))
const svg = Buffer.from(AI_PM_MARK_SVG)
for (const name of ['icon', 'icon-macos', 'icon-windows']) {
  await writeFile(join(desktop, 'resources', `${name}.svg`), svg)
  await sharp(svg).png().toFile(join(desktop, 'resources', `${name}.png`))
}
for (const name of ['favicon.svg', 'favicon-dark.svg']) {
  await writeFile(fileURLToPath(new URL(`../../web/public/${name}`, import.meta.url)), svg)
}
await writeFile(join(desktop, 'renderer/assets/welcome-brand.svg'), svg)
await writeFile(join(desktop, 'resources/tray-windows.ico'), packIco(await renderTrayIconEntries(svg)))
await sharp(svg).resize(28, 28).png().toFile(fileURLToPath(new URL('../../../packages/client/ui-chat/src/client/chat/running-whale@2x.png', import.meta.url)))
for (const [name, width] of [['brand', 256], ['brand-2x', 512], ['brand-dark', 256], ['brand-dark-2x', 512]] as const) {
  await sharp(svg).resize(width, width).png().toFile(join(desktop, 'installer/assets', `${name}.png`))
}
const iconset = join(desktop, 'resources/ai-pm.iconset')
await mkdir(iconset, { recursive: true })
for (const size of [16, 32, 128, 256, 512]) {
  for (const scale of [1, 2]) {
    await sharp(svg).resize(size * scale).png().toFile(join(iconset, `icon_${size}x${size}${scale === 2 ? '@2x' : ''}.png`))
  }
}
console.info(`AI.pm brand assets exported; macOS iconset: ${iconset}`)
