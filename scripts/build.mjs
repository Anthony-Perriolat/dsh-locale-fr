/**
 * Build the browser bundle DSH serves. The pack declares no runtime import, so
 * its module-loader artifact is assembled directly instead of bundled: the
 * dictionaries are inlined and the factory calls require() for nothing.
 *
 *   node scripts/build.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(readFileSync(join(root, 'src/dictionaries.json'), 'utf8'))
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

const dictionaries = {}
for (const entry of manifest) {
  dictionaries[entry.namespace] = JSON.parse(readFileSync(join(root, 'src', entry.file), 'utf8'))
}

/** Serialize for inline JavaScript, escaping the two line separators JSON leaves raw. */
const literal = value => JSON.stringify(value)
  .replaceAll('\u2028', '\\u2028')
  .replaceAll('\u2029', '\\u2029')

const bundle = `window.__ModuleLoader__.load({
\tid: ${literal(pkg.name)},
\tfactory: (require) => {
\t\tvar module = { exports: {} };
\t\tvar exports = module.exports;
\t\tObject.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
\t\tconst FR_DICTIONARIES = ${literal(dictionaries)};
\t\tconst inject = ["locale"];
\t\tfunction apply(ctx) {
\t\t\tctx.effect(
\t\t\t\t() => ctx.locale.addLanguage({ id: "fr", label: "Fran\u00e7ais", fallback: "en" }),
\t\t\t\t"locale-fr: language definition",
\t\t\t);
\t\t\tfor (const [namespace, dictionary] of Object.entries(FR_DICTIONARIES)) {
\t\t\t\tctx.effect(
\t\t\t\t\t() => ctx.locale.register(namespace, "fr", dictionary),
\t\t\t\t\t\`locale-fr: \${namespace} dictionary\`,
\t\t\t\t);
\t\t\t}
\t\t}
\t\texports.inject = inject;
\t\texports.apply = apply;
\t\treturn module.exports;
\t}
});
`

mkdirSync(join(root, 'lib'), { recursive: true })
writeFileSync(join(root, 'lib/client.js'), bundle)
writeFileSync(join(root, 'lib/index.js'), readFileSync(join(root, 'src/index.js'), 'utf8'))

const keys = Object.values(dictionaries).reduce((sum, d) => sum + Object.keys(d).length, 0)
console.log(`lib/client.js: ${Object.keys(dictionaries).length} namespaces, ${keys} keys, ${Buffer.byteLength(bundle)} bytes`)
