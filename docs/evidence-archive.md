# Evidence Archive

`vibe evidence-archive <run-id>` is preview-only. Archive creation requires exact confirmation:

```bash
vibe evidence-archive <run-id> --create --confirm "ARCHIVE EVIDENCE <run-id>"
```

Archives are local redacted files under `.vibecli/evidence-archive/<run-id>/`. The archive manifest records included files, excluded files, hashes, size, mode, warnings, and optional signature evidence.

Archive verification:

```bash
vibe evidence-archive <run-id> --verify
```

Archives do not delete originals, move source files, upload evidence, include private keys, include `.env` files, include raw provider outputs by default, or include unbounded command logs.
