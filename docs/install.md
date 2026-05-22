# Install VibeCLI

VibeCLI is a local-first CLI. It can be tested from a clone, from a local tarball, or directly from the pushed GitHub repository. It is not published to npm in this beta prep step.

## Prerequisites

- Node.js 20 or newer
- pnpm 10.x for development from source
- npm for tarball or GitHub global installs
- Git, when installing from GitHub

## Local Clone

```sh
git clone https://github.com/grkhmz23/VibeCLI.git
cd VibeCLI
pnpm install
pnpm build
pnpm vibe --help
```

Run a provider-free dry run:

```sh
pnpm vibe init
pnpm vibe doctor
pnpm vibe run "terminal smoke dry-run"
pnpm vibe status
```

## Local Tarball

From the repository root:

```sh
pnpm install
pnpm build
npm pack
npm install -g ./vibecli-0.1.0.tgz
vibe --help
vibe --version
```

Uninstall the global tarball install:

```sh
npm uninstall -g vibecli
```

## GitHub Install

After the current `main` branch is pushed, install directly from GitHub:

```sh
npm install -g git+https://github.com/grkhmz23/VibeCLI.git#main
vibe --help
vibe --version
```

Without a branch pin:

```sh
npm install -g git+https://github.com/grkhmz23/VibeCLI.git
```

GitHub installation runs the package `prepare` script, which builds `dist/` locally during installation.

## Optional Provider Setup

Dry-run workflows do not need provider keys. For OpenRouter live smoke or live runs:

```sh
export OPENROUTER_API_KEY="..."
vibe providers add openrouter
vibe providers doctor
```

Never commit `.env` files or raw API keys.

## Troubleshooting

- If `vibe` is not found after global install, check `npm bin -g` or your npm global prefix path.
- If GitHub install fails during build, run `node --version` and confirm Node.js is at least 20.
- If provider doctor reports a missing key, dry-run workflows still work. Export the provider key only when you want live provider calls.
- If shell permissions block the CLI, rebuild from source with `pnpm build`; the build script marks `dist/index.js` executable.
