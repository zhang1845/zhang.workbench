/** Compatibility-named AI.pm running-status mark. */
import { FishLogo } from '@deepseek-ai/dsh-client-ui-primitives'
import css from './ChatView.module.css'

/**
 * Render the decorative vector mark with a motion-preference-aware pulse.
 * @returns a brand icon hidden from assistive technology.
 */
export function RunningWhaleTail() {
  return <span className={css.runningIcon} aria-hidden="true"><FishLogo size={16} className={css.runningBrand} /></span>
}
