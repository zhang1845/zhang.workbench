import { expect, it } from 'vitest'
import type { SessionListState } from '@deepseek-ai/dsh-api-session-controller/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { workspaceUsage } from '../src/client/workbench-usage.ts'

const a = 'a' as SessionId
const b = 'b' as SessionId
const other = 'other' as SessionId
const sessions: SessionListState = {
  ids: [], byId: {}, phase: 'ready',
  projectionsBySession: {
    [a]: { state: 'ready', error: null, values: { tokenUsage: { uncachedInputTokens: 100, cacheReadTokens: 400, cacheWriteTokens: 50, outputTokens: 80 } } },
    [b]: { state: 'ready', error: null, values: { tokenUsage: { uncachedInputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 0 } } },
    [other]: { state: 'ready', error: null, values: { tokenUsage: { uncachedInputTokens: 9000, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 9000 } } },
  },
}

it('sums disjoint input and output for selected sessions once, excluding other workspaces', () => {
  expect(workspaceUsage([a, a, b], sessions)).toEqual({ input: 550, output: 80, total: 630, known: 2, count: 2, failed: false })
})

it('distinguishes missing statistics from reported zero and an empty workspace', () => {
  expect(workspaceUsage([b], sessions)).toMatchObject({ total: 0, known: 1, count: 1 })
  expect(workspaceUsage([], sessions)).toMatchObject({ total: 0, known: 0, count: 0 })
  expect(workspaceUsage([a, 'missing' as SessionId], sessions)).toMatchObject({ total: 630, known: 1, count: 2 })
})

it('retains known totals while exposing failed reads for retry', () => {
  const failed: SessionListState = { ...sessions, projectionsBySession: { ...sessions.projectionsBySession, [b]: { state: 'error', error: null, values: {} } } }
  expect(workspaceUsage([a, b], failed)).toMatchObject({ total: 630, known: 1, count: 2, failed: true })
})
