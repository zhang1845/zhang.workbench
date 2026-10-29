/** Native launch plans and shell-free process execution for the source workbench. */
import { execFileSync } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, onTestFinished } from 'vitest'
import { runWorkbenchCommands, sourceWorkbenchPlan } from './start-workbench.mjs'

const root = "/Users/产品经理/AI Workbench ' $(literal)"
const input = { root, platform: 'darwin', arch: 'arm64', nodeVersion: '24.14.0', environment: {} }

describe('macOS workbench source launcher', () => {
  it.each(['arm64', 'x64'])('launches the existing Desktop profile on %s and rebuilds the current source', (arch) => {
    const plan = sourceWorkbenchPlan({ ...input, arch })
    expect(plan.cwd).toBe(root)
    expect(plan.commands).toEqual([
      ['--filter', '@deepseek-ai/dsh-desktop', 'exec', 'install-electron'], ['run', 'dev:desktop'],
    ])
    expect(plan.environment).toMatchObject({
      DSH_CLIENT_TITLE: 'zhang.workbench', DSH_DESKTOP_WELCOME: '0', DSH_DESKTOP_OPEN_DEVTOOLS: '0',
      DSH_HOME: `${root}/apps/desktop/.desktop-build/development/home`,
      DSH_DESKTOP_USER_DATA_DIR: `${root}/apps/desktop/.desktop-build/development/electron-user-data`,
    })
  })

  it('preserves explicit macOS data locations and the caller environment', () => {
    const environment = { DSH_HOME: '/Users/产品经理/原有数据', DSH_DESKTOP_USER_DATA_DIR: 'browser data', CUSTOM_FLAG: 'keep' }
    const plan = sourceWorkbenchPlan({ ...input, environment })
    expect(plan.environment.DSH_HOME).toBe(environment.DSH_HOME)
    expect(plan.environment.DSH_DESKTOP_USER_DATA_DIR).toBe(`${root}/browser data`)
    expect(plan.environment.CUSTOM_FLAG).toBe('keep')
    expect(environment).toEqual({ DSH_HOME: '/Users/产品经理/原有数据', DSH_DESKTOP_USER_DATA_DIR: 'browser data', CUSTOM_FLAG: 'keep' })
  })

  it('uses existing Web defaults without forcing Desktop settings into the Web home', () => {
    const plan = sourceWorkbenchPlan({ ...input, web: true })
    expect(plan.environment.DSH_HOME).toBeUndefined()
    expect(plan.environment.DSH_DESKTOP_USER_DATA_DIR).toBeUndefined()
    expect(plan.commands).toEqual([['run', 'dev:web']])
    expect(sourceWorkbenchPlan({ ...input, web: true, skipBuild: true }).commands).toEqual([['run', 'start:web']])
    expect(sourceWorkbenchPlan({ ...input, web: true, environment: { DSH_HOME: 'my data' } }).environment.DSH_HOME).toBe(`${root}/my data`)
  })

  it('can open existing Desktop artifacts only when skip-build is explicitly selected', () => {
    expect(sourceWorkbenchPlan({ ...input, skipBuild: true }).commands.at(-1)).toEqual(['run', 'start:desktop'])
  })

  it.each(['22.19.0', '22.22.0', '24.0.0', '26.0.0'])('accepts supported Node.js %s', (nodeVersion) => {
    expect(() => sourceWorkbenchPlan({ ...input, nodeVersion })).not.toThrow()
  })

  it.each(['20.19.0', '22.18.9', '23.10.0', 'invalid'])('rejects unsupported Node.js %s before launching', (nodeVersion) => {
    expect(() => sourceWorkbenchPlan({ ...input, nodeVersion })).toThrow('Node.js')
  })

  it.each([['linux', 'x64'], ['darwin', 'ia32'], ['win32', 'arm64']])('rejects an unsupported host %s/%s', (platform, arch) => {
    expect(() => sourceWorkbenchPlan({ ...input, platform, arch })).toThrow('requires macOS')
  })

  it('rejects a Windows or relative source path on macOS', () => {
    expect(() => sourceWorkbenchPlan({ ...input, root: 'C:\\workbench' })).toThrow('absolute')
    expect(() => sourceWorkbenchPlan({ ...input, root: 'relative' })).toThrow('absolute')
  })

  it.runIf(process.platform === 'darwin')('runs the double-click entry from a different directory with Chinese, spaces and shell punctuation', async () => {
    const directory = await mkdtemp(join(tmpdir(), "workbench-Mac 中文 ' $(literal)-"))
    onTestFinished(async () => { await rm(directory, { recursive: true, force: true }) })
    await mkdir(join(directory, 'scripts'))
    await mkdir(join(directory, 'node_modules/pnpm/bin'), { recursive: true })
    await copyFile(fileURLToPath(new URL('../start-workbench.command', import.meta.url)), join(directory, 'start-workbench.command'))
    await copyFile(fileURLToPath(new URL('./start-workbench.mjs', import.meta.url)), join(directory, 'scripts/start-workbench.mjs'))
    await writeFile(join(directory, 'node_modules/pnpm/bin/pnpm.cjs'), '')
    const output = execFileSync('/bin/zsh', [join(directory, 'start-workbench.command'), '--check'], { cwd: tmpdir(), encoding: 'utf8' })
    expect(output).toContain(`Source launcher checks passed (darwin/${process.arch})`)
    expect(output).toContain('No build, download, or application launch was performed.')
  })
})

describe('workbench launch process ownership', () => {
  async function fixture() {
    const directory = await mkdtemp(join(tmpdir(), "workbench-exec 中文 ' $(literal)-"))
    onTestFinished(async () => { await rm(directory, { recursive: true, force: true }) })
    const pnpm = join(directory, 'local pnpm.cjs')
    const log = join(directory, 'steps.jsonl')
    await writeFile(pnpm, `const fs = require('node:fs');
fs.appendFileSync(process.env.WORKBENCH_TEST_LOG, JSON.stringify({ args: process.argv.slice(2), cwd: process.cwd(), title: process.env.DSH_CLIENT_TITLE }) + '\\n');
if (process.argv[2] === 'fail') process.exitCode = 7;
`)
    return { directory, pnpm, log, environment: { ...process.env, WORKBENCH_TEST_LOG: log, DSH_CLIENT_TITLE: 'zhang.workbench' } }
  }

  it('passes paths and arguments literally and waits for each process to close', async () => {
    const data = await fixture()
    const commands = [['first', "想法 ' $(literal)"], ['second', 'path with spaces']]
    await runWorkbenchCommands({ cwd: data.directory, environment: data.environment, commands }, data.pnpm)
    const lines = (await readFile(data.log, 'utf8')).trimEnd().split('\n').map(line => JSON.parse(line) as object)
    expect(lines).toEqual(commands.map(args => ({ args, cwd: data.directory, title: 'zhang.workbench' })))
  })

  it('stops after a failed process and does not start the remaining application step', async () => {
    const data = await fixture()
    await expect(runWorkbenchCommands({ cwd: data.directory, environment: data.environment,
      commands: [['fail'], ['must-not-run']] }, data.pnpm)).rejects.toThrow('Workbench step failed (7)')
    expect((await readFile(data.log, 'utf8')).trimEnd().split('\n')).toHaveLength(1)
    expect(await readFile(data.log, 'utf8')).not.toContain('must-not-run')
  })
})
