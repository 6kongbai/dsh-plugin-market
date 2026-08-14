/**
 * Marketplace sidebar foot action: a trigger beside Settings that opens a
 * searchable panel over the Host `/plugin-market` HTTP routes. The panel is a
 * pure view of plain fetch calls; every mutation is confirmed before landing.
 * @module dsh-plugin-market-client/client/MarketplacePanel
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'

/** Wire shapes returned by the Host gateway routes (mirror of the Host types). */
interface MarketSearchHit {
  readonly repo: string
  readonly description: string
  readonly stars: number
  readonly updatedAt: string
  readonly license: string | null
}

interface MarketSearchResult {
  readonly entries: readonly MarketSearchHit[]
  readonly total: number
}

interface MarketEntryDetail {
  readonly repo: string
  readonly displayName: string
  readonly description: string
  readonly stars: number
  readonly updatedAt: string
  readonly license: string | null
  readonly installable: boolean
  readonly installed: boolean
}

/** Full component props assembled by the sidebar foot-action renderer. */
export type MarketplacePanelProps =
  PropsRuntime<'sidebar.footer.action'>
  & PropsLocale<'market'>

type ViewState =
  | { readonly status: 'loading' }
  | { readonly status: 'error' }
  | { readonly status: 'ready'; readonly entries: readonly MarketSearchHit[] }

const BUTTON_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 10px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  borderRadius: 6,
  fontSize: 13,
}

const PANEL_STYLE: React.CSSProperties = {
  position: 'fixed',
  right: 16,
  bottom: 56,
  width: 360,
  maxHeight: '70vh',
  overflow: 'auto',
  background: 'var(--surface, #fff)',
  border: '1px solid var(--border, #ddd)',
  borderRadius: 10,
  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
  padding: 12,
  zIndex: 1000,
}

/** GET a JSON route and unwrap a non-2xx into an error. */
async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(path)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json() as Promise<T>
}

/** POST a JSON body to a route and unwrap a non-2xx into an error. */
async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json() as Promise<T>
}

/** Render the marketplace foot action and its panel. */
export function MarketplacePanel({ wide, t }: MarketplacePanelProps): ReactNode {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [state, setState] = useState<ViewState>({ status: 'loading' })
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let current = true
    setState({ status: 'loading' })
    void apiGet<MarketSearchResult>(`/plugin-market/search?q=${encodeURIComponent(query)}`).then(
      (result) => { if (current) setState({ status: 'ready', entries: result.entries }) },
      () => { if (current) setState({ status: 'error' }) },
    )
    return () => { current = false }
  }, [open, query])

  const entries = useMemo(
    () => state.status === 'ready' ? state.entries : [],
    [state],
  )

  const onInstall = async (repo: string): Promise<void> => {
    if (!window.confirm(t('confirmInstall'))) return
    setNotice(null)
    try {
      await apiPost<MarketEntryDetail>('/plugin-market/install', { repo })
      setNotice(t('restart'))
      setOpen(false)
    } catch (error) {
      setNotice((error as Error).message)
    }
  }

  return (
    <div>
      <button
        type="button"
        style={BUTTON_STYLE}
        onClick={() => { setOpen(value => !value) }}
        aria-expanded={open}
        title={t('title')}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path
            fill="currentColor"
            d="M3 2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H3Zm0 1h4v3H3V3Zm5 0h4v3H8V3Zm-5 4h4v6H3V7Zm5 0h4v6H8V7Z"
          />
        </svg>
        {wide ? <span>{t('title')}</span> : null}
      </button>
      {open ? (
        <div style={PANEL_STYLE} role="dialog" aria-label={t('title')}>
          <input
            type="search"
            value={query}
            placeholder={t('search')}
            aria-label={t('search')}
            onChange={(event) => { setQuery(event.currentTarget.value) }}
            style={{ width: '100%', padding: 8, marginBottom: 10, boxSizing: 'border-box' }}
          />
          {notice !== null ? <p role="status">{notice}</p> : null}
          {state.status === 'loading' ? <p>{t('loading')}</p> : null}
          {state.status === 'error' ? <p role="alert">{t('error')}</p> : null}
          {state.status === 'ready' && entries.length === 0 ? <p>{t('empty')}</p> : null}
          {state.status === 'ready' && entries.length > 0 ? (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {entries.map((entry) => (
                <li key={entry.repo} style={{ padding: '10px 0', borderTop: '1px solid var(--border, #eee)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{entry.repo}</strong>
                    <span>{t('stars')} {entry.stars}</span>
                  </div>
                  <p style={{ margin: '4px 0', fontSize: 12, color: 'var(--muted, #666)' }}>{entry.description}</p>
                  <div style={{ fontSize: 12, color: 'var(--muted, #888)' }}>
                    {entry.license !== null ? `${t('license')}: ${entry.license}` : null}
                  </div>
                  <button type="button" onClick={() => { void onInstall(entry.repo) }}>{t('install')}</button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
