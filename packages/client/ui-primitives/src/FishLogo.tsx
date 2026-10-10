/** Compatibility-named primitive for the AI.pm brand mark. */
import type { IconProps } from './icons/props.ts'
import { AI_PM_MARK_PATH, AI_PM_MARK_URL } from './ai-pm-artwork.ts'

/** Native coordinate space of the current brand artwork. */
export const FISH_LOGO_VIEWBOX = { width: 1024, height: 1024 }
/** Current brand silhouette, retained for consumers composing masks. */
export const FISH_LOGO_PATH = AI_PM_MARK_PATH

/**
 * Render the fixed-color AI.pm mark on a transparent square canvas.
 * @param props - square size in pixels and optional placement class.
 * @returns decorative vector artwork.
 */
export function FishLogo({ size = 24, className }: IconProps) {
  return <svg width={size} height={size} className={className} viewBox="0 0 1024 1024" aria-hidden="true" data-brand-mark="ai-pm"><image href={AI_PM_MARK_URL} width="1024" height="1024" /></svg>
}
