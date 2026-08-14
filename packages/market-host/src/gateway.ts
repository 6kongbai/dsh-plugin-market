/**
 * Host-half Web gateway: registers `/plugin-market/*` routes on `ctx.webServer`
 * so the sidebar panel can drive the marketplace over plain HTTP. This is the
 * out-of-tree alternative to a Typert Remote face, which the harness generator
 * cannot yet emit for an installed npm package. Routes map one-to-one onto the
 * engine functions; install/uninstall land through the same code path as the
 * CLI. The server is loopback-only dev tooling, so the trust boundary is the
 * client-side confirmation plus the commit pin and audit performed here.
 * @module dsh-plugin-market-host/gateway
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import { Context, Service } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type {} from '@deepseek-ai/dsh-host-webserver'
import {
  fetchRepository,
  isRepoSlug,
  readRepositoryManifest,
  searchRepositories,
  toDetail,
  toHit,
} from './market/github.ts'
import {
  install as installPlugin,
  installedBundleNames,
  uninstall as uninstallPlugin,
} from './install.ts'

const ROUTE_PREFIX = '/plugin-market'

/** Gateway configuration. */
export interface Config {
  /** Profile name installs/uninstalls land in. */
  profile?: string
}

/** Read the full request body as UTF-8 text. */
async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks).toString('utf8')
}

/** Write a JSON response with the given status. */
function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(payload))
}

/**
 * Host-side marketplace service. Activation registers one prefix route; each
 * request is dispatched on its sub-path. Every handler is wrapped so a thrown
 * engine error becomes a JSON 500 instead of an unhandled rejection.
 */
export class MarketGateway extends Service {
  static Config: z<Config> = z.object({
    profile: z.string().default('web'),
  })

  static inject = ['webServer']

  /** Validated, defaulted configuration. */
  readonly config: Config

  constructor(ctx: Context, config: Config) {
    super(ctx, 'marketGateway')
    this.config = config
    ctx.effect(() => ctx.webServer.register({
      kind: 'prefix',
      path: ROUTE_PREFIX,
      handler: (req, res) => this.handle(req, res),
    }), 'marketGateway.routes')
  }

  private get profile(): string {
    return this.config.profile ?? 'web'
  }

  private get token(): string | undefined {
    return process.env.GITHUB_TOKEN
  }

  private async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const url = new URL(req.url ?? '/', 'http://x')
      const subpath = url.pathname.slice(ROUTE_PREFIX.length)
      switch (subpath) {
        case '/search': {
          const query = url.searchParams.get('q') ?? ''
          const response = await searchRepositories(query, this.token)
          return sendJson(res, 200, {
            query,
            entries: response.items.map(toHit),
            total: response.total_count,
          })
        }
        case '/info': {
          const repo = url.searchParams.get('repo') ?? ''
          if (!isRepoSlug(repo)) return sendJson(res, 400, { error: `invalid repository ${JSON.stringify(repo)}` })
          const [summary, manifest] = await Promise.all([
            fetchRepository(repo, this.token),
            readRepositoryManifest(repo, this.token),
          ])
          const installed = manifest?.name !== undefined
            && installedBundleNames(this.profile).includes(manifest.name)
          return sendJson(res, 200, await toDetail(repo, summary, manifest, installed, this.token))
        }
        case '/list': {
          return sendJson(res, 200, { profile: this.profile, bundles: installedBundleNames(this.profile) })
        }
        case '/install': {
          const { repo } = JSON.parse(await readBody(req)) as { repo?: string }
          if (repo === undefined || !isRepoSlug(repo)) {
            return sendJson(res, 400, { error: `invalid repository ${JSON.stringify(repo)}` })
          }
          const result = await installPlugin(repo, this.profile)
          return sendJson(res, 200, { package: result.package, pinSpec: result.pinSpec, profile: this.profile })
        }
        case '/uninstall': {
          const { package: packageName } = JSON.parse(await readBody(req)) as { package?: string }
          if (packageName === undefined || packageName.length === 0) {
            return sendJson(res, 400, { error: 'missing package name' })
          }
          uninstallPlugin(packageName, this.profile)
          return sendJson(res, 200, { package: packageName, profile: this.profile })
        }
        default:
          return sendJson(res, 404, { error: `unknown route ${subpath}` })
      }
    } catch (error) {
      sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) })
    }
  }
}

export default MarketGateway
