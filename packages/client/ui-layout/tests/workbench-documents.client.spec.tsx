// @vitest-environment jsdom
/** Real document UI with a deterministic local HTTP boundary. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import { SiminShell } from '../src/client/SiminShell.tsx'
import { siminEn, siminZh } from '../src/client/simin-locales.ts'
import type { SiminSnapshot } from '../src/client/simin-api.ts'
import { loadSiminPreferences, SIMIN_CHANGE_EVENT, SIMIN_OPEN_PROJECT_EVENT } from '../src/client/simin-state.ts'

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
    if (path === '/aipm/projects' && data) {
      const created = { name: String(data.name), path: `/test/projects/${String(data.name)}`, documents: [], files: [] }
      snapshot.projects.push(created)
      return new Response(JSON.stringify(created), { status: 201, headers: { 'content-type': 'application/json' } })
    }
    const body = path === '/aipm/state' ? snapshot : path === '/aipm/file'
      ? { markdown: '# 真实正文', version: 'v1' } : { ok: true }
    return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } })
  }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear() })

it('opens the starter kit from Home and prepares the selected project conversation without changing documents', async () => {
  snapshot.projects.push({ name: '另一产品', path: '/test/projects/另一产品', documents: [], files: [] })
  const opened = vi.fn()
  window.addEventListener(SIMIN_OPEN_PROJECT_EVENT, opened)
  try {
    render(<SiminShell chat={<textarea aria-label="AI 对话" />} nativeSettings={null} t={makeTranslate(siminZh)} />)
    fireEvent.click(await screen.findByRole('button', { name: siminZh.starterTitle }))
    const dialog = screen.getByRole('dialog', { name: siminZh.starterTitle })
    fireEvent.change(within(dialog).getByRole('combobox', { name: siminZh.chooseProject }), { target: { value: '另一产品' } })
    fireEvent.click(within(dialog).getByRole('button', { name: siminZh.starterStart }))
    await waitFor(() => expect(opened).toHaveBeenCalledOnce())
    expect((opened.mock.calls[0]![0] as CustomEvent).detail).toEqual({ path: '/test/projects/另一产品', draft: siminZh.starterPrompt })
    expect(mutations).toEqual([])
    expect(screen.queryByRole('dialog')).toBeNull()
  } finally { window.removeEventListener(SIMIN_OPEN_PROJECT_EVENT, opened) }
})

it.each([false, true])('starts the kit in a new project with its idea preserved (existing projects: %s)', async (existing) => {
  if (!existing) snapshot.projects = []
  const opened = vi.fn()
  window.addEventListener(SIMIN_OPEN_PROJECT_EVENT, opened)
  try {
    render(<SiminShell chat={null} nativeSettings={null} t={makeTranslate(siminZh)} />)
    fireEvent.click(await screen.findByRole('button', { name: siminZh.starterTitle }))
    if (existing) fireEvent.click(screen.getByRole('button', { name: siminZh.starterNewProject }))
    const dialog = screen.getByRole('dialog', { name: siminZh.starterTitle })
    fireEvent.change(within(dialog).getByRole('textbox', { name: siminZh.projectName }), { target: { value: '我的新产品' } })
    fireEvent.change(within(dialog).getByRole('textbox', { name: siminZh.idea }), { target: { value: '帮老师整理课程材料' } })
    fireEvent.click(within(dialog).getByRole('button', { name: siminZh.starterStart }))
    await waitFor(() => expect(opened).toHaveBeenCalledOnce())
    expect((opened.mock.calls[0]![0] as CustomEvent).detail).toEqual({
      path: '/test/projects/我的新产品', draft: `${siminZh.starterPrompt}\n\n帮老师整理课程材料`,
    })
    expect(mutations).toEqual([{ path: '/aipm/projects', name: '我的新产品' }])
  } finally { window.removeEventListener(SIMIN_OPEN_PROJECT_EVENT, opened) }
})

it('keeps the starter project form and idea when project creation fails', async () => {
  snapshot.projects = []
  mutationError = 'duplicate'
  render(<SiminShell chat={null} nativeSettings={null} t={makeTranslate(siminZh)} />)
  fireEvent.click(await screen.findByRole('button', { name: siminZh.starterTitle }))
  fireEvent.change(screen.getByRole('textbox', { name: siminZh.projectName }), { target: { value: '重名产品' } })
  fireEvent.change(screen.getByRole('textbox', { name: siminZh.idea }), { target: { value: '保留这个想法' } })
  fireEvent.click(screen.getByRole('button', { name: siminZh.starterStart }))
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', siminZh.duplicate)
  expect(screen.getByRole('textbox', { name: siminZh.idea })).toHaveProperty('value', '保留这个想法')
  expect(screen.getByRole('dialog')).toBeTruthy()
})

it.each([siminZh, siminEn])('localizes the starter entry and leaves projects untouched when cancelled', async (dictionary) => {
  render(<SiminShell chat={null} nativeSettings={null} t={makeTranslate(dictionary)} />)
  fireEvent.click(await screen.findByRole('button', { name: dictionary.starterTitle }))
  expect(screen.getByRole('dialog', { name: dictionary.starterTitle })).toBeTruthy()
  expect(screen.getByRole('combobox', { name: dictionary.chooseProject })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: dictionary.cancel }))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  expect(mutations).toEqual([])
})

async function openProject() {
  const view = render(<SiminShell chat={<textarea aria-label="AI 对话" />} nativeSettings={null} t={makeTranslate(siminZh)} />)
  fireEvent.click(await screen.findByRole('button', { name: '产品 · 1 篇文档' }))
  act(() => { window.dispatchEvent(new CustomEvent('aipm-workspace-ready', { detail: { path: '/test/projects/产品' } })) })
  return view
}

it.each(['project', 'documents', 'templates', 'trash', 'settings'])('starts on home instead of restoring %s, even with the old remember preference enabled', async (page) => {
  localStorage.setItem('zhang.workbench.view.v1', JSON.stringify({ project: '产品', file: '信息.md', page, tab: 'document' }))
  const preferences = JSON.stringify({ remember: true, autoOpen: false, reduced: true, sendMode: 'modEnter' })
  localStorage.setItem('zhang.workbench.preferences.v1', preferences)
  const opened = vi.fn()
  window.addEventListener(SIMIN_OPEN_PROJECT_EVENT, opened)
  try {
    render(<SiminShell chat={null} nativeSettings={null} t={makeTranslate(siminZh)} />)
    expect(await screen.findByRole('button', { name: '产品 · 1 篇文档' })).toBeTruthy()
    act(() => { window.dispatchEvent(new CustomEvent(SIMIN_CHANGE_EVENT)) })
    expect(screen.getByRole('button', { name: '产品 · 1 篇文档' })).toBeTruthy()
    expect(opened).not.toHaveBeenCalled()
    expect(vi.mocked(fetch).mock.calls.some(([input]) => String(input).includes('/aipm/file'))).toBe(false)
    expect(mutations).toEqual([])
    expect(localStorage.getItem('zhang.workbench.preferences.v1')).toBe(preferences)
    expect(loadSiminPreferences()).toEqual({ autoOpen: false, reduced: true, sendMode: 'modEnter' })
  } finally { window.removeEventListener(SIMIN_OPEN_PROJECT_EVENT, opened) }
})

it('keeps navigation and document access working but returns home on the next opening', async () => {
  const first = await openProject()
  fireEvent.click(screen.getByRole('button', { name: '信息' }))
  expect(await screen.findByRole('heading', { name: '真实正文' })).toBeTruthy()
  first.unmount()
  render(<SiminShell chat={null} nativeSettings={null} t={makeTranslate(siminZh)} />)
  expect(await screen.findByRole('button', { name: '产品 · 1 篇文档' })).toBeTruthy()
  expect(screen.queryByRole('heading', { name: '真实正文' })).toBeNull()
  expect(mutations).toEqual([])
  fireEvent.click(screen.getByRole('button', { name: '设置' }))
  expect(screen.queryByRole('switch', { name: '记住上次工作进度' })).toBeNull()
  expect(screen.getByRole('switch', { name: siminZh.autoOpen })).toBeTruthy()
})

it('labels populated and empty folder covers with real project names and document counts', async () => {
  snapshot.projects.push({ name: '新的创意项目', path: '/test/projects/新的创意项目', documents: [], files: [] })
  render(<SiminShell chat={null} nativeSettings={null} t={makeTranslate(siminZh)} />)
  const populated = await screen.findByRole('button', { name: '产品 · 1 篇文档' })
  const empty = screen.getByRole('button', { name: '新的创意项目 · 0 篇文档' })
  expect(within(populated).getByText('产品')).toBeTruthy()
  expect(within(populated).getByText('1 篇文档')).toBeTruthy()
  expect(within(empty).getByText('新的创意项目')).toBeTruthy()
  expect(within(empty).getByText('0 篇文档')).toBeTruthy()
  expect(mutations).toEqual([])
  fireEvent.click(empty)
  fireEvent.click(await screen.findByRole('button', { name: siminZh.overview }))
  expect(await screen.findByRole('heading', { name: '新的创意项目' })).toBeTruthy()
})

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
