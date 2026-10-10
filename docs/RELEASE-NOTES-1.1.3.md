# Jcat 1.1.3

Builds are **not Apple-signed or notarized** and **not Windows-signed**. Verify downloads with `SHA256SUMS.txt`. Do not disable OS security features to open Jcat.

---

## 中文

- **保存对话框：** macOS 上选择保存位置时，对话框语言跟随 Jcat 里选的语言。改完语言后重新打开 Jcat，下一次系统对话框就会用新语言。
- **项目树：** 行距加大，选中条不再贴在一起。勾选改为「只显示 Java 文件」。
- **拖动：** 在文件或文件夹上长按，可以拖进另一个文件夹，或拖到空白处移出到项目根目录。
- **macOS：** 当前未签名、未公证。第一次请在访达中右键 Jcat → 打开。
- **Windows：** 当前未代码签名，SmartScreen 可能显示“未知发布者”。ARM64 包完成构建与 payload 校验，尚未在原生 ARM64 设备上运行验证。
- **安装包：**
  - `jcat-1.1.3.dmg` — macOS Apple Silicon
  - `jcat-1.1.3-x64-setup.exe` — Windows x64
  - `jcat-1.1.3-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.3-setup.exe` — Windows 自动识别（同一安装包内含 x64 与 ARM64 负载）

## English

- **Save dialog:** on macOS, the save panel follows the language chosen in Jcat. Reopen Jcat after changing language so the next system dialog uses it.
- **Project tree:** rows have more space. The checkbox shows Java files only.
- **Drag:** long-press a file or folder to move it into another folder, or onto empty tree space to move it out to the project root.
- **macOS:** unsigned and not notarized. First open in Finder: right-click Jcat → Open.
- **Windows:** not code-signed; SmartScreen may show an unknown publisher. The ARM64 installer is built and payload-checked; it has not been run on a native ARM64 device.
- **Installers:**
  - `jcat-1.1.3.dmg` — macOS Apple Silicon
  - `jcat-1.1.3-x64-setup.exe` — Windows x64
  - `jcat-1.1.3-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.3-setup.exe` — Windows auto-detect (x64 and ARM64 payloads in one NSIS)

## 한국어

- **저장 대화상자:** macOS에서 저장 위치 창은 Jcat에서 고른 언어를 따릅니다. 언어를 바꾼 뒤 Jcat을 다시 열면 다음 시스템 대화상자에 적용됩니다.
- **프로젝트 트리:** 줄 간격이 넓어졌습니다. 체크하면 Java 파일만 보입니다.
- **끌기:** 파일이나 폴더를 길게 눌러 다른 폴더로 옮기거나, 빈 곳으로 끌어 프로젝트 루트로 꺼낼 수 있습니다.
- **macOS:** 서명·공증되지 않았습니다. 처음에는 Finder에서 우클릭 → 열기.
- **Windows:** 코드 서명이 없어 SmartScreen이 뜰 수 있습니다. ARM64 패키지는 빌드와 payload 검증까지이며, 실제 ARM64 기기 실행 검증은 아직 없습니다.
- **설치 파일:**
  - `jcat-1.1.3.dmg` — macOS Apple Silicon
  - `jcat-1.1.3-x64-setup.exe` — Windows x64
  - `jcat-1.1.3-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.3-setup.exe` — Windows 자동 인식(한 설치 파일에 x64와 ARM64)
