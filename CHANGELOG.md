# Changelog

## 1.1.1

Stability, exam-mode reliability, AI privacy wording, API key storage, i18n, tests, and CI.

- Exam timers use absolute deadlines (`Date.now()`), survive sleep/background, pause correctly, and restore after quit.
- Entering exam mode aborts ghost write, AI Debug, and a running Java program. The main process rejects those actions while an exam is active.
- Exam recap reports only off-exam APIs **added during this exam**.
- AI Debug has Stop, timeouts, length limits, request isolation, and translatable errors.
- API keys move from plaintext `settings.json` into local `secrets.bin`, encrypted with Electron `safeStorage` user-level encryption, with a v1.1.0 migration path. The renderer never receives the full key.
- README (zh / en / ko) states when code is sent to DeepSeek, that Jcat does not ship a JDK, and that current builds are unsigned / not notarized.
- Titlebar More menu stacks above the sidebar handle; keyboard focus on titlebar buttons uses the theme accent with a fade.
- `npm test`, lint-clean CI on pull requests, and tag releases that verify then attach SHA-256 sums.
- Windows `jcat-VERSION-setup.exe` is electron-builder's multi-arch NSIS (x64 + ARM64 payloads), not a renamed x64 copy.

## 1.1.0

First public GitHub Release: exam tools, AI Debug, local-only API keys, and installers for macOS Apple Silicon plus Windows x64 / ARM64.
