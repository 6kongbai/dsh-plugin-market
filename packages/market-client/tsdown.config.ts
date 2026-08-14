import { defineConfig } from 'tsdown'

/**
 * Client-half bundle. Mirrors the harness's `clientBundle` preset in minimal
 * form: the browser half is a closure-factory artifact that calls
 * `window.__ModuleLoader__.load({ id, factory })` and resolves platform
 * modules through the injected require (the loader module table). The list
 * below is the harness `PLATFORM_MODULES` plus the documented runtime
 * exemption — only `react` is value-imported by this panel; the rest are
 * type-only and erased. The node half (`src/index.ts`) is emitted by tsc and
 * bundled as plain ESM.
 */
const PLATFORM_MODULES = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-web-react',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-attachment',
  '@deepseek-ai/dsh-client-schema-form',
  '@deepseek-ai/dsh-client-runtime/client',
]

const ID = 'dsh-plugin-market-client'

export default defineConfig([
  {
    name: ID,
    entry: ['lib/types/index.js'],
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    fixedExtension: false,
    dts: false,
    clean: false,
  },
  {
    name: `${ID}/client`,
    entry: { client: 'lib/types/client/index.js' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    target: 'es2024',
    dts: false,
    clean: false,
    sourcemap: true,
    external: PLATFORM_MODULES,
    noExternal: (id: string) => (PLATFORM_MODULES.includes(id) ? undefined : true),
    outputOptions: {
      entryFileNames: 'client.js',
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(ID)}, factory: (require) => {`,
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  },
])
