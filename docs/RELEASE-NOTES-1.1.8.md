# Jcat 1.1.8

Builds are **not Apple-signed or notarized** and **not Windows-signed**. Verify downloads with `SHA256SUMS.txt`. Do not disable OS security features to open Jcat.

---

## 中文

- **按钮：** macOS 上「设置」「更多」、语言和运行类这些顶栏按钮可以点开了。按钮所在的区域不再跟着窗口一起被当成拖拽区。关掉对话框后，也不会再留下一层看不见的遮罩把后面的按钮挡住。
- **macOS：** 当前未签名、未公证。第一次请在访达中右键 Jcat → 打开。
- **Windows：** 当前未代码签名，SmartScreen 可能显示“未知发布者”。这次没有在一台 Windows 电脑上逐项点击验证；安装包仍由 CI 做安装、PE 架构和启动存活检查。ARM64 包尚未在原生 ARM64 设备上运行验证。
- **安装包：**
  - `jcat-1.1.8.dmg` — macOS Apple Silicon
  - `jcat-1.1.8-x64-setup.exe` — Windows x64
  - `jcat-1.1.8-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.8-setup.exe` — Windows 自动识别（同一安装包内含 x64 与 ARM64 负载）

## English

- **Buttons:** on macOS, title-bar controls such as Settings, More, language, and the run-class menu open again. That row is no longer part of the window drag region, and closing a dialog no longer leaves an invisible layer over the other buttons.
- **macOS:** unsigned and not notarized. First open in Finder: right-click Jcat → Open.
- **Windows:** not code-signed; SmartScreen may show an unknown publisher. This build was not click-tested on a Windows PC. CI still runs install, PE-arch, and launch checks. The ARM64 installer has not been run on a native ARM64 device.
- **Installers:**
  - `jcat-1.1.8.dmg` — macOS Apple Silicon
  - `jcat-1.1.8-x64-setup.exe` — Windows x64
  - `jcat-1.1.8-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.8-setup.exe` — Windows auto-detect (x64 and ARM64 payloads in one NSIS)

## 한국어

- **버튼:** macOS에서 설정, 더 보기, 언어, 실행 클래스 같은 제목 표시줄 버튼을 다시 열 수 있습니다. 그 영역은 창 드래그 영역이 아니고, 대화상자를 닫아도 다른 버튼을 가리는 투명 층이 남지 않습니다.
- **macOS:** 서명·공증되지 않았습니다. 처음에는 Finder에서 우클릭 → 열기.
- **Windows:** 코드 서명이 없어 SmartScreen이 뜰 수 있습니다. 이번 빌드는 Windows PC에서 직접 클릭 검증하지 않았습니다. CI의 설치·PE·실행 검사는 그대로입니다. ARM64는 실제 ARM64 기기 실행 검증이 아직 없습니다.
- **설치 파일:**
  - `jcat-1.1.8.dmg` — macOS Apple Silicon
  - `jcat-1.1.8-x64-setup.exe` — Windows x64
  - `jcat-1.1.8-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.8-setup.exe` — Windows 자동 인식(한 설치 파일에 x64와 ARM64)
