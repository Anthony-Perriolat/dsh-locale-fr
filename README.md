# dsh-locale-fr

French language pack for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness): it adds **Français** to the web GUI's language selector.

## Install

```sh
dsh plugin --profile web add github:Anthony-Perriolat/dsh-locale-fr
```

Then restart the host and pick **Settings → General → Language → Français**.

Installed from npm instead, once published:

```sh
dsh plugin --profile web add dsh-locale-fr
```

## What it covers

57 product namespaces, 2587 strings, from the shared `common` vocabulary through the settings rows, the conversation transcript, the sidebars, the schedules, and the plugin manager.

Every dictionary is keyed to the English key set of the namespace it translates, and the locale service resolves `fr` then `en`. A key this pack does not translate renders its English text instead of failing, so partial coverage stays usable.

## How it works

A DSH language pack uses two documented locale-service entry points: `ctx.locale.addLanguage({ id: 'fr', label: 'Français', fallback: 'en' })` adds the language, and the single-locale form `ctx.locale.register(namespace, 'fr', dictionary)` supplies each namespace. The typed `register(ns, { zh, en })` form is left untouched, so the shipped dictionaries and their key unions keep their current shape.

The pack declares no runtime import, so `lib/client.js` is a module-loader artifact with the dictionaries inlined and no `require()` call at all.

## Layout

| Path | Role |
|---|---|
| `src/dictionaries/*.json` | One file per locale namespace. The reviewable source of truth. |
| `src/dictionaries.json` | Namespace to dictionary-file index. |
| `src/index.js` | Host half. An `apply()` stub, because the pack registers nothing host-side. |
| `scripts/build.mjs` | Builds `lib/client.js` and `lib/index.js` from `src/`. |
| `lib/` | Committed build output, served to the browser. |
| `test/smoke.mjs` | Loads the built bundle the way DSH does and asserts the registration. |

```sh
npm run build   # regenerate lib/ from src/
npm test        # build smoke test
```

## Known limitations

- **Coverage tracks one revision of the sources.** The dictionaries were keyed to the English key sets at the revision they were written from. A key added later keeps showing English until the dictionary is updated, and a removed key leaves an unused entry.
- **No plural rules.** Count-bearing strings use the `one`/`other` keys each namespace already declares, which follows the English two-form split.
- **Translation quality is a review responsibility.** The smoke test proves key coverage and a working registration, not that a French string is idiomatic.

## Contributing

Corrections to the French wording are welcome. Edit the JSON file for the namespace in `src/dictionaries/`, run `npm test`, and open a pull request. Keeping the key set identical to the namespace's English dictionary is the one hard requirement.

## Licence

MIT
