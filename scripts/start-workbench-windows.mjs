/** Launch the source workbench on Windows through the existing Desktop/Web profiles. */
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { launchSourceWorkbench, sourceWorkbenchPlan } from './start-workbench.mjs'

/**
 * Resolve an unpackaged Windows workbench launch without mutating caller settings.
 * @param {{root: string, platform: string, arch: string, nodeVersion: string, environment: NodeJS.ProcessEnv, web?: boolean, skipBuild?: boolean}} options Launch inputs.
 * @returns {{cwd: string, environment: NodeJS.ProcessEnv, commands: string[][]}} Shell-free pnpm launch plan.
 */
export function windowsWorkbenchPlan({ root, platform, arch, nodeVersion, environment, web = false, skipBuild = false }) {
  if (platform !== 'win32' || arch !== 'x64') throw new Error('This launcher requires Windows x64. Use start-workbench.command on macOS.')
  return sourceWorkbenchPlan({ root, platform, arch, nodeVersion, environment, web, skipBuild })
}

async function main() {
  if (process.platform !== 'win32' || process.arch !== 'x64') throw new Error('This launcher requires Windows x64. Use start-workbench.command on macOS.')
  await launchSourceWorkbench(fileURLToPath(new URL('..', import.meta.url)))
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await main().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1 })
}
