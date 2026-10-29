/** Launch the source workbench through the existing Desktop/Web profiles on macOS or Windows. */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { posix, win32, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

/**
 * Resolve a source launch without mutating caller settings or moving existing data.
 * @param {import('./start-workbench.mjs').WorkbenchLaunchOptions} options Source location, host, environment, and surface.
 * @returns {import('./start-workbench.mjs').WorkbenchLaunchPlan} Shell-free pnpm steps and their environment.
 */
export function sourceWorkbenchPlan({ root, platform, arch, nodeVersion, environment, web = false, skipBuild = false }) {
  const windows = platform === 'win32'
  if (!(windows && arch === 'x64') && !(platform === 'darwin' && ['arm64', 'x64'].includes(arch))) {
    throw new Error('This launcher requires macOS (Apple Silicon or Intel) or Windows x64.')
  }
  const [major, minor] = nodeVersion.split('.').map(Number)
  if (!(major > 24 || (major === 24 && minor >= 9))) throw new Error('Install Node.js 24.9+ before starting the workbench.')
  const paths = windows ? win32 : posix
  if (!paths.isAbsolute(root)) throw new Error('Workbench source directory must be absolute.')
  const base = paths.normalize(root)
  const development = paths.join(base, 'apps', 'desktop', '.desktop-build', 'development')
  const home = environment.DSH_HOME?.trim()
    ? paths.resolve(base, environment.DSH_HOME)
    : windows ? paths.join(base, '.dsh-home') : web ? undefined : paths.join(development, 'home')
  const data = windows || !web ? {
    DSH_HOME: home,
    DSH_DESKTOP_USER_DATA_DIR: environment.DSH_DESKTOP_USER_DATA_DIR?.trim()
      ? paths.resolve(base, environment.DSH_DESKTOP_USER_DATA_DIR)
      : windows ? paths.join(home, 'desktop-user-data') : paths.join(development, 'electron-user-data'),
  } : home === undefined ? {} : { DSH_HOME: home }
  return {
    cwd: base,
    environment: {
      ...environment,
      ...data,
      DSH_CLIENT_TITLE: 'zhang.workbench',
      DSH_DESKTOP_WELCOME: '0',
      DSH_DESKTOP_OPEN_DEVTOOLS: '0',
    },
    commands: [
      ...web ? [] : [['--filter', '@deepseek-ai/dsh-desktop', 'exec', 'install-electron']],
      ['run', `${skipBuild ? 'start' : 'dev'}:${web ? 'web' : 'desktop'}`],
    ],
  }
}

/**
 * Run each source-launch step, waiting for process closure and stopping on failure.
 * @param {import('./start-workbench.mjs').WorkbenchLaunchPlan} plan Resolved launch.
 * @param {string} pnpm Absolute local pnpm script path.
 * @returns {Promise<void>} Completion of all launch steps.
 */
export async function runWorkbenchCommands(plan, pnpm) {
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

/**
 * Check or launch the checkout using the current native host and command-line flags.
 * @param {string} root Absolute checkout directory.
 * @returns {Promise<void>} Completion of the check or supported launch.
 */
export async function launchSourceWorkbench(root) {
  const { values } = parseArgs({ options: {
    check: { type: 'boolean', default: false },
    web: { type: 'boolean', default: false },
    'skip-build': { type: 'boolean', default: false },
  } })
  const plan = sourceWorkbenchPlan({ root, platform: process.platform, arch: process.arch,
    nodeVersion: process.versions.node, environment: process.env, web: values.web, skipBuild: values['skip-build'] })
  const pnpm = resolve(root, 'node_modules/pnpm/bin/pnpm.cjs')
  if (!existsSync(pnpm)) throw new Error('Dependencies are missing. Install pnpm 11.28.5, then run pnpm install in the source directory.')
  if (values.check) {
    console.log(`Source launcher checks passed (${process.platform}/${process.arch}). No build, download, or application launch was performed.`)
    return
  }
  console.log('Starting zhang.workbench from source. First launch may download Electron/runtime files and build the application.')
  await runWorkbenchCommands(plan, pnpm)
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await launchSourceWorkbench(fileURLToPath(new URL('..', import.meta.url)))
    .catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1 })
}
