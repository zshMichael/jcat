# Jcat 1.1.15

Builds are **not Apple-signed or notarized** and **not Windows-signed**. Verify downloads with `SHA256SUMS.txt`. Do not disable OS security features to open Jcat.

---

## 中文

- **设置：** macOS 上「设置」可以点开了。之前用的标题栏样式会在原来显示窗口标题的位置吃掉点击。现在改成普通的隐藏标题栏，红绿灯还在，点击能到达按钮。也可以按 `⌘,` 打开设置。
- **macOS：** 当前未签名、未公证。第一次请在访达中右键 Jcat → 打开。
- **Windows：** 当前未代码签名，SmartScreen 可能显示“未知发布者”。这次没有在一台 Windows 电脑上逐项点击验证；安装包仍由 CI 做安装、PE 架构和启动存活检查。ARM64 包尚未在原生 ARM64 设备上运行验证。
- **安装包：**
  - `jcat-1.1.15.dmg` — macOS Apple Silicon
  - `jcat-1.1.15-x64-setup.exe` — Windows x64
  - `jcat-1.1.15-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.15-setup.exe` — Windows 自动识别（同一安装包内含 x64 与 ARM64 负载）

## English

- **Settings:** Settings opens on macOS. The previous title-bar style swallowed clicks where the window title would have been. The title bar is now simply hidden, the traffic lights stay, and the click reaches the button. `⌘,` opens Settings too.
- **macOS:** unsigned and not notarized. First open in Finder: right-click Jcat → Open.
- **Windows:** not code-signed; SmartScreen may show an unknown publisher. This build was not click-tested on a Windows PC. CI still runs install, PE-arch, and launch checks. The ARM64 installer has not been run on a native ARM64 device.
- **Installers:**
  - `jcat-1.1.15.dmg` — macOS Apple Silicon
  - `jcat-1.1.15-x64-setup.exe` — Windows x64
  - `jcat-1.1.15-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.15-setup.exe` — Windows auto-detect (x64 and ARM64 payloads in one NSIS)

## 한국어

- **설정:** macOS에서 설정이 열립니다. 이전 제목 표시줄 스타일은 창 제목이 있던 자리의 클릭을 삼켰습니다. 이제 제목 표시줄만 숨기고 신호등은 그대로 두어, 클릭이 버튼에 전달됩니다. `⌘,`로도 설정이 열립니다.
- **macOS:** 서명·공증되지 않았습니다. 처음에는 Finder에서 우클릭 → 열기.
- **Windows:** 코드 서명이 없어 SmartScreen이 뜰 수 있습니다. 이번 빌드는 Windows PC에서 직접 클릭 검증하지 않았습니다. CI의 설치·PE·실행 검사는 그대로입니다. ARM64는 실제 ARM64 기기 실행 검증이 아직 없습니다.
- **설치 파일:**
  - `jcat-1.1.15.dmg` — macOS Apple Silicon
  - `jcat-1.1.15-x64-setup.exe` — Windows x64
  - `jcat-1.1.15-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.15-setup.exe` — Windows 자동 인식(한 설치 파일에 x64와 ARM64)
