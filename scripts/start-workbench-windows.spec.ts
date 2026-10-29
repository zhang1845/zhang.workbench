/** Windows source-launch planning without running downloads or native applications. */
import { describe, expect, it } from 'vitest'
import { windowsWorkbenchPlan } from './start-workbench-windows.mjs'

const input = { root: 'D:\\我的文稿\\AI Workbench', platform: 'win32', arch: 'x64', nodeVersion: '24.9.0', environment: {} }

describe('Windows workbench source launcher', () => {
  it('keeps Chinese and spaces in one working-directory argument and uses existing Desktop launch scripts', () => {
    const plan = windowsWorkbenchPlan(input)
    expect(plan.cwd).toBe(input.root)
    expect(plan.commands).toEqual([
      ['--filter', '@deepseek-ai/dsh-desktop', 'exec', 'install-electron'], ['run', 'dev:desktop'],
    ])
    expect(plan.environment).toMatchObject({
      DSH_CLIENT_TITLE: 'zhang.workbench', DSH_DESKTOP_WELCOME: '0', DSH_DESKTOP_OPEN_DEVTOOLS: '0',
      DSH_HOME: `${input.root}\\.dsh-home`, DSH_DESKTOP_USER_DATA_DIR: `${input.root}\\.dsh-home\\desktop-user-data`,
    })
  })
  it('preserves explicit data locations and unrelated settings without mutating the caller', () => {
    const environment = { DSH_HOME: 'E:\\个人数据', DSH_DESKTOP_USER_DATA_DIR: 'browser-data', CUSTOM_FLAG: 'keep' }
    const plan = windowsWorkbenchPlan({ ...input, environment })
    expect(plan.environment.DSH_HOME).toBe('E:\\个人数据')
    expect(plan.environment.DSH_DESKTOP_USER_DATA_DIR).toBe(`${input.root}\\browser-data`)
    expect(plan.environment.CUSTOM_FLAG).toBe('keep')
    expect(environment).toEqual({ DSH_HOME: 'E:\\个人数据', DSH_DESKTOP_USER_DATA_DIR: 'browser-data', CUSTOM_FLAG: 'keep' })
  })
  it('supports a UNC checkout and relative data root', () => {
    const plan = windowsWorkbenchPlan({ ...input, root: '\\\\server\\share\\工作台', environment: { DSH_HOME: 'data' } })
    expect(plan.cwd).toBe('\\\\server\\share\\工作台')
    expect(plan.environment.DSH_HOME).toBe('\\\\server\\share\\工作台\\data')
  })
  it('does not download Electron for the optional Web surface', () => {
    expect(windowsWorkbenchPlan({ ...input, web: true }).commands).toEqual([['run', 'dev:web']])
    expect(windowsWorkbenchPlan({ ...input, web: true, skipBuild: true }).commands).toEqual([['run', 'start:web']])
    expect(windowsWorkbenchPlan({ ...input, skipBuild: true }).commands.at(-1)).toEqual(['run', 'start:desktop'])
  })
  it.each(['24.9.0', '24.14.0', '25.0.0', '26.0.0'])('accepts the repository Node.js range: %s', (nodeVersion) => {
    expect(() => windowsWorkbenchPlan({ ...input, nodeVersion })).not.toThrow()
  })
  it.each(['20.19.0', '22.19.0', '24.8.9', 'invalid'])('refuses unsupported Node.js %s before launching', (nodeVersion) => {
    expect(() => windowsWorkbenchPlan({ ...input, nodeVersion })).toThrow('Node.js')
  })
  it.each([['darwin', 'arm64'], ['linux', 'x64'], ['win32', 'arm64'], ['win32', 'ia32']])('does not run Windows x64 setup on %s/%s', (platform, arch) => {
    expect(() => windowsWorkbenchPlan({ ...input, platform, arch })).toThrow('Windows x64')
  })
  it('refuses a relative checkout instead of interpreting it against the launch location', () => {
    expect(() => windowsWorkbenchPlan({ ...input, root: 'relative' })).toThrow('absolute')
  })
})
