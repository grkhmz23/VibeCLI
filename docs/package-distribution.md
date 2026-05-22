# Package Distribution Notes

This document covers local and GitHub package testing. It does not authorize npm publishing.

## Package Fields

The package exposes the CLI through:

```json
{
  "bin": {
    "vibe": "./dist/index.js"
  }
}
```

The package is ESM (`"type": "module"`), requires Node.js 20 or newer, and uses `prepare` and `prepack` to build `dist/` before GitHub installs and tarball packing.

## Included Files

The `files` whitelist includes:

- `dist/**/*.js`
- `dist/**/*.d.ts`
- `dist/**/*.js.map`
- `README.md`
- `SECURITY.md`
- `LICENSE`
- `docs/`
- `package.json`

The package must not include local runtime state, provider keys, private keys, dogfood reports, beta reports, run artifacts, evidence archives, or `node_modules`.

## Validation

Use:

```sh
pnpm build
npm pack --dry-run
npm pack --json
tar -tzf vibecli-0.1.0.tgz
```

Then install into a temporary prefix:

```sh
TMP_PREFIX="$(mktemp -d)"
npm install -g --prefix "$TMP_PREFIX" ./vibecli-0.1.0.tgz
"$TMP_PREFIX/bin/vibe" --help
"$TMP_PREFIX/bin/vibe" --version
```

## Why npm Publish Is Not Done Here

This beta prep validates that VibeCLI can be installed and tested from a local tarball or GitHub repository. It intentionally does not run `npm publish`, create a GitHub release, upload assets, deploy, push tags, or publish registry artifacts.

## Later npm Publish Checklist

Before any future npm publish, manually confirm:

- Package metadata, license, repository URL, and bin are final.
- `pnpm lint`, `pnpm test`, and `pnpm build` pass.
- `npm pack --dry-run` contains only expected files.
- A temporary global install works.
- No `.env`, `.vibecli`, private keys, runtime reports, or run artifacts are packed.
- Release notes and versioning are approved.
- Publishing credentials are handled outside VibeCLI logs.
