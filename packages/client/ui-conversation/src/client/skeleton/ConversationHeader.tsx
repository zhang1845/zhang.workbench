/** Resident conversation navigation and Session-specific header content. */
import clsx from 'clsx'
import { IconNewChatOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'
import { workspaceDisplayTitle } from '@deepseek-ai/dsh-api-workspace-controller/default-workspace'
import type { ConversationHeaderProps } from '../contract/slots.ts'
import { conversationPhase } from '../contract/snapshot.ts'
import css from './ConversationRoot.module.css'

/**
 * Keeps global navigation available before a Session exists.
 * @param props - Optional Session sources and authorized header slots.
 * @returns The persistent header with any selected Session's title and views.
 */
export function ConversationHeader({
  sessionId, useSession, useConversation, useWorkspaces, renderSlot, startSession, t,
}: ConversationHeaderProps) {
  const session = useSession(s => s)
  const conversation = useConversation(s => s)
  const project = useWorkspaces(s => s.items.find(item => sessionId !== undefined && item.sessionIds.includes(sessionId)))
  const localProject = process.env.DSH_CLIENT_TITLE === 'AI.pm工作台'
  const blank = session === undefined || conversation === undefined
    || (session.blank && conversationPhase(session, conversation) === 'blank')
  return (
    <header className={clsx(
      css.header, blank && css.headerBlank, sessionId === undefined && css.headerSessionless, localProject && css.projectHeader,
    )} data-window-drag>
      <div className={css.headerLeading} data-conversation-header-leading="">
        {renderSlot('conversation.header.leading', {})}
      </div>
      {localProject && <div className={css.projectTitle}><span>{project === undefined ? t('project.title') : workspaceDisplayTitle(project.title, t('workspace.defaultName'))}</span><button onClick={startSession}><IconNewChatOutlineRegular size={14} />{t('project.newChat')}</button></div>}
      {sessionId === undefined
        ? <div className={css.titleRow} />
        : renderSlot('conversation.session.header', { hideChrome: blank })}
    </header>
  )
}
