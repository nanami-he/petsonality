# Contributors

petsonality exists because people take time to file bugs, send patches, and tell
the project where it falls short. Thank you to everyone listed below.

Want to be on this list? See [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## Bug reports & triage

- [@Lwhieldon](https://github.com/Lwhieldon) — first user-reported bug ([#2](https://github.com/nanami-he/petsonality/issues/2)),
  caught the cross-platform installer issue on Windows 11 with a clean
  reproduction screenshot. The fix in v0.4.1 (replacing all `which`/`readlink`/`ls`
  shell-outs with pure-Node detection) was directly informed by his report.

## Code

- [@MestreY0d4-Uninter](https://github.com/MestreY0d4-Uninter) — first external
  PR ([#5](https://github.com/nanami-he/petsonality/pull/5)), shipped the
  Windows hook-command quoting fix that closed [#3](https://github.com/nanami-he/petsonality/issues/3).
  Bonus: refactored the change into a testable `formatHookCommand()` helper
  and added a unit test guarding the canonical Windows-paths-with-spaces case.
  Returned for [#11](https://github.com/nanami-he/petsonality/pull/11) (closes
  [#4](https://github.com/nanami-he/petsonality/issues/4)) — built the entire
  native PowerShell statusline renderer from scratch (~559 lines of `.ps1`,
  no jq dependency, multiple HomeDir fallbacks), centralized platform-specific
  command formatting via `cli/statusline-config.ts`, added shared `pet-art.json`
  data so bash + PowerShell render from one source of truth, plus tests.
- [@Lwhieldon](https://github.com/Lwhieldon) — three-in-one PR ([#12](https://github.com/nanami-he/petsonality/pull/12))
  shipped within 24h of his original bug report ([#2](https://github.com/nanami-he/petsonality/issues/2)):
  redesigned the golden retriever ASCII art (Bonnie, his actual dog) into a
  front-facing friendly face matching the project's 10-pet convention; fixed
  `pet_pet` to render the pet card inline so VSCode integrated terminal users
  see a visual (closes [#10](https://github.com/nanami-he/petsonality/issues/10));
  and converged on the same `fileURLToPath` Windows path fix as #7.

GitHub auto-tracks code commit authors in the repository's
[Contributors tab](https://github.com/nanami-he/petsonality/graphs/contributors).
Anyone who lands a merged PR shows up there automatically — this section adds
a sentence on what was actually contributed.

## Reactions, personalities, art, docs

_(none yet — this section is for non-code contributions: new reaction lines for a
specific personality, art tweaks for a pet, README/SKILL.md improvements,
translations, etc. Open a PR or issue with the proposed addition and you'll be
credited here.)_

## Ideas & feedback that shaped the product

_(reserved for substantive design feedback that altered the roadmap — not for
casual comments)_
