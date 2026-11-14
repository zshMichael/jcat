# Changelog

## 1.2.1

- The Mac disk image includes a note with the command to clear the download flag before the first open.

## 1.2.0

1.1.2 through 1.1.25 were small fixes. They are included here instead of listed one by one.

- A course folder of labs is a workspace. Each lab compiles and runs on its own, and the public classes in that lab can call each other. A file with more than one top-level type keeps its name.
- On macOS, title-bar buttons stay clickable, including Settings. Menus animate open and closed.
- On Windows, the window opens across most of the display, the caption buttons are the system ones, and the interface uses Segoe UI.
- Saving a long image opens a preview. You can join the files in this project vertically or horizontally, drag them into order, hide line numbers, and try another theme without changing the editor. The card follows the longest line and leaves room after the last character. The preview frame stays put: drag to look around, scroll to zoom, and a button returns to the start.
- The file menu can show an item in Finder or Explorer. 夜航 replaces the pistachio theme. New file and new folder always create an entry. The run-class menu fits the longest name. The project tree can show only Java files, and files can be dragged between folders.

## 1.1.1

Stability, exam-mode reliability, AI privacy wording, API key storage, i18n, tests, and CI.

- Exam timers use absolute deadlines (`Date.now()`), survive sleep/background, pause correctly, and restore after quit.
- Entering exam mode aborts ghost write, AI Debug, and a running Java program. The main process rejects those actions while an exam is active.
- Exam recap reports only off-exam APIs added during this exam.
- AI Debug has Stop, timeouts, length limits, request isolation, and translatable errors.
- API keys move from plaintext `settings.json` into local `secrets.bin`, encrypted with Electron `safeStorage`. The renderer never receives the full key.
- README states when code is sent to DeepSeek, that Jcat does not ship a JDK, and that builds are unsigned.
- `npm test` and tag releases that verify the build and attach SHA-256 sums.
- The Windows setup installer carries both x64 and ARM64 payloads.

## 1.1.0

First public GitHub Release: exam tools, AI Debug, local-only API keys, and installers for macOS Apple Silicon plus Windows x64 / ARM64.
