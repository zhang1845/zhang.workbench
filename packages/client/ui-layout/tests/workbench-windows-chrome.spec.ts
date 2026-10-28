/** Workbench's floating right panel must not cover the Windows caption buttons. */
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

it('keeps the floating panel below the native caption and releases that inset in fullscreen', () => {
  const css = readFileSync(new URL('../src/client/AppFrame.module.css', import.meta.url), 'utf8')
  expect(css).toMatch(/:global\(\[data-windows-titlebar\]\) \.rightbarFloat\s*\{\s*top: var\(--dsh-windows-titlebar-height\);\s*\}/u)
  expect(css).toMatch(/:global\(\[data-windows-titlebar\]\[data-fullscreen\]\) \.rightbarFloat\s*\{\s*top: 0;\s*\}/u)
})
