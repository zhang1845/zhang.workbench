/** Folder paper motion stays decorative and respects reduced-motion preferences. */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'

const css = readFileSync(fileURLToPath(new URL('../src/client/Workbench.module.css', import.meta.url)), 'utf8')

it('centers the welcome and folders with a responsive information card', () => {
  expect(css).toContain('.heading > div::before')
  expect(css).toContain('grid-template-columns: repeat(auto-fit, 172px); justify-content: center')
  expect(css).toContain('@media (max-width: 1000px)')
  expect(css).toContain('top: calc(24px + var(--dsh-frame-top-clearance, 0px))')
})

it('stagger-bounces both sheets on hover or keyboard focus, excluding disabled folders', () => {
  for (const trigger of ['hover', 'focus-visible']) {
    expect(css).toMatch(new RegExp(String.raw`\.folder:not\(:disabled\):${trigger} \.paper \{[^}]*animation: paper-hop \.7s ease-out both`))
    expect(css).toMatch(new RegExp(String.raw`\.folder:not\(:disabled\):${trigger} \.paperTwo \{[^}]*animation: paper-hop \.7s \.09s ease-out both`))
  }
  expect(css).toContain('@keyframes paper-hop')
  expect(css).toContain('0%, 100% { translate: 0 0; }')
  expect(css).toContain('transition: transform .28s cubic-bezier(.22, 1, .36, 1)')
})

it('disables both bouncing and lifting for reduced motion', () => {
  const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'))
  expect(reduced).toContain('.folder, .paper, .paperTwo { transition: none; }')
  expect(reduced).toContain('.folder:not(:disabled):hover { transform: none; }')
  expect(reduced).toContain('.folder:not(:disabled):focus-visible { transform: none; }')
  expect(reduced).toContain('.paper { animation: none; transform: rotate(-5deg); }')
  expect(reduced).toContain('.paperTwo { animation: none; transform: rotate(4deg); }')
})
