# Changelog

## 1.1.5

- Collapsing the project tree no longer clips the Jcat title on macOS.
- The expand control sits in the tab row, inset like the project column, instead of covering open files.

## 1.1.4

- Clicking a project-tree row no longer grabs the pointer, so the window does not freeze on macOS or Windows.
- Dragging a file out of a folder can land on the project root.
- Expanding or collapsing a folder does not leave that row highlighted.

## 1.1.3

- macOS save dialogs follow the language chosen in Jcat.
- The project tree has more space between rows.
- Long-press a file or folder to drag it into or out of a folder.
- The project checkbox now shows only Java files.

## 1.1.2

- Code long-image export includes the full run log, not the last few lines.
- The run pane scrolls to the newest output.
- On Windows, dragging empty titlebar space moves the window.

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
