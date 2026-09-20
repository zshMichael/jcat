# Jcat

[中文](#中文) · [English](#english) · [한국어](#한국어)

A local Java IDE for AP CSA: compile and run, ghost write, AI Debug, exam mode, and long-image export. Cats stay as line drawings.

---

## 中文

Jcat 是装在自己电脑上的 Java IDE，给 AP CSA 课堂和作业用。不用账号，也不把代码上传到我们的服务器。DeepSeek 只在你自己填写 API Key 之后，才用来补写和分析。

### 能做什么

- 打开文件夹，或新建空工程 / Hello / Scanner / FRQ 骨架
- 本机 `javac` / `java`，有 Maven 工程就走 `mvn`
- 编辑器：主题、中英韩、查找、格式化、方法大纲
- 补写：灰色预写，按你正在写的往下补，Tab 采纳
- AI Debug：按给分点说，Java 用独立代码框，框上可复制
- 考试模式：选择题 / 自由作答各 90 分钟，可暂停、继续、重启考试
- AP CSA 超纲提示、考试参考卡片
- 代码长图导出（可隐去行号）
- 空页面每日一句格言

### 安装 1.1.0

到 [Releases](https://github.com/zshMichael/jcat/releases/tag/v1.1.0) 下载：

| 系统 | 文件 |
| --- | --- |
| macOS Apple Silicon | `jcat-1.1.0.dmg` |
| Windows x64 | `jcat-1.1.0-x64-setup.exe` |
| Windows ARM | `jcat-1.1.0-arm64-setup.exe` |
| Windows 自动识别 | `jcat-1.1.0-setup.exe` |

macOS 包未公证。第一次打开：右键 Jcat → 打开。把 `/Applications/Jcat.app` 换掉即可升级，设置还在。

Windows 用同一 `appId` 覆盖安装，不必卸干净。

### API Key 放在哪

DeepSeek Key **只写在本机用户目录**，例如 macOS 的 `~/Library/Application Support/jcat/settings.json`。仓库、安装包、`.asar` 里都没有 Key。

同一台电脑上 `npm run dev` 和已经装好的 Jcat 共用这份设置，所以开发时仍能看到你填过的 Key——那是本地文件，不是打进安装包里的。

### 开发

需要 Node.js 20+，以及 JDK（可选 Maven）。

```bash
npm install
npm run dev
```

打开 `examples/hello` 可以立刻编译运行。设置里填 DeepSeek API Key 后，更多菜单打开补写。

```bash
npm run build:mac    # macOS dmg
npm run build:win    # Windows x64 + arm64
```

---

## English

Jcat is a local Java IDE for AP CSA labs and exams. There is no Jcat account. Your source stays on the machine. DeepSeek is used only after you paste your own API key.

### Features

- Open a folder, or start an empty project / Hello / Scanner / FRQ skeleton
- Local `javac` / `java`, or Maven when a `pom.xml` is present
- Themes, Chinese / English / Korean, find, format, method outline
- Ghost write: grey continuation of what you are typing; Tab accepts
- AI Debug: scoring-point notes, Java in its own code frame with copy
- Exam mode: 90 minutes each for MC and FRQ, with pause, resume, and restart
- Off-exam API hints and exam reference cards
- Long-image export (optional hidden line numbers)
- A daily motto on the empty editor page

### Install 1.1.0

Grab a build from [Releases](https://github.com/zshMichael/jcat/releases/tag/v1.1.0):

| OS | File |
| --- | --- |
| macOS Apple Silicon | `jcat-1.1.0.dmg` |
| Windows x64 | `jcat-1.1.0-x64-setup.exe` |
| Windows ARM | `jcat-1.1.0-arm64-setup.exe` |
| Windows (bundle) | `jcat-1.1.0-setup.exe` |

The macOS build is not notarized. First launch: right-click Jcat → Open. Replacing `/Applications/Jcat.app` upgrades in place; settings stay.

Windows setup overwrites the previous install (`appId` is stable).

### Where the API key lives

The DeepSeek key is stored **only in the OS user-data folder**, e.g. `~/Library/Application Support/jcat/settings.json` on macOS. It is not in the git repo, the installer, or `app.asar`.

`npm run dev` and the installed app on the same computer share that file, so the key still shows up in development. That is local state, not something baked into the package.

### Develop

Node.js 20+ and a JDK (Maven optional):

```bash
npm install
npm run dev
```

Open `examples/hello` to compile and run. Add a DeepSeek API key in Settings, then turn on ghost write from More.

```bash
npm run build:mac
npm run build:win
```

---

## 한국어

Jcat은 AP CSA 수업·과제를 위한 로컬 Java IDE입니다. Jcat 계정은 없고, 코드는 이 컴퓨터에 남습니다. DeepSeek는 직접 API Key를 넣은 뒤에만 보강 입력과 분석에 쓰입니다.

### 할 수 있는 일

- 폴더 열기, 빈 프로젝트 / Hello / Scanner / FRQ 뼈대
- 로컬 `javac` / `java`, Maven 프로젝트는 `mvn`
- 테마, 중·영·한, 찾기, 포맷, 메서드 개요
- 보강 입력: 지금 쓰는 코드를 회색으로 이어서 채움, Tab으로 수락
- AI Debug: 배점 설명, Java는 전용 코드 상자(복사 가능)
- 시험 모드: 객관식·서술형 각 90분, 일시정지·계속·다시 시작
- 범위 밖 API 표시, 시험 참고 카드
- 코드 긴 그림 내보내기(줄 번호 숨김 가능)
- 빈 화면의 하루 한 문장

### 1.1.0 설치

[Releases](https://github.com/zshMichael/jcat/releases/tag/v1.1.0)에서 받습니다.

| OS | 파일 |
| --- | --- |
| macOS Apple Silicon | `jcat-1.1.0.dmg` |
| Windows x64 | `jcat-1.1.0-x64-setup.exe` |
| Windows ARM | `jcat-1.1.0-arm64-setup.exe` |
| Windows 통합 | `jcat-1.1.0-setup.exe` |

macOS 빌드는 공증되어 있지 않습니다. 처음 실행: Jcat을 우클릭 → 열기. `/Applications/Jcat.app`만 바꾸면 업그레이드되고 설정은 남습니다.

Windows는 같은 `appId`로 덮어씁니다.

### API Key가 있는 곳

DeepSeek Key는 **이 컴퓨터의 사용자 데이터 폴더에만** 저장됩니다. macOS에서는 `~/Library/Application Support/jcat/settings.json`. 저장소, 설치 파일, `app.asar`에는 없습니다.

같은 Mac에서 `npm run dev`와 설치된 Jcat이 이 파일을 공유하므로, 개발 실행에도 Key가 보입니다. 패키지에 넣은 것이 아닙니다.

### 개발

Node.js 20+와 JDK(Maven은 선택):

```bash
npm install
npm run dev
```

`examples/hello`를 열면 바로 컴파일·실행할 수 있습니다. 설정에 DeepSeek API Key를 넣고, 더보기에서 보강 입력을 켜세요.

```bash
npm run build:mac
npm run build:win
```
