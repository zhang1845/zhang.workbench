/** Local workbench startup choice, shared by all supported model providers. */
import { useEffect } from 'react'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import type { DeepSeekOnboardingDialogProps } from './DeepSeekOnboardingDialog.tsx'
import { providerUsable } from './store.ts'
import { OnboardingModal } from './OnboardingModal.tsx'
import styles from './DeepSeekOnboardingDialog.module.css'

/**
 * Ask before opening the complete provider editor; skipping never writes credentials.
 * @param props - settings coordinator and shared provider readiness.
 * @returns the startup choice only when no configured provider is usable.
 */
export function ModelApiOnboardingDialog({
  complete, openSection, controller, useModels, t, automatic, explicit = false,
}: DeepSeekOnboardingDialogProps) {
  const state = useModels(snapshot => snapshot)
  const ready = state.rows.some(providerUsable)
  const enabled = automatic || explicit
  useEffect(() => {
    if (enabled && state.status === 'idle') void controller.load()
  }, [enabled, state.status, controller])
  useEffect(() => {
    if (!enabled || (ready && !explicit)) complete()
  }, [enabled, ready, explicit, complete])
  if (!enabled || (ready && !explicit) || state.status === 'idle' || state.status === 'loading') return null
  return <OnboardingModal title={t('apiSetupTitle')} focusTitle>
    <p className={styles.description}>{t('apiSetupDescription')}</p>
    {state.status === 'error' && <p role="alert" className={styles.description}>{t('apiSetupLoadFailed')}</p>}
    <div className={styles.actions}>
      <Button variant="outline" onClick={complete}>{t('apiSetupLater')}</Button>
      {state.status === 'error'
        ? <Button onClick={() => { void controller.load() }}>{t('retry')}</Button>
        : <Button onClick={() => { complete(); openSection('models') }}>{t('apiSetupAdd')}</Button>}
    </div>
  </OnboardingModal>
}
