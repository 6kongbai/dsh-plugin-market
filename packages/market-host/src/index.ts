/**
 * Engine + Host gateway for the dsh plugin marketplace: GitHub topic indexing,
 * profile install/uninstall landing, and the `MarketGateway` Service that
 * registers `/plugin-market` routes on `ctx.webServer`. The default export is
 * the Host plugin (a Cordis Service), so a bundle `insert` naming this package
 * mounts it; every other export is the engine the CLI and the gateway share.
 * @module dsh-plugin-market-host
 */

export type * from './types.ts'

export {
  fetchRepository,
  isRepoSlug,
  readRepositoryManifest,
  resolvePinSpec,
  searchRepositories,
  toDetail,
  toHit,
} from './market/github.ts'
export type {
  DshMarketManifest,
  RepoSummary,
  SearchResponse,
} from './market/github.ts'
export {
  auditLogPath,
  install,
  installedBundleNames,
  profileDir,
  uninstall,
} from './install.ts'

export { default, MarketGateway, type Config as MarketGatewayConfig } from './gateway.ts'
