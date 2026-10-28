/**
 * Windows source launcher plan, independent of the execution host.
 * @param options - Source path, host selectors, environment, and chosen surface.
 * @returns Child working directory, environment, and shell-free pnpm argument lists.
 */
export function windowsWorkbenchPlan(options: {
  root: string
  platform: string
  arch: string
  nodeVersion: string
  environment: NodeJS.ProcessEnv
  web?: boolean
  skipBuild?: boolean
}): { cwd: string; environment: NodeJS.ProcessEnv; commands: string[][] }
