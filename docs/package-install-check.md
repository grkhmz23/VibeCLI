# Package Install Check

`vibe package-install-check` validates local package install behavior without publishing.

It checks package metadata, CLI bin wiring, tarball contents, temp local install, and basic installed CLI commands. It does not run `npm publish`, registry login, deploy, push, or release commands.

Command:

- `vibe package-install-check`
