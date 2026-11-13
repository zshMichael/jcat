# Jcat 1.1.20

Builds are **not Apple-signed or notarized** and **not Windows-signed**. Verify downloads with `SHA256SUMS.txt`. Do not disable OS security features to open Jcat.

---

## 中文

- **代码长图：** 左上角标志和「代码长图 / 类名 · 主题名」重新排成一行，标志用当前文字颜色。切换预览主题时，后面的编辑器不再闪一块底色。着色按所选主题本身的颜色，不改 IDE 的主题。
- **macOS：** 当前未签名、未公证。第一次请在访达中右键 Jcat → 打开。
- **Windows：** 当前未代码签名，SmartScreen 可能显示“未知发布者”。这次没有在一台 Windows 电脑上逐项点击验证；安装包仍由 CI 做安装、PE 架构和启动存活检查。ARM64 包尚未在原生 ARM64 设备上运行验证。
- **安装包：**
  - `jcat-1.1.20.dmg` — macOS Apple Silicon
  - `jcat-1.1.20-x64-setup.exe` — Windows x64
  - `jcat-1.1.20-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.20-setup.exe` — Windows 自动识别（同一安装包内含 x64 与 ARM64 负载）

## English

- **Long image:** the mark sits on one line with the title, tinted to the text color. Changing the preview theme no longer flashes the editor behind the sheet. Colors come from the chosen theme and do not change the IDE theme.
- **macOS:** unsigned and not notarized. First open in Finder: right-click Jcat → Open.
- **Windows:** not code-signed; SmartScreen may show an unknown publisher. This build was not click-tested on a Windows PC. CI still runs install, PE-arch, and launch checks. The ARM64 installer has not been run on a native ARM64 device.
- **Installers:**
  - `jcat-1.1.20.dmg` — macOS Apple Silicon
  - `jcat-1.1.20-x64-setup.exe` — Windows x64
  - `jcat-1.1.20-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.20-setup.exe` — Windows auto-detect (x64 and ARM64 payloads in one NSIS)

## 한국어

- **긴 그림:** 표시가 제목과 한 줄에 놓이고, 글자색으로 칠해집니다. 미리보기 테마를 바꿔도 뒤의 편집기가 번쩍이지 않습니다. 색은 고른 테마의 색이며 IDE 테마는 바꾸지 않습니다.
- **macOS:** 서명·공증되지 않았습니다. 처음에는 Finder에서 우클릭 → 열기.
- **Windows:** 코드 서명이 없어 SmartScreen이 뜰 수 있습니다. 이번 빌드는 Windows PC에서 직접 클릭 검증하지 않았습니다. CI의 설치·PE·실행 검사는 그대로입니다. ARM64는 실제 ARM64 기기 실행 검증이 아직 없습니다.
- **설치 파일:**
  - `jcat-1.1.20.dmg` — macOS Apple Silicon
  - `jcat-1.1.20-x64-setup.exe` — Windows x64
  - `jcat-1.1.20-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.20-setup.exe` — Windows 자동 인식(한 설치 파일에 x64와 ARM64)
