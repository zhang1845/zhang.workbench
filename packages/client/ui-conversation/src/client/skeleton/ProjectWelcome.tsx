/** Centered local-project introduction and draft-only shortcuts. */
import { IconFolderCloseRegular, IconNewChatOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import css from './ProjectWelcome.module.css'

/**
 * Render introductory artwork above the resident composer.
 * @param props - localized greeting copy.
 * @returns the decorative orb and welcome headings.
 */
export function ProjectWelcome({ t }: PropsLocale<'conversation'>) {
  return <section className={css.root} aria-label={t('project.welcome')}>
    <div className={css.orb} aria-hidden="true" />
    <p className={css.greeting}>{t('project.greeting')}</p>
    <h1>{t('project.question')}</h1>
    <p className={css.subtitle}>{t('project.subtitle')}</p>
  </section>
}

/**
 * Render three compact task cards below the resident composer.
 * @param props - localized copy, draft callback, and editor availability.
 * @returns shortcuts that edit a draft without sending it.
 */
export function ProjectShortcuts({ t, onChoose, disabled }: PropsLocale<'conversation'> & {
  onChoose: (text: string) => void
  disabled: boolean
}) {
  return <section className={css.shortcuts} aria-label={t('project.quickTasks')}>
    {(['requirements', 'document', 'summary'] as const).map(task => <button key={task} aria-label={t(`project.task.${task}`)} disabled={disabled} onClick={() => onChoose(t(`project.prompt.${task}`))}>
      <span className={css.cardTitle}>{task === 'summary' ? <IconFolderCloseRegular size={16} /> : <IconNewChatOutlineRegular size={16} />}<span>{t(`project.task.${task}`)}</span></span>
      <span className={css.cardDescription}>{t(`project.description.${task}`)}</span>
    </button>)}
  </section>
}
