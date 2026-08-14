/**
 * Public data contracts shared by the marketplace engine and CLI. Every type
 * here is a JSON-safe, string-keyed shape: no symbols, no class instances, no
 * functions, so entries round-trip cleanly through the CLI and, later, a Web
 * GUI Remote.
 * @module dsh-plugin-market-host/types
 */

/** GitHub repository slug in `owner/repo` form. */
export type MarketRepo = string

/** One installable community plugin discovered from the `dsh-plugin` topic. */
export interface MarketEntry {
  /** `owner/repo` slug. */
  readonly repo: MarketRepo
  /** Human-facing name (from `dsh.market.displayName` or the package name). */
  readonly displayName: string
  /** Short description (from `dsh.market` or the repository description). */
  readonly description: string
  /** GitHub star count, used as a lightweight popularity signal. */
  readonly stars: number
  /** Repository push timestamp in ISO 8601. */
  readonly updatedAt: string
  /** SPDX license identifier, or null when GitHub reports none. */
  readonly license: string | null
  /** Stable category tags (from `dsh.market.categories` or package keywords). */
  readonly categories: readonly string[]
  /** Whether the repository declares a `dsh.bundle.patch` (installable at all). */
  readonly installable: boolean
  /** Whether the bundle package name is already in the target profile. */
  readonly installed: boolean
}

/** Search response over the GitHub topic. */
export interface MarketSearchResult {
  /** The query that produced this result. */
  readonly query: string
  /** Matching entries, in star-descending order. */
  readonly entries: readonly MarketEntry[]
  /** Total matches reported by GitHub (may exceed `entries` when paged). */
  readonly total: number
}

/** Full detail for one repository, read from its `package.json`. */
export interface MarketEntryDetail {
  readonly repo: MarketRepo
  readonly displayName: string
  readonly description: string
  /** Package version, or null when the manifest is unreadable. */
  readonly version: string | null
  readonly stars: number
  readonly updatedAt: string
  readonly license: string | null
  readonly homepage: string | null
  readonly icon: string | null
  readonly categories: readonly string[]
  readonly installable: boolean
  readonly installed: boolean
  /** The pinned install spec (`github:owner/repo#<sha>`), or null when not installable. */
  readonly pinSpec: string | null
}

/** One installed bundle in the target profile. */
export interface InstalledBundle {
  /** npm package name as listed in `dsh.profile.bundles`. */
  readonly package: string
  /** Resolved patch file path, or null when the package is not a bundle. */
  readonly patch: string | null
}

/** Installed bundle inventory for the target profile. */
export interface InstalledBundleList {
  /** Target profile name. */
  readonly profile: string
  readonly bundles: readonly InstalledBundle[]
}

/** Outcome of installing one repository into the target profile. */
export interface InstallResult {
  /** The npm package name that was added. */
  readonly package: string
  /** The pinned spec actually installed. */
  readonly pinSpec: string
  /** The target profile name. */
  readonly profile: string
}

/** Outcome of removing one package from the target profile. */
export interface UninstallResult {
  /** The npm package name that was removed. */
  readonly package: string
  /** The target profile name. */
  readonly profile: string
}
