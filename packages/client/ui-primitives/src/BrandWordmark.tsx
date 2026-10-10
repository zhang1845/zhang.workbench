/** AI.pm wordmark with the shared decorative brand mark. */
import type { IconProps } from './icons/props.ts'
import { AI_PM_MARK_URL } from './ai-pm-artwork.ts'

/** Display options for the application wordmark. */
export interface BrandWordmarkProps extends IconProps {
  /** Whether to include the leading mark; defaults to true. */
  includeMark?: boolean | undefined
}

/**
 * Render AI.pm brand artwork, inheriting the surrounding text color.
 * @param props - artwork height, optional placement class, and mark visibility.
 * @returns decorative wordmark SVG.
 */
export function BrandWordmark({ size = 24, className, includeMark = true }: BrandWordmarkProps) {
  const width = includeMark ? 182 : 156
  return <svg width={(size * width) / 24} height={size} className={className} viewBox={includeMark ? '0 0 182 24' : '26 0 156 24'} aria-hidden="true">
    {includeMark && <image href={AI_PM_MARK_URL} width="24" height="24" />}
    <text x="30" y="17" fill="currentColor" fontSize="15" fontWeight="500" fontFamily="system-ui, sans-serif">AI.pm 工作台</text>
  </svg>
}
