/** Native host, checkout, and existing user settings used to prepare a source launch. */
export interface WorkbenchLaunchOptions {
  root: string
  platform: string
  arch: string
  nodeVersion: string
  environment: NodeJS.ProcessEnv
  web?: boolean
  skipBuild?: boolean
}

/** Shell-free steps and their preserved working directory and environment. */
export interface WorkbenchLaunchPlan {
  cwd: string
  environment: NodeJS.ProcessEnv
  commands: string[][]
}

/**
 * Prepare a macOS arm64/x64 or Windows x64 source launch without changing caller state.
 * @param options - Checkout, host, environment, and selected surface.
 * @returns Working directory, child environment, and pnpm argument lists.
 */
export function sourceWorkbenchPlan(options: WorkbenchLaunchOptions): WorkbenchLaunchPlan

/**
 * Execute a launch plan sequentially and wait for every owned child to close.
 * @param plan - Resolved launch steps.
 * @param pnpm - Absolute local pnpm script path.
 * @returns Completion of all steps; rejects on the first failed process.
 */
export function runWorkbenchCommands(plan: WorkbenchLaunchPlan, pnpm: string): Promise<void>

/**
 * Check or launch the current native host with command-line options.
 * @param root - Absolute checkout directory.
 * @returns Completion of the check or launch.
 */
export function launchSourceWorkbench(root: string): Promise<void>
