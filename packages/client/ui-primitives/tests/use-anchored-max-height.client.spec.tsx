// @vitest-environment jsdom
/**
 * `useAnchoredMaxHeight` clamps a bottom-anchored overlay to the space above
 * its bottom edge, keeping a 12px viewport margin that widens to the frame's
 * published `--dsh-frame-top-clearance` (the macOS window strip).
 */
import { useRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render } from '@testing-library/react'
import { useAnchoredMaxHeight } from '../src/useAnchoredMaxHeight.ts'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  document.documentElement.style.removeProperty('--dsh-frame-top-clearance')
})

/** Render the hook against an element whose bottom edge sits at `bottom`. */
function Probe({ cap, margin }: { cap: number; margin?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const maxHeight = useAnchoredMaxHeight(ref, cap, 0, margin)
  return <div ref={ref} data-testid="probe" data-max-height={maxHeight} />
}

/** Pin jsdom's zero-size layout to a fixed bottom edge. */
function stubBottom(bottom: number): void {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(0, bottom - 100, 200, 100),
  )
}

describe('useAnchoredMaxHeight', () => {
  it('clamps to the space above the bottom edge minus the 12px margin', () => {
    stubBottom(300)
    const { getByTestId } = render(<Probe cap={400} />)
    expect(getByTestId('probe').dataset.maxHeight).toBe('288')
  })

  it('widens the margin to the frame top clearance when published', () => {
    document.documentElement.style.setProperty('--dsh-frame-top-clearance', '48px')
    stubBottom(300)
    const { getByTestId } = render(<Probe cap={400} />)
    expect(getByTestId('probe').dataset.maxHeight).toBe('232')
  })

  it('keeps a caller-raised margin over a published smaller clearance', () => {
    document.documentElement.style.setProperty('--dsh-frame-top-clearance', '48px')
    stubBottom(300)
    const { getByTestId } = render(<Probe cap={400} margin={84} />)
    expect(getByTestId('probe').dataset.maxHeight).toBe('216')
  })

  it('never exceeds the design cap', () => {
    stubBottom(300)
    const { getByTestId } = render(<Probe cap={100} />)
    expect(getByTestId('probe').dataset.maxHeight).toBe('100')
  })

  it.each(['hidden', 'auto', 'scroll', 'clip'] as const)('keeps the menu below an ancestor with overflow-y %s', (overflowY) => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return this.dataset.testid === 'clip'
        ? new DOMRect(0, 180, 600, 400)
        : new DOMRect(0, 100, 200, 400)
    })
    const { getByTestId } = render(<div data-testid="clip" style={{ overflowY }}><Probe cap={400} /></div>)
    expect(getByTestId('probe').dataset.maxHeight).toBe('308')
  })

  it('uses the innermost visible top edge without treating visible overflow as a clip', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.dataset.testid === 'outer') return new DOMRect(0, 200, 600, 400)
      if (this.dataset.testid === 'visible') return new DOMRect(0, 420, 600, 100)
      return new DOMRect(0, 100, 200, 400)
    })
    const { getByTestId } = render(<div data-testid="outer" style={{ overflowY: 'hidden' }}>
      <div data-testid="visible" style={{ overflowY: 'visible' }}><Probe cap={400} /></div>
    </div>)
    expect(getByTestId('probe').dataset.maxHeight).toBe('288')
  })

  it('refits after a clipping ancestor moves and removes listeners on unmount', () => {
    let top = 180
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return this.dataset.testid === 'clip'
        ? new DOMRect(0, top, 600, 400)
        : new DOMRect(0, 100, 200, 400)
    })
    const remove = vi.spyOn(window, 'removeEventListener')
    const { getByTestId, unmount } = render(<div data-testid="clip" style={{ overflowY: 'hidden' }}><Probe cap={400} /></div>)
    expect(getByTestId('probe').dataset.maxHeight).toBe('308')
    top = 300
    act(() => { window.dispatchEvent(new Event('resize')) })
    expect(getByTestId('probe').dataset.maxHeight).toBe('188')
    top = 510
    act(() => { window.dispatchEvent(new Event('scroll')) })
    expect(getByTestId('probe').dataset.maxHeight).toBe('0')
    unmount()
    expect(remove).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function), true)
  })
})
