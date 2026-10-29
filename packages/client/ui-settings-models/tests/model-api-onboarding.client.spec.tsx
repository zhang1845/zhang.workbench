// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import { bindSnapshotSelector } from '@deepseek-ai/dsh-client-test-runtime'
import { ModelApiOnboardingDialog } from '../src/client/ModelApiOnboardingDialog.tsx'
import type { DeepSeekOnboardingDialogProps } from '../src/client/DeepSeekOnboardingDialog.tsx'
import type { ModelsSettingsState } from '../src/client/store.ts'
import { en, zh } from '../src/client/locales.ts'

afterEach(cleanup)
function fixture(patch: Partial<ModelsSettingsState> = {}, copy = en) {
  const store = createSnapshotStore<ModelsSettingsState>({ status: 'ready', error: null, credentialError: null, writable: true, namespaces: new Map(), rows: [], ...patch })
  const complete = vi.fn()
  const openSection = vi.fn()
  const load = vi.fn()
  const unused = (() => { throw new Error('unused test capability') }) as never
  const props: DeepSeekOnboardingDialogProps = {
    automatic: true, stepId: 'deepseek-official', complete, openSection,
    controller: { load } as never, useModels: bindSnapshotSelector(store),
    operations: {} as never, schema: {} as never, t: key => copy[key],
    renderSlot: unused, useSessions: unused, useSessionStatus: unused, useSessionRetainInfo: unused,
    useWorkspaces: unused, usePanelInfo: unused, useResource: unused,
    useRemoteAccess: unused, useSessionAccess: unused, useWorkspaceAccess: unused,
  }
  return { props, complete, openSection, load }
}

it.each([en, zh])('asks before configuration and opens the generic models section', (copy) => {
  const f = fixture({}, copy)
  render(<ModelApiOnboardingDialog {...f.props} />)
  expect(screen.getByRole('dialog', { name: copy.apiSetupTitle })).toBeTruthy()
  expect(screen.queryByRole('textbox')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: copy.apiSetupAdd }))
  expect(f.complete).toHaveBeenCalledOnce()
  expect(f.openSection).toHaveBeenCalledWith('models')
})

it('allows adding later without opening settings or writing a key', () => {
  const f = fixture()
  render(<ModelApiOnboardingDialog {...f.props} />)
  fireEvent.click(screen.getByRole('button', { name: en.apiSetupLater }))
  expect(f.complete).toHaveBeenCalledOnce()
  expect(f.openSection).not.toHaveBeenCalled()
})

it('does not ask when a non-DeepSeek provider has a configured key', () => {
  const f = fixture({ rows: [{ entry: { provider: 'openai', displayName: 'OpenAI', settingsNs: 'llm-pi-ai', settingsPath: ['providers', 'openai'], active: true }, configured: true, removable: true, apiKeyEnv: 'OPENAI_API_KEY', credential: { configured: true, writable: true } }] })
  render(<ModelApiOnboardingDialog {...f.props} />)
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(f.complete).toHaveBeenCalledOnce()
})

it('offers retry or skip when configuration cannot be read', () => {
  const f = fixture({ status: 'error', error: 'offline' })
  render(<ModelApiOnboardingDialog {...f.props} />)
  expect(screen.getByRole('alert').textContent).toBe(en.apiSetupLoadFailed)
  fireEvent.click(screen.getByRole('button', { name: en.retry }))
  expect(f.load).toHaveBeenCalledOnce()
  fireEvent.click(screen.getByRole('button', { name: en.apiSetupLater }))
  expect(f.complete).toHaveBeenCalledOnce()
})
