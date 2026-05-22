# Security Red-Team Harness

`vibe security-redteam` runs local safety checks against VibeCLI guardrails:

- path traversal rejection
- absolute path rejection
- `.env` and private key patch blocking
- protected `.vibecli/policies` path blocking
- dangerous command denial
- SSRF-style remote target validation
- disposal scope safety
- redaction expectations

It does not call providers, mutate source, delete files, or use the network.
