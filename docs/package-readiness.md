# Package Readiness

`vibe package-check` validates local packaging readiness without publishing.

It checks package metadata, CLI bin configuration, README/SECURITY presence, dist build presence, `npm pack --dry-run`, temp tarball creation, and secret exclusion from package listings.

It never runs `npm publish`, never logs into a registry, and never pushes a release.
