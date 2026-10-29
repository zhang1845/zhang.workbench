// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { cleanup, fireEvent, waitFor } from '@testing-library/react'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import { SlotTestRuntime, usePinnedBrowserLanguages } from '@deepseek-ai/dsh-client-test-runtime'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import type { MainPanelId } from '@deepseek-ai/dsh-client-ui-layout/client'
import type { PropsRenderSlots, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { apply, inject } from '../src/client/index.ts'
import type { WorkspaceId } from '@deepseek-ai/dsh-api-workspace-controller/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { apply as applySidebar, inject as sidebarInject } from '../../ui-sidebar/src/client/index.ts'

usePinnedBrowserLanguages('zh-CN')
afterEach(cleanup)

it('composes the real folder page, hides conversation on startup, and searches real workspaces', async () => {
  const runtime = await SlotTestRuntime.create()
  try {
    runtime.ctx.provide('shortcuts', { register: () => () => {}, catalog: createSnapshotStore([]) })
    runtime.ctx.provide('layout', {
      panelInfo: runtime.panelInfo,
      selectPanel: (activePanelId: MainPanelId | null) => runtime.panelInfo.set({ activePanelId }),
      beginNavigation: () => new AbortController().signal,
    })
    runtime.releaseWorkspaceSource()
    runtime.remote.provideNamespaces({ directoryPicker: {} })
    const locale = new LocaleRuntime(runtime.ctx)
    runtime.ctx.provide('locale', locale)
    runtime.slots.installLocale(locale)
    await runtime.sessions.add({ id: 's1' as SessionId, summary: { title: 'Blank', displayTitle: 'Blank', blank: true, cwd: '/local/AI.pm' } })
    runtime.sessions.stubCreate(async () => 's1' as SessionId)
    const createdAt = '2026-01-01T00:00:00Z'
    const updatedAt = '2026-01-02T00:00:00Z'
    await runtime.workspaces.update((draft) => {
      draft.items = [{ workspaceId: 'w1' as WorkspaceId, title: 'AI.pm', path: '/local/AI.pm', sessionIds: ['s1' as SessionId], createdAt, updatedAt }]
    })
    function Frame({ usePanelInfo, renderSlot }: PropsRuntime<'root'> & PropsRenderSlots<'main' | 'sidebar'>) {
      const panel = usePanelInfo(info => info.activePanelId)
      return <><aside data-testid="sidebar">{renderSlot('sidebar', { collapsed: false, width: 224 })}</aside>{renderSlot('main', {}, { entryKey: panel ?? 'conversation' })}</>
    }
    await runtime.root.declare({ main: { kind: 'keyed', scope: 'root' }, sidebar: { kind: 'single', scope: 'root' } }, Frame)
    runtime.slots.register({ name: 'main', key: 'conversation' }, () => <textarea aria-label="Conversation input" />)
    await runtime.mount({ inject: [...inject], apply })
    await runtime.mount({ inject: [...sidebarInject], apply: applySidebar })
    const view = runtime.renderRoot()
    await waitFor(() => expect(view.getByTestId('workbench')).toBeTruthy())
    expect(view.queryByLabelText('Conversation input')).toBeNull()
    expect(view.container.querySelector('[data-workbench-nav]')?.textContent).toMatchInlineSnapshot('"首页项目AI.pm"')
    expect(view.getByRole('button', { name: '首页' }).getAttribute('aria-current')).toBe('page')
    expect(view.getByText('个人工作空间')).toBeTruthy()
    fireEvent.click(view.getByRole('button', { name: '项目' }))
    expect(view.container.querySelector('[aria-label="项目文件夹"]')).toBeNull()
    fireEvent.click(view.getByRole('button', { name: '项目' }))
    expect(view.container.querySelector('[aria-label="项目文件夹"]')?.textContent).toBe('AI.pm')
    expect(view.getByRole('button', { name: '打开文件夹 AI.pm' })).toBeTruthy()
    expect(view.container.querySelector('[aria-label="文件夹信息"]')?.textContent).not.toContain('/local/AI.pm')
    expect(view.container.querySelector('[aria-label="文件夹信息"]')?.textContent).not.toContain('本地路径')
    const dock = view.container.querySelector('[data-info-dock]')!
    const trigger = view.getByRole('button', { name: '展开文件夹信息' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(view.queryByRole('region', { name: '累计 Token 用量' })).toBeNull()
    fireEvent.mouseEnter(dock)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    fireEvent.mouseLeave(dock)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    fireEvent.focus(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    fireEvent.keyDown(trigger, { key: 'Escape' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(trigger)
    fireEvent.mouseLeave(dock)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(trigger)
    fireEvent.pointerDown(view.getByRole('textbox', { name: '搜索文件夹' }))
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    fireEvent.mouseEnter(dock)
    expect(view.getByRole('region', { name: '累计 Token 用量' }).textContent).toContain('暂无统计')
    expect(runtime.sessions.calls.some(call => call.method === 'refreshProjections')).toBe(true)
    expect(view.container.querySelector('[data-testid="workbench"]')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(`工作台首页 / 工作区我的工作区选择一个文件夹，开始你的 AI 工作添加工作区手动排序AI.pm1 个会话点击进入工作区文件夹信息工作区1会话1累计 Token 用量暂无统计输入（含缓存）—输出—已统计 0/1 个会话，当前为已知用量属性工作区名称AI.pm创建时间${new Date(createdAt).toLocaleDateString()}最近更新${new Date(updatedAt).toLocaleDateString()}仅在本机使用`)
    fireEvent.change(view.getByRole('textbox', { name: '搜索文件夹' }), { target: { value: 'missing' } })
    expect(view.queryByRole('button', { name: '打开文件夹 AI.pm' })).toBeNull()
    expect(view.getByText('无匹配结果')).toBeTruthy()
    fireEvent.change(view.getByRole('textbox', { name: '搜索文件夹' }), { target: { value: '' } })
    await runtime.sessions.updateSummary('s1', { projectionValues: { tokenUsage: { uncachedInputTokens: 100, cacheReadTokens: 400, cacheWriteTokens: 50, outputTokens: 80 } } })
    await waitFor(() => expect(view.getByRole('region', { name: '累计 Token 用量' }).textContent).toContain('630'))
    expect(view.getByRole('region', { name: '累计 Token 用量' }).textContent).toContain('输入（含缓存）550输出80')
    expect(view.queryByLabelText('Conversation input')).toBeNull()
    fireEvent.click(view.getByRole('button', { name: '打开文件夹 AI.pm' }))
    await waitFor(() => expect(view.getByLabelText('Conversation input')).toBeTruthy())
    expect(view.queryByTestId('workbench')).toBeNull()
    fireEvent.click(view.getByRole('button', { name: '首页' }))
    await waitFor(() => expect(view.getByTestId('workbench')).toBeTruthy())
    expect(view.queryByLabelText('Conversation input')).toBeNull()
  } finally { await runtime.dispose() }
})
