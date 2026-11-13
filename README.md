# Jcat

给 AP CSA 用的本地 Java IDE。编译和运行都在你自己的电脑上，不用注册账号。

[中文](#中文) · [English](#english) · [한국어](#한국어)

---

## 中文

打开文件夹就能写。本机 `javac` / `java` 编译运行，工程里有 `pom.xml` 就走 Maven。编辑器可以换主题、切换中英韩、查找、格式化，也能看方法大纲。

幽灵补写会用灰色接着你正在写的内容往下补，Tab 采纳。AI Debug 按给分点说明，Java 放在单独的代码框里，可以中途停掉。考试模式里选择题和自由作答各 90 分钟，能暂停、继续，关掉再打开还能接着考。

补写和 AI Debug 用 DeepSeek。只有你打开它们的时候，相关代码才会直接发给 DeepSeek。不填 API Key 也可以编译运行。Jcat 没有自己的服务器。

### 安装 1.2.0

到 [Releases](https://github.com/zshMichael/jcat/releases/tag/v1.2.0) 下载。每个发布里有 `SHA256SUMS.txt`，可以核对文件的 SHA-256。安装包没有 Apple 公证，也没有 Windows 签名。

| 系统 | 文件 |
| --- | --- |
| macOS Apple Silicon | `jcat-1.2.0.dmg` |
| Windows x64 | `jcat-1.2.0-x64-setup.exe` |
| Windows ARM64 | `jcat-1.2.0-arm64-setup.exe` |
| Windows 自动识别（含 x64 与 ARM64） | `jcat-1.2.0-setup.exe` |

macOS 第一次打开：在访达里右键 Jcat，选「打开」。升级时换掉 `/Applications/Jcat.app` 即可，设置和 Key 还在。

Windows 若出现 SmartScreen，选「仍要运行」。不用先卸载，覆盖安装就行。`jcat-1.2.0-x64-setup.exe` 和 `jcat-1.2.0-arm64-setup.exe` 各只含一种架构。`jcat-1.2.0-setup.exe` 里两种都有，安装时按系统选择。

卸载不会删除你的工程，默认也不删除应用数据。

### JDK

Jcat 不带 JDK。建议安装 Temurin 或 Oracle JDK 17 或 21。

macOS 上会找 `JAVA_HOME`、`PATH` 里的 `javac`，以及 `/Library/Java/JavaVirtualMachines`。Windows 上还会看 Program Files 里常见的 JDK 目录（Java、Adoptium、Microsoft、Corretto、Zulu）。找不到就在设置里填 JDK 路径。Maven 只在有 `pom.xml` 的工程里需要。路径可以包含中文和空格。

### 数据放在哪

| 系统 | 路径 |
| --- | --- |
| macOS | `~/Library/Application Support/jcat` |
| Windows | `%APPDATA%\jcat` |

`settings.json` 里是主题、语言和路径。API Key 写在 `secrets.bin`，用 Electron `safeStorage` 加密，不再放进设置文件。没考完的考试记在 `exam-session.json`，里面没有 Key。同一台电脑上，`npm run dev` 和安装版共用这个目录。

编译和运行不出这台电脑。Key 也只留在本机。打开幽灵补写或 AI Debug 时，相关源码、选区、编译错误和运行输出会直接发给 DeepSeek。

### 开发

需要 Node.js 20+，以及本机 JDK。

```bash
npm ci
npm run dev
```

打开 `examples/hello` 就能编译运行。

```bash
npm test
npm run lint
npm run typecheck
npm run build:mac
npm run build:win
```

---

## English

Jcat is a local Java IDE for AP CSA. Compile and run happen on your machine. There is no account.

Open a folder and start writing. Jcat uses the local `javac` and `java`, and Maven when the project has a `pom.xml`. The editor has themes, Chinese / English / Korean, find, format, and a method outline.

Ghost write continues what you are typing in grey. Tab accepts it. AI Debug talks through the scoring points, puts Java in its own frame, and can be stopped. Exam mode gives 90 minutes each for multiple choice and free response. You can pause, resume, and pick the exam back up after quitting.

Ghost write and AI Debug call DeepSeek. Code is sent only after you turn one of them on. Compile and run work without an API key. Jcat has no server of its own.

### Install 1.2.0

Download from [Releases](https://github.com/zshMichael/jcat/releases/tag/v1.2.0). Each release includes `SHA256SUMS.txt`. These builds are not notarized on macOS and not signed on Windows.

| OS | File |
| --- | --- |
| macOS Apple Silicon | `jcat-1.2.0.dmg` |
| Windows x64 | `jcat-1.2.0-x64-setup.exe` |
| Windows ARM64 | `jcat-1.2.0-arm64-setup.exe` |
| Windows auto (x64 + ARM64) | `jcat-1.2.0-setup.exe` |

On macOS, the first launch is right-click Jcat in Finder and choose Open. Replacing `/Applications/Jcat.app` upgrades in place. Settings and the key stay.

On Windows, if SmartScreen appears, choose Run anyway. You do not need to uninstall first. The x64 and ARM64 installers each contain one architecture. `jcat-1.2.0-setup.exe` contains both and picks at install time.

Uninstall does not delete your projects, and it leaves app data in place.

### JDK

Jcat does not include a JDK. Temurin or Oracle JDK 17 or 21 is a good fit.

On macOS it looks at `JAVA_HOME`, `javac` on `PATH`, and `/Library/Java/JavaVirtualMachines`. On Windows it also checks the usual JDK folders under Program Files. If it misses, set the JDK path in Settings. Maven is only needed when there is a `pom.xml`. Paths can contain spaces and Chinese characters.

### Where data lives

| OS | Path |
| --- | --- |
| macOS | `~/Library/Application Support/jcat` |
| Windows | `%APPDATA%\jcat` |

`settings.json` holds the theme, language, and paths. The API key is in `secrets.bin`, encrypted with Electron `safeStorage`, not written into settings. An exam in progress is `exam-session.json`, which has no key. `npm run dev` and the installed app on the same computer share this folder.

Compile and run stay on this machine. So does the key. Turning on ghost write or AI Debug sends the relevant source, selection, compiler errors, and run output straight to DeepSeek.

### Develop

Node.js 20+ and a local JDK.

```bash
npm ci
npm run dev
```

`examples/hello` is enough to compile and run.

```bash
npm test
npm run lint
npm run typecheck
npm run build:mac
npm run build:win
```

---

## 한국어

Jcat은 AP CSA용 로컬 Java IDE입니다. 컴파일과 실행은 이 컴퓨터에서 하고, 계정은 없습니다.

폴더를 열면 바로 쓸 수 있습니다. `javac` / `java`로 컴파일·실행하고, `pom.xml`이 있으면 Maven을 씁니다. 편집기에서 테마, 중국어·영어·한국어, 찾기, 포맷, 메서드 개요를 쓸 수 있습니다.

보강 입력은 지금 치는 코드를 회색으로 이어 줍니다. Tab으로 받습니다. AI Debug는 배점대로 설명하고, Java는 따로 코드 상자에 넣으며, 중간에 멈출 수 있습니다. 시험 모드는 객관식과 서술형이 각 90분입니다. 멈추고 이어 할 수 있고, 앱을 닫았다가 다시 열어도 이어서 볼 수 있습니다.

보강 입력과 AI Debug는 DeepSeek를 씁니다. 둘 중 하나를 켠 다음에야 관련 코드가 DeepSeek로 갑니다. API Key 없이도 컴파일과 실행은 됩니다. Jcat 자체 서버는 없습니다.

### 1.2.0 설치

[Releases](https://github.com/zshMichael/jcat/releases/tag/v1.2.0)에서 받습니다. 릴리스마다 `SHA256SUMS.txt`가 있습니다. macOS 공증과 Windows 서명은 없습니다.

| OS | 파일 |
| --- | --- |
| macOS Apple Silicon | `jcat-1.2.0.dmg` |
| Windows x64 | `jcat-1.2.0-x64-setup.exe` |
| Windows ARM64 | `jcat-1.2.0-arm64-setup.exe` |
| Windows 자동 인식(x64 + ARM64) | `jcat-1.2.0-setup.exe` |

macOS에서 처음 열 때는 Finder에서 Jcat을 우클릭하고 열기를 고릅니다. `/Applications/Jcat.app`만 바꾸면 업그레이드되고, 설정과 Key는 남습니다.

Windows에서 SmartScreen이 뜨면 그래도 실행을 고릅니다. 먼저 제거할 필요는 없습니다. x64 설치 파일과 ARM64 설치 파일은 각자 하나의 아키텍처만 담습니다. `jcat-1.2.0-setup.exe`는 둘 다 들어 있고, 설치할 때 시스템에 맞는 쪽을 고릅니다.

앱을 지워도 프로젝트 폴더는 지워지지 않습니다. 앱 데이터도 기본으로는 남습니다.

### JDK

Jcat은 JDK를 넣지 않습니다. Temurin 또는 Oracle JDK 17이나 21을 쓰면 됩니다.

macOS에서는 `JAVA_HOME`, `PATH`의 `javac`, `/Library/Java/JavaVirtualMachines`를 찾습니다. Windows에서는 Program Files의 흔한 JDK 폴더도 봅니다. 못 찾으면 설정에서 JDK 경로를 적습니다. Maven은 `pom.xml`이 있을 때만 필요합니다. 경로에 공백이나 한글이 있어도 됩니다.

### 데이터 위치

| OS | 경로 |
| --- | --- |
| macOS | `~/Library/Application Support/jcat` |
| Windows | `%APPDATA%\jcat` |

`settings.json`에는 테마, 언어, 경로가 있습니다. API Key는 `secrets.bin`에 있고 Electron `safeStorage`로 암호화됩니다. 설정 파일에는 넣지 않습니다. 끝나지 않은 시험은 `exam-session.json`에 기록되며 Key는 없습니다. 같은 컴퓨터의 `npm run dev`와 설치된 앱이 이 폴더를 같이 씁니다.

컴파일과 실행은 이 컴퓨터를 나가지 않습니다. Key도 여기에만 있습니다. 보강 입력이나 AI Debug를 켜면, 관련 소스와 선택 구간, 컴파일 오류, 실행 출력이 DeepSeek로 갑니다.

### 개발

Node.js 20+와 로컬 JDK가 필요합니다.

```bash
npm ci
npm run dev
```

`examples/hello`를 열면 컴파일하고 실행해 볼 수 있습니다.

```bash
npm test
npm run lint
npm run typecheck
npm run build:mac
npm run build:win
```
