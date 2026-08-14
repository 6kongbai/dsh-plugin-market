# dsh-plugin-market

A plugin marketplace for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`): browse, install, and uninstall **community bundle plugins** from the [`dsh-plugin` GitHub topic](https://github.com/topics/dsh-plugin), from a sidebar Web panel and a CLI.

The community registry is a GitHub topic, not a proprietary index. Any repository tagged `dsh-plugin` whose `package.json` declares `dsh.bundle.patch` is installable.

## How it is provided

The marketplace is itself a dsh bundle: `cordis.patch.yml` inserts a Host half and a Client half over an existing web surface.

- **Host half** registers `/plugin-market/*` HTTP routes on `ctx.webServer` — no Typert Remote, which the harness generator cannot emit for out-of-tree npm packages. Routes map one-to-one onto the engine (search/info/list/install/uninstall).
- **Client half** contributes a sidebar foot action (beside Settings) whose panel drives those routes over same-origin fetch.
- **CLI** (`dsh-plugin-market`) reuses the same engine for headless use.

## Install

```sh
# bundle: installs the sidebar panel + CLI into the target profile
dsh plugin --profile web add github:6kongbai/dsh-plugin-market
```

Restart `dsh`; the marketplace icon appears at the sidebar foot. The bundle's `cordis.patch.yml` targets the `web` profile by default; edit the `plugin-market` row's `config.profile` (or set `DSH_PLUGIN_MARKET_PROFILE`) to target another profile.

Then:

```sh
dsh-plugin-market search <query>          # search the dsh-plugin topic
dsh-plugin-market info <owner/repo>       # detail + pinned install spec
dsh-plugin-market list                    # bundles installed in the profile
dsh-plugin-market install <owner/repo>    # confirm, pin, pnpm add, reconcile, audit
dsh-plugin-market uninstall <package>     # pnpm remove, reconcile, audit
```

Options:

- `--profile`, `-p <name>` — target profile (default `web`); overridable via `DSH_PLUGIN_MARKET_PROFILE`.
- `--yes`, `-y` — skip the install/uninstall confirmation.
- `GITHUB_TOKEN` — raise the anonymous GitHub API rate limit.

## How install works

`install <owner/repo>`:

1. reads the repository's `package.json` and verifies it declares `dsh.bundle.patch` (repositories without it are marked not-installable in `search`);
2. resolves the default branch's current head and **pins to a commit** — `pnpm add github:owner/repo#<sha>`, never a floating branch;
3. runs `pnpm add` in the target profile directory;
4. reconciles `dsh.profile.bundles` (a dependency declaring `dsh.bundle` joins the layer list; a removed one leaves it);
5. appends an audit line to `$DSH_HOME/plugin-install.log`.

`uninstall <package>` runs `pnpm remove`, reconciles, and audits. In both cases the new bundle activates on the next `dsh` restart.

## Architecture

```
dsh-plugin-market/
├── packages/market-host      Engine + Host gateway: GitHub indexing, install
│                             landing, reconcile, audit, and the MarketGateway
│                             Service registering /plugin-market routes.
├── packages/market-client    Client half: sidebar foot action + search panel.
└── packages/plugin-market    Bundle: cordis.patch.yml (inserts both halves) + CLI.
```

The engine (`dsh-plugin-market-host`) exposes `searchRepositories`, `fetchRepository`, `readRepositoryManifest`, `toHit`, `toDetail`, `resolvePinSpec`, `install`, `uninstall`, `installedBundleNames`, `profileDir`, and `auditLogPath`, plus the `MarketGateway` Service.

The Web panel is limited to the **web** platform (`localhost`), the same surface the harness webServer serves. The Electron desktop (`file://` + IPC bridge) is out of scope until a fetch bridge is wired.

## `dsh.market` metadata contract (for plugin authors)

A plugin repository participates by tagging `dsh-plugin` and declaring, in its `package.json`:

```jsonc
{
  "name": "dsh-plugin-foo",
  "version": "1.2.0",
  "description": "short description",   // fallback presentation
  "keywords": ["dev", "git"],           // fallback categories
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },  // REQUIRED to be installable
    "market": {                                   // OPTIONAL rich metadata
      "displayName": "Foo",
      "icon": "https://…",
      "categories": ["productivity"],
      "screenshots": ["https://…"]
    }
  }
}
```

`bundle.patch` is the hard gate. `market` falls back to the top-level `name`/`description`/`keywords` plus GitHub repository fields (`stars`, `updated_at`, `license`) when absent.

## Security model

Installing a community plugin downloads and runs arbitrary code with the current user's privileges. This tool therefore:

- shows `owner`, `stars`, `updated_at`, and `license` before install, with an explicit third-party-code warning;
- **pins to a commit** (`github:owner/repo#<sha>`), never a floating branch, so a later force-push cannot move what was installed;
- appends an audit record to `$DSH_HOME/plugin-install.log`;
- requires confirmation (interactive, `--yes` to skip).

Signature verification and an allowlist are not yet implemented — `dsh.bundle` has no signing mechanism today — and are tracked as future work.

## Development

Requires Node `^22.19 || >=24`, pnpm, and the pre-release harness packages (`@deepseek-ai/dsh-app-boot@0.1.0-rc.6`, `@deepseek-ai/dsh-home-paths@0.1.0-rc.6`).

```sh
pnpm install
pnpm build        # builds the engine and CLI packages
pnpm test
```

## License

MIT
