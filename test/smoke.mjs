/**
 * Load the built bundle the way the DSH module loader does and assert the pack
 * registers the fr definition plus one dictionary per namespace.
 *
 *   node test/smoke.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const expected = JSON.parse(readFileSync(join(root, 'src/dictionaries.json'), 'utf8'))
const source = readFileSync(join(root, 'lib/client.js'), 'utf8')

let loaded
globalThis.window = { __ModuleLoader__: { load: registration => { loaded = registration } } }
new Function(source)()

const failures = []
const check = (condition, message) => { if (!condition) failures.push(message) }
check(loaded !== undefined, 'the bundle never called window.__ModuleLoader__.load')

const exported = loaded.factory(specifier => {
  failures.push(`unexpected runtime require(${JSON.stringify(specifier)})`)
  return {}
})

const languages = []
const registrations = []
exported.apply({
  effect: fn => { fn() },
  locale: {
    addLanguage: language => { languages.push(language) },
    register: (ns, locale, dict) => { registrations.push({ ns, locale, dict }) },
  },
})

check(languages.length === 1 && languages[0].id === 'fr' && languages[0].label === 'Français'
  && languages[0].fallback === 'en', `language definition is ${JSON.stringify(languages[0])}`)
check(registrations.length === expected.length,
  `registered ${registrations.length} namespaces, expected ${expected.length}`)

let keys = 0
for (const registration of registrations) {
  if (registration.locale !== 'fr') failures.push(`${registration.ns} registered as ${registration.locale}`)
  for (const [key, value] of Object.entries(registration.dict)) {
    keys += 1
    if (typeof value !== 'string' || value.length === 0) failures.push(`${registration.ns}/${key}: empty value`)
  }
  const declared = expected.find(entry => entry.namespace === registration.ns)
  if (declared === undefined) failures.push(`${registration.ns} is not declared in src/dictionaries.json`)
}

if (failures.length > 0) {
  console.error(`smoke: ${failures.length} failure(s)`)
  for (const failure of failures) console.error(`  ${failure}`)
  process.exit(1)
}
console.log(`smoke: ok — ${registrations.length} namespaces, ${keys} keys, language ${languages[0].id}`)
