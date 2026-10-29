// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { RunningWhaleTail } from '../src/client/chat/RunningWhaleTail.tsx'

afterEach(cleanup)

describe('RunningWhaleTail', () => {
  it('uses the shared decorative AI.pm vector without inline styles', () => {
    const view = render(<RunningWhaleTail />)
    const icon = view.container.firstElementChild!
    expect(icon.getAttribute('aria-hidden')).toBe('true')
    expect(icon.children).toHaveLength(1)
    expect(icon.querySelector('[data-brand-mark="ai-pm"]')).not.toBeNull()
    expect(icon.querySelector('image')!.getAttribute('href')).toMatch(/^data:image\/svg\+xml,/)
    expect(view.container.querySelector('[style]')).toBeNull()
  })

  it('limits the pulse to users without reduced motion or forced colors', () => {
    const css = readFileSync(resolve(import.meta.dirname, '../src/client/chat/ChatView.module.css'), 'utf8')
    expect(css).toContain('@media (prefers-reduced-motion: no-preference) and (forced-colors: none)')
    expect(css).toContain('animation: brand-running-pulse 1.6s ease-in-out infinite')
    expect(css).not.toContain('running-whale@2x.png')
  })
})
