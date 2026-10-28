/** Launch the source workbench on Windows through the existing Desktop/Web profiles. */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { win32, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

/**
 * Resolve an unpackaged Windows workbench launch without mutating caller settings.
 * @param {{root: string, platform: string, arch: string, nodeVersion: string, environment: NodeJS.ProcessEnv, web?: boolean, skipBuild?: boolean}} options Launch inputs.
 * @returns {{cwd: string, environment: NodeJS.ProcessEnv, commands: string[][]}} Shell-free pnpm launch plan.
 */
export function windowsWorkbenchPlan({ root, platform, arch, nodeVersion, environment, web = false, skipBuild = false }) {
  if (platform !== 'win32' || arch !== 'x64') throw new Error('This launcher requires Windows x64. Keep using the existing macOS launcher on a Mac.')
  const [major, minor] = nodeVersion.split('.').map(Number)
  if (!(major >= 24 || (major === 22 && minor >= 19))) throw new Error('Install Node.js 22.19+ (22.x) or 24+ before starting the workbench.')
  if (!win32.isAbsolute(root)) throw new Error('Workbench source directory must be absolute.')
  const base = win32.normalize(root)
  const home = environment.DSH_HOME?.trim()
    ? win32.resolve(base, environment.DSH_HOME)
    : win32.join(base, '.dsh-home')
  return {
    cwd: base,
    environment: {
      ...environment,
      DSH_CLIENT_TITLE: 'zhang.workbench',
      DSH_HOME: home,
      DSH_DESKTOP_USER_DATA_DIR: environment.DSH_DESKTOP_USER_DATA_DIR?.trim()
        ? win32.resolve(base, environment.DSH_DESKTOP_USER_DATA_DIR)
        : win32.join(home, 'desktop-user-data'),
      DSH_DESKTOP_WELCOME: '0',
      DSH_DESKTOP_OPEN_DEVTOOLS: '0',
    },
    commands: [
      ...web ? [] : [['--filter', '@deepseek-ai/dsh-desktop', 'exec', 'install-electron']],
      ['run', `${skipBuild ? 'start' : 'dev'}:${web ? 'web' : 'desktop'}`],
    ],
  }
}

async function main() {
  const { values } = parseArgs({ options: {
    check: { type: 'boolean', default: false },
    web: { type: 'boolean', default: false },
    'skip-build': { type: 'boolean', default: false },
  } })
  const root = fileURLToPath(new URL('..', import.meta.url))
  const plan = windowsWorkbenchPlan({ root, platform: process.platform, arch: process.arch,
    nodeVersion: process.versions.node, environment: process.env, web: values.web, skipBuild: values['skip-build'] })
  const pnpm = resolve(root, 'node_modules/pnpm/bin/pnpm.cjs')
  if (!existsSync(pnpm)) throw new Error('Dependencies are missing. Install pnpm 11.7.0, then run pnpm install in the source directory.')
  if (values.check) {
    console.log('Windows x64 and Node.js checks passed. No build, download, or application launch was performed.')
    return
  }
  console.log('Starting zhang.workbench from source. First launch may download Electron/runtime files and build the application.')
  for (const args of plan.commands) {
    await new Promise((done, reject) => {
      const child = spawn(process.execPath, [pnpm, ...args], { cwd: plan.cwd, env: plan.environment, stdio: 'inherit', shell: false })
      child.once('error', reject)
      child.once('close', (code, signal) => {
        if (code === 0) done()
        else reject(new Error(`Workbench step failed (${String(code ?? signal)}): pnpm ${args.join(' ')}`))
      })
    })
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await main().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1 })
}
