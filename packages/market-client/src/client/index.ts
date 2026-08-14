/**
 * Client half of the plugin marketplace: registers a sidebar foot action
 * (beside Settings) that opens a searchable panel driving the Host
 * `/plugin-market` HTTP routes. No Typert Remote is involved — the panel talks
 * to the Host gateway over same-origin fetch.
 * @module dsh-plugin-market-client/client
 */

import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { MarketplacePanel } from './MarketplacePanel.tsx'
import { en, zh, type MarketLocaleKey } from './locales.ts'

export type { MarketplacePanelProps } from './MarketplacePanel.tsx'
export type { MarketLocaleKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Marketplace panel copy. */
    market: MarketLocaleKey
  }
}

/** Dictionary namespace owned by this plugin. */
const NS = 'market'

/** Services required by the sidebar foot-action registration. */
export const inject = ['slots', 'locale']

/**
 * Contribute the marketplace foot action to the sidebar.
 * @param ctx - Client Cordis root.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-plugin-market-client: dictionaries')

  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action',
    id: 'market',
    order: 100,
    label: () => 'Plugin Marketplace',
    locale: NS,
    inject: () => ({}),
  }, MarketplacePanel))
}
