# Jcat 1.1.1

Builds are **not Apple-notarized** and **not Windows-signed**. Verify downloads with `SHA256SUMS.txt` after this release is published. Do not disable OS security features to open Jcat.

---

## 中文

- **考试计时：** MCQ / FRQ 各 90 分钟，用绝对截止时间计算。暂停时不走表；切后台或睡眠后，恢复时按真实经过时间扣除。到零只提示一次。
- **考试恢复：** 意外退出或正常关闭后，再次打开可选择继续、重新开始或放弃。暂停退出不扣时；正在计时时按关闭期间的真实时间扣除。
- **考试隔离：** 进入考试会取消幽灵补写和 AI Debug，并停止正在运行的 Java 程序。考试期间主进程拒绝这些请求，快捷键和菜单同样受限。
- **考试报告：** 只列出**本次考试新增的超纲 API**，不是打开过的缓冲区里的全部历史。
- **AI Debug：** 可停止/取消，有超时和长度限制，流式解析更稳，错误可翻译。产品方向仍是最小修复，不代写整道 FRQ。
- **DeepSeek：** 编译运行始终在本机。只有开启补写或 AI Debug 时，相关代码才会直接发给 DeepSeek。Jcat 没有中转服务器。没有 Key 也能本地编译运行。
- **API Key：** 写入本机 `secrets.bin`，用 Electron `safeStorage` 的用户级加密保护密文（macOS 上由系统钥匙串能力支持加密，不是把原始 Key 存成钥匙串密码项）。从 v1.1.0 明文 `settings.json` 会在回读验证成功后才删除明文。渲染进程拿不到完整 Key。加密不可用或迁移失败时会提示，并保留旧明文。
- **三语言：** 编译、JDK/Maven、导出、考试恢复、Key 状态等用户可见文案补全中/英/韩。
- **JDK：** Jcat 不内置 JDK。需要本机 JDK 17 或 21。检测失败时在设置里填写 JDK Home。Maven 仅 Maven 工程需要。
- **macOS：** 当前未公证。第一次请右键打开，不要关 Gatekeeper。
- **Windows：** 当前未签名，可能出现 SmartScreen。x64 与 ARM64 请用对应安装包。
- **安装包：**
  - `jcat-1.1.1.dmg` — macOS Apple Silicon
  - `jcat-1.1.1-x64-setup.exe` — Windows x64
  - `jcat-1.1.1-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.1-setup.exe` — Windows 自动识别（同一安装包内含 x64 与 ARM64 负载）
- **覆盖升级：** 同一 `appId`。主题、语言、路径、最近工程和 Key 保留。卸载不删除用户工程。
- **校验：** 用发布里的 `SHA256SUMS.txt` 核对下载文件。SHA-256 以实际发布文件为准，本文不预填。

## English

- **Exam timer:** MC and FRQ each have 90 minutes, computed from an absolute deadline. Pause freezes the clock. Backgrounding or sleep deducts real elapsed time on resume. Zero is announced once per segment.
- **Exam restore:** After a crash or a normal quit, Jcat offers Continue, Restart, or Discard. A paused session does not lose time while the app was closed; a running session does.
- **Exam isolation:** Entering exam mode aborts ghost write and AI Debug and stops a running Java program. The main process rejects those requests for the rest of the exam. Menus and shortcuts match.
- **Exam report:** Only **off-exam APIs added during this exam**, not every token that was already in open buffers.
- **AI Debug:** Stop/cancel, timeouts, length limits, sturdier streaming, translatable errors. Still a minimal fix, not a full FRQ solution.
- **DeepSeek:** Compile and run stay local. Code is sent only if you enable ghost write or AI Debug. There is no Jcat relay. The key is optional for local work.
- **API key:** Stored in local `secrets.bin`, encrypted with Electron `safeStorage` user-level encryption (Keychain-backed on macOS; the raw key is not a Keychain password item). Plaintext keys from v1.1.0 are removed only after the ciphertext round-trips. The renderer never receives the full key. If encryption is unavailable or migration fails, Jcat says so and keeps the old plaintext.
- **i18n:** Compile, JDK/Maven, export, exam restore, and key-status copy exist in Chinese, English, and Korean.
- **JDK:** Jcat does not bundle a JDK. You need JDK 17 or 21 on the machine. Set JDK Home in Settings if auto-detect fails. Maven is optional.
- **macOS:** not notarized. First open via right-click → Open. Do not turn off Gatekeeper.
- **Windows:** not signed; SmartScreen may appear. Use the matching x64 or ARM64 installer.
- **Installers:**
  - `jcat-1.1.1.dmg` — macOS Apple Silicon
  - `jcat-1.1.1-x64-setup.exe` — Windows x64
  - `jcat-1.1.1-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.1-setup.exe` — Windows auto-detect (x64 and ARM64 payloads in one NSIS)
- **In-place upgrade:** same `appId`. Theme, language, paths, recent projects, and the key remain. Uninstall does not delete your projects.
- **Checksums:** use `SHA256SUMS.txt` from the GitHub Release. Hashes are not invented in this file.

## 한국어

- **시험 타이머:** 객관식·서술형 각 90분, 절대 마감 시각으로 계산합니다. 일시정지 중에는 줄지 않습니다. 백그라운드나 절전 후에는 실제 경과 시간을 뺍니다. 0초 알림은 구간마다 한 번입니다.
- **시험 복구:** 비정상 종료나 정상 종료 후 다시 열면 계속 / 다시 시작 / 포기를 고를 수 있습니다. 일시정지 상태로 나가면 시간이 줄지 않고, 타이머가 돌아가던 중이었다면 종료 동안의 실제 시간을 뺍니다.
- **시험 격리:** 시험에 들어가면 보강 입력과 AI Debug를 취소하고 실행 중인 Java도 멈춥니다. 이후 메인 프로세스가 해당 요청을 거절합니다. 메뉴와 단축키도 같습니다.
- **시험 보고:** **이번 시험에서 새로 생긴 범위 밖 API**만 보고합니다.
- **AI Debug:** 중지/취소, 시간 제한, 길이 제한, 더 안정적인 스트리밍, 번역 가능한 오류. 최소 수정이며 FRQ 전체를 대신 쓰지 않습니다.
- **DeepSeek:** 컴파일·실행은 로컬입니다. 보강 입력 또는 AI Debug를 켠 경우에만 코드가 DeepSeek로 갑니다. Jcat 중계 서버는 없습니다. Key 없이도 로컬 작업은 됩니다.
- **API Key:** 로컬 `secrets.bin`에 저장하고 Electron `safeStorage` 사용자 수준 암호화로 보호합니다(macOS에서는 Keychain이 암호화를 지원하며, 원문 Key를 열쇠고리 암호로 넣지 않습니다). v1.1.0 평문은 암호문을 다시 읽은 뒤에만 지웁니다. 렌더러는 전체 Key를 받지 않습니다. 암호화를 못 쓰거나 이전이 실패하면 알리고 예전 평문을 남깁니다.
- **3개 언어:** 컴파일, JDK/Maven, 내보내기, 시험 복구, Key 상태 문구를 중·영·한으로 맞췄습니다.
- **JDK:** Jcat은 JDK를 넣지 않습니다. JDK 17 또는 21이 필요합니다. 자동 검출이 실패하면 설정에서 JDK Home을 넣으세요. Maven은 선택입니다.
- **macOS:** 공증되지 않았습니다. 처음에는 우클릭 → 열기. Gatekeeper를 끄지 마세요.
- **Windows:** 서명되지 않아 SmartScreen이 뜰 수 있습니다. x64 / ARM64 설치 파일을 구분하세요.
- **설치 파일:**
  - `jcat-1.1.1.dmg` — macOS Apple Silicon
  - `jcat-1.1.1-x64-setup.exe` — Windows x64
  - `jcat-1.1.1-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.1-setup.exe` — Windows 자동 인식(한 설치 파일에 x64와 ARM64)
- **덮어쓰기 업그레이드:** 같은 `appId`. 테마, 언어, 경로, 최근 프로젝트, Key가 남습니다. 제거해도 사용자 프로젝트는 지우지 않습니다.
- **검증:** GitHub Release의 `SHA256SUMS.txt`로 받은 파일을 확인하세요. 이 문서에 SHA-256을 미리 적지 않습니다.
