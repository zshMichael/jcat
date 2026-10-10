# Jcat 1.1.2

Builds are **not Apple-signed or notarized** and **not Windows-signed**. Verify downloads with `SHA256SUMS.txt`. Do not disable OS security features to open Jcat.

---

## 中文

- **代码长图：** 底部运行记录改为完整输出，不再只留最后几行。很长时分段接在图下面。
- **运行窗：** 新输出出现时自动滚到最新一行。
- **Windows：** 顶栏空白处按住拖动即可移动窗口。按钮和菜单仍可点击。
- **macOS：** 当前未签名、未公证。第一次请在访达中右键 Jcat → 打开，不要关 Gatekeeper。
- **Windows 安装包：** 当前未代码签名，SmartScreen 可能显示“未知发布者”。x64 与自动识别包会在本次发布的 CI 里做安装、PE 架构和启动存活检查。ARM64 包会完成构建与 payload 校验；尚未在原生 ARM64 设备上运行验证。
- **JDK：** Jcat 不内置 JDK。需要本机 JDK 17 或 21。
- **DeepSeek：** 只有主动开启补写或 AI Debug 时，相关代码才会发给 DeepSeek。
- **安装包：**
  - `jcat-1.1.2.dmg` — macOS Apple Silicon
  - `jcat-1.1.2-x64-setup.exe` — Windows x64
  - `jcat-1.1.2-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.2-setup.exe` — Windows 自动识别（同一安装包内含 x64 与 ARM64 负载）
- **校验：** 用发布里的 `SHA256SUMS.txt` 核对下载文件。

## English

- **Long image:** the run section is the full log, not the last few lines. A long log continues in further slices.
- **Run pane:** new output scrolls to the latest line.
- **Windows:** drag empty titlebar space to move the window. Buttons and menus still click.
- **macOS:** unsigned and not notarized. First open in Finder: right-click Jcat → Open. Do not turn off Gatekeeper.
- **Windows installers:** not code-signed; SmartScreen may show an unknown publisher. The x64 and auto-detect installers get CI install, PE-arch, and launch-survive checks in this release. The ARM64 installer is built and payload-checked; it has not been run on a native ARM64 device.
- **JDK:** Jcat does not bundle a JDK. You need JDK 17 or 21 on the machine.
- **DeepSeek:** code is sent only if you enable ghost write or AI Debug.
- **Installers:**
  - `jcat-1.1.2.dmg` — macOS Apple Silicon
  - `jcat-1.1.2-x64-setup.exe` — Windows x64
  - `jcat-1.1.2-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.2-setup.exe` — Windows auto-detect (x64 and ARM64 payloads in one NSIS)
- **Checksums:** use `SHA256SUMS.txt` from the GitHub Release.

## 한국어

- **코드 긴 그림:** 실행 기록은 마지막 몇 줄이 아니라 전체 출력입니다. 길면 이어서 붙입니다.
- **실행 창:** 새 출력이 생기면 맨 아래로 스크롤합니다.
- **Windows:** 제목 표시줄의 빈 곳을 끌어 창을 옮깁니다. 버튼과 메뉴는 그대로 누릅니다.
- **macOS:** 서명·공증되지 않았습니다. 처음에는 Finder에서 Jcat을 우클릭 → 열기. Gatekeeper를 끄지 마세요.
- **Windows 설치 파일:** 코드 서명이 없어 SmartScreen이 “알 수 없는 게시자”를 표시할 수 있습니다. x64와 자동 인식 설치 파일은 이번 릴리스 CI에서 설치·PE 아키텍처·실행 생존 검사를 받습니다. ARM64 패키지는 빌드와 payload 검증까지이며, 실제 ARM64 기기에서 실행 검증은 아직 없습니다.
- **JDK:** Jcat은 JDK를 넣지 않습니다. JDK 17 또는 21이 필요합니다.
- **DeepSeek:** 보강 입력 또는 AI Debug를 켠 경우에만 코드가 전송됩니다.
- **설치 파일:**
  - `jcat-1.1.2.dmg` — macOS Apple Silicon
  - `jcat-1.1.2-x64-setup.exe` — Windows x64
  - `jcat-1.1.2-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.2-setup.exe` — Windows 자동 인식(한 설치 파일에 x64와 ARM64)
- **검증:** GitHub Release의 `SHA256SUMS.txt`로 받은 파일을 확인하세요.
