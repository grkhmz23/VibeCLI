# Beta Terminal Test

Use this checklist after the repository is pushed. These commands are intended for a normal local terminal.

## Install From GitHub

```sh
npm install -g git+https://github.com/grkhmz23/VibeCLI.git#main
vibe --version
vibe --help
```

## Provider-Free Smoke

Create a temporary test directory so your project source is not modified:

```sh
mkdir -p /tmp/vibecli-terminal-smoke
cd /tmp/vibecli-terminal-smoke
vibe init
vibe doctor
vibe run "terminal smoke dry-run"
vibe status
```

Dry-run mode does not require provider API keys.

## Optional OpenRouter Live Smoke

Only run this if you want to spend a tiny amount of provider quota:

```sh
export OPENROUTER_API_KEY="..."
vibe live-smoke --rc --confirm "RUN LIVE RC SMOKE"
```

The live RC smoke sends a minimal prompt, does not generate patches, does not write source files, does not deploy, does not publish, and does not push branches or tags.

## Local Tarball Alternative

From a clone:

```sh
pnpm install
pnpm build
npm pack
npm install -g ./vibecli-0.1.0.tgz
vibe --version
```

## Cleanup

Uninstall the global CLI:

```sh
npm uninstall -g vibecli
```

Remove only the temporary smoke directory you created:

```sh
rm -rf /tmp/vibecli-terminal-smoke
```

Do not remove real project directories, evidence archives, private keys, or `.env` files as part of this smoke.
