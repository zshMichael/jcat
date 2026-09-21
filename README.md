# Jcat

[中文](#中文) · [English](#english) · [한국어](#한국어)

A local Java IDE for AP CSA: compile and run, ghost write, AI Debug, exam mode, and long-image export. Cats stay as line drawings.

---

## 中文

Jcat 是装在自己电脑上的 Java IDE，给 AP CSA 课堂和作业用。不用账号。Java 的编译和运行完全在本机完成。Jcat 没有自己的中转服务器。

DeepSeek 只在你主动开启幽灵补写或 AI Debug 时才会用到。那时，相关代码上下文会**直接**发到 DeepSeek API。没有填写 API Key 时，本地编译运行仍然可用。

### 能做什么

- 打开文件夹，或新建空工程 / Hello / Scanner / FRQ 骨架
- 本机 `javac` / `java`，有 Maven 工程就走 `mvn`
- 编辑器：主题、中英韩、查找、格式化、方法大纲
- 补写：灰色预写，按你正在写的往下补，Tab 采纳
- AI Debug：按给分点说，Java 用独立代码框，框上可复制；可随时停止
- 考试模式：选择题 / 自由作答各 90 分钟，可暂停、继续、重启；关闭应用后可恢复
- AP CSA 超纲提示、考试参考卡片
- 代码长图导出（可隐去行号）
- 空页面每日一句格言

### 安装 1.1.1

到 [Releases](https://github.com/zshMichael/jcat/releases/tag/v1.1.1) 下载：

| 系统                                | 文件                         |
| ----------------------------------- | ---------------------------- |
| macOS Apple Silicon                 | `jcat-1.1.1.dmg`             |
| Windows x64                         | `jcat-1.1.1-x64-setup.exe`   |
| Windows ARM64                       | `jcat-1.1.1-arm64-setup.exe` |
| Windows 自动识别（含 x64 与 ARM64） | `jcat-1.1.1-setup.exe`       |

安装包附带 `SHA256SUMS.txt`。下载后可核对自己文件的 SHA-256。当前没有 Apple 公证，也没有 Windows 代码签名。**不要**为了打开 Jcat 去关闭系统安全功能。

**macOS：** 包未公证。第一次打开：在访达中右键 Jcat → 打开。把 `/Applications/Jcat.app` 换掉即可覆盖升级，设置和 Key 还在。若系统提示无法验证开发者，用右键打开，而不是关掉 Gatekeeper。

**Windows：** 安装包未签名，SmartScreen 可能提示。选择「仍要运行」即可。用同一 `appId`（`com.jcat.ide`）覆盖安装，不必先卸载。x64 与 ARM64 专用包只含对应架构。`jcat-1.1.1-setup.exe` 是 NSIS 双架构包，安装时按系统选择负载，不是 x64 的改名复制。

卸载应用**不会**删除你的工程文件夹。默认也不删除用户数据。覆盖升级会保留主题、语言、JDK / Maven 路径、最近工程和 API Key。

### 需要本机 JDK

Jcat **不内置 JDK**。编译和运行 Java 需要本机已安装的 JDK。AP CSA 使用 Java；推荐 **Temurin 或 Oracle JDK 17 或 21**（含 `javac` 与 `java`）。

- **macOS：** Jcat 会查看 `JAVA_HOME`、`PATH` 上的 `javac`，以及 `/Library/Java/JavaVirtualMachines` 等常见位置。
- **Windows：** Jcat 会查看 `JAVA_HOME`、`PATH`，以及 `Program Files\Java`、Eclipse Adoptium、Microsoft Build of OpenJDK、Amazon Corretto、Zulu 等常见安装目录。
- 自动检测失败时：打开设置，填写 **JDK 路径（JDK Home）**。
- Maven 是可选项，只在含 `pom.xml` 的工程里需要。检测失败时可在设置里填写 Maven 路径。
- 工程路径可以包含中文和空格。

### 代码什么时候会离开这台电脑

- Java 编译和运行始终在本机。
- API Key 只保存在本机用户目录。v1.1.1 起把 Key 写入 `secrets.bin`，并用 Electron `safeStorage` 的**用户级加密**保护这份本地密文（macOS 上该加密由系统钥匙串能力支持，但并不是把原始 Key 当作一条钥匙串密码保存）。设置文件里不再保存明文 Key。若加密不可用或迁移失败，会明确提示，并保留旧明文直到迁移成功。
- **只有**你主动开启幽灵补写或 AI Debug 时，相关代码才会直接发给 DeepSeek API。
- AI Debug 可能发送源码、选区、编译错误和运行输出。
- Jcat 没有自己的中转服务器。
- 可以完全不配置 Key，本地编译运行仍然可用。

### 用户数据在哪

以本机实际运行结果为准（文件夹名是小写 `jcat`）：

| 系统    | 路径                                 |
| ------- | ------------------------------------ |
| macOS   | `~/Library/Application Support/jcat` |
| Windows | `%APPDATA%\jcat`                     |

其中 `settings.json` 是主题、语言、路径等设置；API Key 的密文在 `secrets.bin`（由 `safeStorage` 加密）。考试未结束时会另有 `exam-session.json`，**不含** API Key。覆盖升级会继续读这些文件。卸载默认不删除它们，也不会删除你自己的工程。

同一台电脑上 `npm run dev` 和已经装好的 Jcat 共用这份用户数据。

### 开发

需要 Node.js 20+，以及本机 JDK（可选 Maven）。

```bash
npm ci
npm run dev
```

打开 `examples/hello` 可以立刻编译运行。设置里填 DeepSeek API Key 后，更多菜单打开补写。

```bash
npm test
npm run lint
npm run typecheck
npm run build:mac    # macOS Apple Silicon dmg
npm run build:win    # Windows x64 + arm64
```

---

## English

Jcat is a local Java IDE for AP CSA labs and exams. There is no Jcat account. Java compile and run stay on this computer. Jcat has no relay server of its own.

DeepSeek is used only when you turn on ghost write or AI Debug. Then the relevant code context is sent **directly** to the DeepSeek API. You can skip the API key; local compile and run still work.

### Features

- Open a folder, or start an empty project / Hello / Scanner / FRQ skeleton
- Local `javac` / `java`, or Maven when a `pom.xml` is present
- Themes, Chinese / English / Korean, find, format, method outline
- Ghost write: grey continuation of what you are typing; Tab accepts
- AI Debug: scoring-point notes, Java in its own code frame with copy; stop anytime
- Exam mode: 90 minutes each for MC and FRQ, with pause, resume, restart, and restore after quit
- Off-exam API hints and exam reference cards
- Long-image export (optional hidden line numbers)
- A daily motto on the empty editor page

### Install 1.1.1

Grab a build from [Releases](https://github.com/zshMichael/jcat/releases/tag/v1.1.1):

| OS                         | File                         |
| -------------------------- | ---------------------------- |
| macOS Apple Silicon        | `jcat-1.1.1.dmg`             |
| Windows x64                | `jcat-1.1.1-x64-setup.exe`   |
| Windows ARM64              | `jcat-1.1.1-arm64-setup.exe` |
| Windows auto (x64 + ARM64) | `jcat-1.1.1-setup.exe`       |

Releases include `SHA256SUMS.txt`. Check the SHA-256 of the file you downloaded. Builds are **not** Apple-notarized and **not** Windows-signed. Do **not** turn off OS security features just to open Jcat.

**macOS:** not notarized. First launch: right-click Jcat → Open. Replacing `/Applications/Jcat.app` upgrades in place; settings and the key stay. If Gatekeeper warns, use Open from the context menu instead of disabling Gatekeeper.

**Windows:** unsigned, so SmartScreen may warn. Choose Run anyway. Setup overwrites the previous install (`appId` `com.jcat.ide` is stable). The x64 and ARM64 packages contain only that architecture. `jcat-1.1.1-setup.exe` is a multi-arch NSIS installer that picks the payload at install time; it is not a renamed x64 copy.

Uninstall does **not** delete your project folders. App data is kept by default. An in-place upgrade keeps theme, language, JDK / Maven paths, recent projects, and the API key.

### A JDK is required

Jcat does **not** ship a JDK. Compiling and running Java needs a JDK on the machine. AP CSA uses Java; **Temurin or Oracle JDK 17 or 21** (with `javac` and `java`) is recommended.

- **macOS:** Jcat looks at `JAVA_HOME`, `javac` on `PATH`, and common locations such as `/Library/Java/JavaVirtualMachines`.
- **Windows:** Jcat looks at `JAVA_HOME`, `PATH`, and common folders under Program Files (Java, Eclipse Adoptium, Microsoft, Amazon Corretto, Zulu, and similar).
- If detection fails: open Settings and set **JDK Home**.
- Maven is optional and only needed for Maven projects. You can also set the Maven path in Settings.
- Project paths may contain Chinese characters and spaces.

### When code leaves this computer

- Java compile and run are always local.
- The API key is stored only in this user account. v1.1.1 writes it to `secrets.bin` and protects that local ciphertext with Electron `safeStorage` user-level encryption (on macOS this uses Keychain-backed encryption; the raw key is not stored as a Keychain password item). `settings.json` no longer keeps a plaintext key. If encryption is unavailable or migration fails, Jcat says so and keeps the old plaintext until migration succeeds.
- Code is sent to DeepSeek **only** if you turn on ghost write or AI Debug.
- AI Debug may send source, a selection, compiler errors, and run output.
- Jcat has no proxy or relay of its own.
- You can leave the key empty; local compile and run still work.

### User data location

Confirmed from a running app (folder name is lowercase `jcat`):

| OS      | Path                                 |
| ------- | ------------------------------------ |
| macOS   | `~/Library/Application Support/jcat` |
| Windows | `%APPDATA%\jcat`                     |

`settings.json` holds theme, language, and paths. The API key ciphertext lives in `secrets.bin` (encrypted by `safeStorage`). An unfinished exam uses `exam-session.json`, which does **not** contain the key. Upgrades keep reading these files. Uninstall does not remove them by default, and never deletes your projects.

`npm run dev` and the installed app on the same computer share this folder.

### Develop

Node.js 20+ and a local JDK (Maven optional):

```bash
npm ci
npm run dev
```

Open `examples/hello` to compile and run. Add a DeepSeek API key in Settings, then turn on ghost write from More.

```bash
npm test
npm run lint
npm run typecheck
npm run build:mac
npm run build:win
```

---

## 한국어

Jcat은 AP CSA 수업·과제를 위한 로컬 Java IDE입니다. Jcat 계정은 없습니다. Java 컴파일과 실행은 이 컴퓨터에서만 이루어집니다. Jcat은 자체 중계 서버가 없습니다.

DeepSeek는 보강 입력 또는 AI Debug를 **직접 켠 뒤에만** 쓰입니다. 그때 관련 코드 맥락이 DeepSeek API로 **직접** 전송됩니다. API Key가 없어도 로컬 컴파일·실행은 됩니다.

### 할 수 있는 일

- 폴더 열기, 빈 프로젝트 / Hello / Scanner / FRQ 뼈대
- 로컬 `javac` / `java`, Maven 프로젝트는 `mvn`
- 테마, 중·영·한, 찾기, 포맷, 메서드 개요
- 보강 입력: 지금 쓰는 코드를 회색으로 이어서 채움, Tab으로 수락
- AI Debug: 배점 설명, Java는 전용 코드 상자(복사 가능), 언제든 중지
- 시험 모드: 객관식·서술형 각 90분, 일시정지·계속·다시 시작, 종료 후 복구
- 범위 밖 API 표시, 시험 참고 카드
- 코드 긴 그림 내보내기(줄 번호 숨김 가능)
- 빈 화면의 하루 한 문장

### 1.1.1 설치

[Releases](https://github.com/zshMichael/jcat/releases/tag/v1.1.1)에서 받습니다.

| OS                             | 파일                         |
| ------------------------------ | ---------------------------- |
| macOS Apple Silicon            | `jcat-1.1.1.dmg`             |
| Windows x64                    | `jcat-1.1.1-x64-setup.exe`   |
| Windows ARM64                  | `jcat-1.1.1-arm64-setup.exe` |
| Windows 자동 인식(x64 + ARM64) | `jcat-1.1.1-setup.exe`       |

릴리스에 `SHA256SUMS.txt`가 있습니다. 받은 파일의 SHA-256을 확인하세요. 현재 macOS 공증과 Windows 코드 서명은 없습니다. Jcat을 열려고 **시스템 보안 기능을 끄지 마세요.**

**macOS:** 공증되어 있지 않습니다. 처음 실행: Finder에서 Jcat을 우클릭 → 열기. `/Applications/Jcat.app`만 바꾸면 덮어쓰기 업그레이드되고 설정과 Key는 남습니다. Gatekeeper 경고가 나면 Gatekeeper를 끄지 말고 우클릭으로 여세요.

**Windows:** 서명이 없어 SmartScreen이 경고할 수 있습니다. 그래도 실행을 고르세요. 같은 `appId`(`com.jcat.ide`)로 덮어씁니다. x64와 ARM64 전용 패키지는 해당 아키텍처만 담습니다. `jcat-1.1.1-setup.exe`는 설치 시 아키텍처를 고르는 NSIS 듀얼 패키지이며, x64 파일을 이름만 바꾼 것이 아닙니다.

앱을 제거해도 **사용자 프로젝트 폴더는 지우지 않습니다.** 사용자 데이터도 기본으로 남습니다. 덮어쓰기 업그레이드는 테마, 언어, JDK/Maven 경로, 최근 프로젝트, API Key를 유지합니다.

### 로컬 JDK가 필요합니다

Jcat은 JDK를 **내장하지 않습니다.** Java를 컴파일·실행하려면 이 컴퓨터에 JDK가 있어야 합니다. AP CSA는 Java를 씁니다. **Temurin 또는 Oracle JDK 17 또는 21**(`javac`, `java` 포함)을 권장합니다.

- **macOS:** `JAVA_HOME`, `PATH`의 `javac`, `/Library/Java/JavaVirtualMachines` 등을 찾습니다.
- **Windows:** `JAVA_HOME`, `PATH`, Program Files의 Java / Eclipse Adoptium / Microsoft / Amazon Corretto / Zulu 등 흔한 설치 위치를 찾습니다.
- 자동 검출이 실패하면 설정에서 **JDK Home**을 입력하세요.
- Maven은 선택이며 `pom.xml`이 있는 프로젝트에서만 필요합니다. 설정에서 Maven 경로를 지정할 수 있습니다.
- 프로젝트 경로에 한글과 공백이 있어도 됩니다.

### 코드가 이 컴퓨터를 떠나는 때

- Java 컴파일과 실행은 항상 로컬입니다.
- API Key는 이 사용자 계정에만 저장됩니다. v1.1.1은 `secrets.bin`에 쓰고 Electron `safeStorage`의 **사용자 수준 암호화**로 이 로컬 암호문을 보호합니다(macOS에서는 Keychain이 이 암호화를 뒷받침하지만, 원문 Key를 열쇠고리 암호 항목으로 넣는 것은 아닙니다). `settings.json`에는 더 이상 평문 Key를 두지 않습니다. 암호화를 쓸 수 없거나 이전에 실패하면 분명히 알리고, 성공할 때까지 예전 평문을 남깁니다.
- 보강 입력 또는 AI Debug를 **직접 켠 경우에만** 관련 코드가 DeepSeek API로 전송됩니다.
- AI Debug는 소스, 선택 구간, 컴파일 오류, 실행 출력을 보낼 수 있습니다.
- Jcat 자체 프록시/중계 서버는 없습니다.
- Key를 비워 두어도 로컬 컴파일·실행은 됩니다.

### 사용자 데이터 위치

실제 실행으로 확인한 경로입니다(폴더 이름은 소문자 `jcat`):

| OS      | 경로                                 |
| ------- | ------------------------------------ |
| macOS   | `~/Library/Application Support/jcat` |
| Windows | `%APPDATA%\jcat`                     |

`settings.json`에는 테마, 언어, 경로가 들어 있습니다. API Key 암호문은 `secrets.bin`(`safeStorage`로 암호화)에 있습니다. 끝나지 않은 시험은 `exam-session.json`을 쓰며 **Key를 포함하지 않습니다.** 업그레이드 후에도 이 파일을 읽습니다. 제거는 기본적으로 이 데이터를 지우지 않으며, 사용자 프로젝트도 삭제하지 않습니다.

같은 컴퓨터의 `npm run dev`와 설치된 Jcat이 이 폴더를 공유합니다.

### 개발

Node.js 20+와 로컬 JDK(Maven은 선택):

```bash
npm ci
npm run dev
```

`examples/hello`를 열면 바로 컴파일·실행할 수 있습니다. 설정에 DeepSeek API Key를 넣고, 더보기에서 보강 입력을 켜세요.

```bash
npm test
npm run lint
npm run typecheck
npm run build:mac
npm run build:win
```
