// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ProjectShortcuts, ProjectWelcome } from '../src/client/skeleton/ProjectWelcome.tsx'
import { en, zh } from '../src/client/locales.ts'
import { makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import { zh as commonZh } from '@deepseek-ai/dsh-client-locale/src/locales/zh.ts'

afterEach(cleanup)
it.each([zh, en])('shows centered welcome copy and three draft-only shortcuts', (copy) => {
  const choose = vi.fn()
  const t = makeTranslate(copy, commonZh)
  render(<><ProjectWelcome t={t} /><ProjectShortcuts t={t} disabled={false} onChoose={choose} /></>)
  expect(screen.getByText(copy['project.greeting'])).toBeTruthy()
  expect(screen.getByRole('heading', { name: copy['project.question'] })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: copy['project.task.requirements'] }))
  expect(choose).toHaveBeenCalledExactlyOnceWith(copy['project.prompt.requirements'])
  expect(screen.getAllByRole('button')).toHaveLength(3)
})
it('does not replace a draft while the editor is blocked', () => {
  const choose = vi.fn()
  render(<ProjectShortcuts t={makeTranslate(zh, commonZh)} disabled onChoose={choose} />)
  fireEvent.click(screen.getByRole('button', { name: zh['project.task.summary'] }))
  expect(choose).not.toHaveBeenCalled()
})
