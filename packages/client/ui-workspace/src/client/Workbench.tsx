import { useEffect, useMemo, useState } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { WorkspaceId } from '@deepseek-ai/dsh-api-workspace-controller/client'
import { workspaceDisplayTitle } from '@deepseek-ai/dsh-api-workspace-controller/default-workspace'
import { IconFolderCloseRegular, IconSearchOutlineRegular, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'
import css from './Workbench.module.css'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { workspaceUsage } from './workbench-usage.ts'

export type WorkbenchActions = {
  enterWorkspace: (id: WorkspaceId) => Promise<void>
  addWorkspace: () => void
  refreshUsage: (ids: readonly SessionId[]) => void
}

/** Folder landing page: conversations remain mounted only in their own main panel. */
export function Workbench({ useWorkspaces, useSessions, t, enterWorkspace, addWorkspace, refreshUsage }: PropsRuntime<'main'> & PropsLocale<'workspace'> & WorkbenchActions) {
  const workspaces = useWorkspaces(state => state.items)
  const sessions = useSessions(state => state)
  const [query, setQuery] = useState('')
  const [recent, setRecent] = useState(false)
  const [selected, setSelected] = useState<WorkspaceId>()
  const [pending, setPending] = useState<WorkspaceId>()
  const [error, setError] = useState('')
  const [infoOpen, setInfoOpen] = useState(false)
  const defaultName = t('workspace.defaultName')
  const folders = useMemo(() => {
    const result = workspaces.filter(item =>
      workspaceDisplayTitle(item.title, defaultName).toLocaleLowerCase().includes(query.toLocaleLowerCase()))
    return recent ? [...result].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)) : result
  }, [workspaces, query, recent, defaultName])
  const detail = workspaces.find(item => item.workspaceId === selected) ?? folders[0]
  const sessionIds = detail?.sessionIds
  const unreadIds = useMemo(() => (sessionIds ?? []).filter((id) => {
    const state = sessions.projectionsBySession[id]?.state
    return state === undefined || state === 'idle'
  }), [sessionIds, sessions.projectionsBySession])
  useEffect(() => {
    if (unreadIds.length > 0) refreshUsage(unreadIds)
  }, [unreadIds, refreshUsage])
  const usage = workspaceUsage(sessionIds ?? [], sessions)
  const hasUsage = detail !== undefined && (usage.known > 0 || usage.count === 0)
  const count = (value: number) => value.toLocaleString()
  const open = async (id: WorkspaceId) => {
    if (pending) return
    setPending(id)
    setError('')
    try { await enterWorkspace(id) }
    catch (cause) { setError(cause instanceof Error ? cause.message : t('workbench.openError')) }
    finally { setPending(undefined) }
  }
  return <div className={css.root} data-testid="workbench" onPointerDown={(event) => {
    if (event.target instanceof Element && !event.target.closest('[data-info-dock]')) setInfoOpen(false)
  }}>
    <main className={css.content}>
      <div className={css.breadcrumb}><IconFolderCloseRegular size={16} /> {t('workbench.home')} <span>/</span> {t('section.workspaces')}</div>
      <header className={css.heading}><div><h1>{t('workbench.title')}</h1><p>{t('workbench.subtitle')}</p></div><button className={css.primary} onClick={addWorkspace}>{t('workspace.add')}</button></header>
      <div className={css.toolbar}><label className={css.search}><IconSearchOutlineRegular size={16} /><input aria-label={t('workbench.search')} placeholder={t('workbench.search')} value={query} onChange={event => setQuery(event.target.value)} /></label><button className={css.filter} aria-pressed={recent} onClick={() => setRecent(!recent)}>{t(recent ? 'orderBy.updated' : 'orderBy.manual')}</button></div>
      {error && <div role="alert" className={css.error}>{t('workbench.openError')} · {error}</div>}
      <div className={css.grid} aria-busy={pending !== undefined}>
        {folders.map(folder => <button key={folder.workspaceId} className={`${css.folder} ${detail?.workspaceId === folder.workspaceId ? css.selected : ''}`} disabled={pending !== undefined} onMouseEnter={() => setSelected(folder.workspaceId)} onFocus={() => setSelected(folder.workspaceId)} onClick={() => { void open(folder.workspaceId) }} aria-label={`${t('workbench.open')} ${workspaceDisplayTitle(folder.title, defaultName)}`}>
          <span className={css.paper} aria-hidden="true" /><span className={css.paperTwo} aria-hidden="true" /><span className={css.folderFront} aria-hidden="true" />
          <span className={css.folderText}><strong>{workspaceDisplayTitle(folder.title, defaultName)}</strong><span>{t('workbench.sessions', { n: folder.sessionIds.length })}</span><small>{pending === folder.workspaceId ? t('picker.loading') : t('workbench.openHint')}</small></span>
        </button>)}
      </div>
      {folders.length === 0 && <div className={css.empty}><IconFolderCloseRegular size={36} /><p>{query ? t('empty.noMatches') : t('workbench.empty')}</p>{!query && <button className={css.filter} onClick={addWorkspace}>{t('workspace.add')}</button>}</div>}
    </main>
    <div className={`${css.infoDock} ${infoOpen ? css.infoDockOpen : ''}`} data-info-dock="" onMouseEnter={() => setInfoOpen(true)} onMouseLeave={() => setInfoOpen(false)} onFocus={() => setInfoOpen(true)} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setInfoOpen(false)
    }} onKeyDown={(event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
        setInfoOpen(false)
      }
    }}>
      <Tooltip label={t('workbench.showInfo')} side="bottom" align="end"><button className={css.infoTrigger} aria-label={t('workbench.showInfo')} aria-expanded={infoOpen} onClick={() => setInfoOpen(true)}><IconFolderCloseRegular size={16} /></button></Tooltip>
      <aside className={css.info} aria-label={t('workbench.info')} aria-hidden={!infoOpen} ref={(node) => { node?.toggleAttribute('inert', !infoOpen) }}><h2>{t('workbench.info')}</h2><div className={css.stat}><span>{t('section.workspaces')}</span><strong>{workspaces.length}</strong><div className={css.meter} /></div><div className={css.stat}><span>{t('section.sessions')}</span><strong>{workspaces.reduce((sum, item) => sum + item.sessionIds.length, 0)}</strong><div className={`${css.meter} ${css.secondaryMeter}`} /></div>
        <section className={`${css.stat} ${css.usage}`} aria-label={t('workbench.tokens')}>
          <span>{t('workbench.tokens')}</span><strong>{hasUsage ? count(usage.total) : t('workbench.usageUnknown')}</strong>
          <dl><dt>{t('workbench.inputTokens')}</dt><dd>{hasUsage ? count(usage.input) : t('workbench.usageDash')}</dd><dt>{t('workbench.outputTokens')}</dt><dd>{hasUsage ? count(usage.output) : t('workbench.usageDash')}</dd></dl>
          <p>{t(usage.known < usage.count ? 'workbench.usagePartial' : 'workbench.usageScope', { known: usage.known, count: usage.count })}</p>
          {usage.failed && <button className={css.filter} onClick={() => refreshUsage(sessionIds ?? [])}>{t('workbench.usageRetry')}</button>}
        </section>
        <h3>{t('workbench.properties')}</h3>{detail ? <dl><dt>{t('field.workspaceName')}</dt><dd>{workspaceDisplayTitle(detail.title, defaultName)}</dd><dt>{t('workbench.created')}</dt><dd>{new Date(detail.createdAt).toLocaleDateString()}</dd><dt>{t('workbench.updated')}</dt><dd>{new Date(detail.updatedAt).toLocaleDateString()}</dd></dl> : <p>{t('workbench.empty')}</p>}<div className={css.infoFoot}><IconFolderCloseRegular size={16} /><span>{t('workbench.local')}</span></div>
      </aside>
    </div>
  </div>
}
