// @vitest-environment jsdom
/** Real document UI with a deterministic local HTTP boundary. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import { SiminShell } from '../src/client/SiminShell.tsx'
import { siminZh } from '../src/client/simin-locales.ts'
import type { SiminSnapshot } from '../src/client/simin-api.ts'

let snapshot: SiminSnapshot
let mutations: Record<string, unknown>[]
let mutationError: string | undefined
beforeEach(() => {
  localStorage.clear()
  mutations = []
  mutationError = undefined
  snapshot = {
    root: '/test/projects', trash: [], proposals: [],
    projects: [{ name: '产品', path: '/test/projects/产品', documents: ['信息.md'],
      files: [{ name: '信息.md', modifiedAt: 1, bytes: 10, preview: '真实正文' }] }],
  }
  vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
    const path = new URL(input, 'http://localhost').pathname
    const data = init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : undefined
    if (data) mutations.push({ path, ...data })
    if (data && mutationError) return new Response(JSON.stringify({ error: mutationError }), { status: 409 })
    const body = path === '/aipm/state' ? snapshot : path === '/aipm/file'
      ? { markdown: '# 真实正文', version: 'v1' } : { ok: true }
    return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } })
  }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear() })

async function openProject() {
  const view = render(<SiminShell chat={<textarea aria-label="AI 对话" />} nativeSettings={null} t={makeTranslate(siminZh)} />)
  fireEvent.click(await screen.findByRole('button', { name: '产品 · 1 篇文档' }))
  act(() => { window.dispatchEvent(new CustomEvent('aipm-workspace-ready', { detail: { path: '/test/projects/产品' } })) })
  return view
}

it('keeps the local brand, renders real Markdown and does not display disk paths', async () => {
  const view = await openProject()
  expect(screen.getByText('zhang.workbench')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: '信息' }))
  expect(await screen.findByRole('heading', { name: '真实正文' })).toBeTruthy()
  expect(view.container.textContent).not.toContain('/test/projects')
  expect(screen.getByRole('textbox', { name: 'AI 对话' })).toBeTruthy()
})

it('previews a manual document before making any write request and lets the user cancel', async () => {
  await openProject()
  fireEvent.click(screen.getAllByRole('button', { name: '新建文档' })[0]!)
  fireEvent.change(screen.getByRole('textbox', { name: '文档名称' }), { target: { value: '结论' } })
  fireEvent.change(screen.getByRole('textbox', { name: '文档内容' }), { target: { value: '# 待确认' } })
  fireEvent.click(screen.getByRole('button', { name: '文档预览' }))
  expect(await screen.findByRole('button', { name: '确认保存' })).toBeTruthy()
  expect(mutations).toEqual([])
  fireEvent.click(screen.getByRole('button', { name: '取消' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  expect(mutations).toEqual([])
})

it('shows retained AI changes and sends an explicit cancel decision without editing the document', async () => {
  snapshot.proposals = [{ id: 'preview-1', project: '产品', file: '信息.md', sessionId: 's1', createdAt: 1,
    before: '# 原文', after: '# 新建议', version: 'v1', status: 'pending' }]
  await openProject()
  fireEvent.click(screen.getByRole('button', { name: '文档预览' }))
  const dialog = screen.getByRole('dialog', { name: '修改审阅' })
  fireEvent.click(within(dialog).getByRole('button', { name: '取消' }))
  await waitFor(() => expect(mutations).toEqual([{ path: '/aipm/decide', id: 'preview-1', allow: false }]))
})

it('writes a manual document only after the user confirms its preview', async () => {
  await openProject()
  fireEvent.click(screen.getAllByRole('button', { name: '新建文档' })[0]!)
  fireEvent.change(screen.getByRole('textbox', { name: '文档名称' }), { target: { value: '结论' } })
  fireEvent.change(screen.getByRole('textbox', { name: '文档内容' }), { target: { value: '# 已确认的内容' } })
  fireEvent.click(screen.getByRole('button', { name: '文档预览' }))
  expect(mutations).toEqual([])
  fireEvent.click(await screen.findByRole('button', { name: '确认保存' }))
  await waitFor(() => expect(mutations).toEqual([{
    path: '/aipm/mutate', op: 'save', project: '产品', file: '结论.md', markdown: '# 已确认的内容', version: null,
  }]))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
})

it('retains a document preview and explains a version conflict without closing it', async () => {
  mutationError = 'conflict'
  await openProject()
  fireEvent.click(screen.getAllByRole('button', { name: '新建文档' })[0]!)
  fireEvent.change(screen.getByRole('textbox', { name: '文档名称' }), { target: { value: '结论.md' } })
  fireEvent.change(screen.getByRole('textbox', { name: '文档内容' }), { target: { value: '# 保留这份预览' } })
  fireEvent.click(screen.getByRole('button', { name: '文档预览' }))
  fireEvent.click(await screen.findByRole('button', { name: '确认保存' }))
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', '文档已经变化，请重新读取后再操作')
  expect(screen.getByRole('dialog')).toBeTruthy()
  expect(screen.getByRole('heading', { name: '保留这份预览' })).toBeTruthy()
})

it('sends an explicit approval for an AI proposal only after confirmation', async () => {
  snapshot.proposals = [{ id: 'preview-2', project: '产品', file: '信息.md', sessionId: 's1', createdAt: 2,
    before: '# 原文', after: '# 新建议', version: 'v1', status: 'pending' }]
  await openProject()
  fireEvent.click(screen.getByRole('button', { name: '文档预览' }))
  expect(mutations).toEqual([])
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '确认保存' }))
  await waitFor(() => expect(mutations).toEqual([{ path: '/aipm/decide', id: 'preview-2', allow: true }]))
})

it('keeps the original model settings entry and provides access to previous workspaces', async () => {
  const onOpenLegacy = vi.fn()
  const openSettings = vi.fn()
  window.addEventListener('aipm-open-settings', openSettings)
  try {
    render(<SiminShell chat={null} nativeSettings={null} t={makeTranslate(siminZh)} onOpenLegacy={onOpenLegacy} />)
    await screen.findByRole('button', { name: '产品 · 1 篇文档' })
    fireEvent.click(screen.getByRole('button', { name: '设置' }))
    fireEvent.click(screen.getByRole('button', { name: '打开设置' }))
    expect(openSettings).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: '原有工作区与会话' }))
    expect(onOpenLegacy).toHaveBeenCalledOnce()
  } finally { window.removeEventListener('aipm-open-settings', openSettings) }
})
