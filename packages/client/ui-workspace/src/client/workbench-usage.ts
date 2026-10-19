/** Workspace totals from durable session usage, without estimating missing values. */
import type { SessionListState } from '@deepseek-ai/dsh-api-session-controller/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type {} from '@deepseek-ai/dsh-token-meter/client'

/**
 * Sum each workspace session once; prompt-side cache buckets are disjoint.
 * @param ids - sessions belonging to the selected workspace.
 * @param sessions - current shared catalog and projection snapshots.
 * @returns known usage and completeness, including explicit read failures.
 */
export function workspaceUsage(ids: readonly SessionId[], sessions: SessionListState): {
  input: number
  output: number
  total: number
  known: number
  count: number
  failed: boolean
} {
  let input = 0
  let output = 0
  let known = 0
  let failed = false
  const unique = new Set(ids)
  for (const id of unique) {
    const projection = sessions.projectionsBySession[id]
    const usage = projection?.values.tokenUsage ?? sessions.byId[id]?.projectionValues?.tokenUsage
    if (projection?.state === 'error') failed = true
    if (usage === undefined) continue
    input += usage.uncachedInputTokens + usage.cacheReadTokens + usage.cacheWriteTokens
    output += usage.outputTokens
    known++
  }
  return { input, output, total: input + output, known, count: unique.size, failed }
}
