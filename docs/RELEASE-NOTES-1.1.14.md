# Jcat 1.1.14

Builds are **not Apple-signed or notarized** and **not Windows-signed**. Verify downloads with `SHA256SUMS.txt`. Do not disable OS security features to open Jcat.

---

## 中文

- **下拉：** 语言、更多、运行类、排序这些菜单重新带展开动画。高度不再一下弹开。
- **设置：** macOS 标题栏不再交给系统拖拽。空白处拖动窗口，按钮点击打开。设置可以点开。
- **macOS：** 当前未签名、未公证。第一次请在访达中右键 Jcat → 打开。
- **Windows：** 当前未代码签名，SmartScreen 可能显示“未知发布者”。这次没有在一台 Windows 电脑上逐项点击验证；安装包仍由 CI 做安装、PE 架构和启动存活检查。ARM64 包尚未在原生 ARM64 设备上运行验证。
- **安装包：**
  - `jcat-1.1.14.dmg` — macOS Apple Silicon
  - `jcat-1.1.14-x64-setup.exe` — Windows x64
  - `jcat-1.1.14-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.14-setup.exe` — Windows 自动识别（同一安装包内含 x64 与 ARM64 负载）

## English

- **Menus:** language, More, the run class, and sort open with an animation again.
- **Settings:** the macOS title bar is no longer a system drag region. Empty space still moves the window. Buttons, including Settings, receive the click.
- **macOS:** unsigned and not notarized. First open in Finder: right-click Jcat → Open.
- **Windows:** not code-signed; SmartScreen may show an unknown publisher. This build was not click-tested on a Windows PC. CI still runs install, PE-arch, and launch checks. The ARM64 installer has not been run on a native ARM64 device.
- **Installers:**
  - `jcat-1.1.14.dmg` — macOS Apple Silicon
  - `jcat-1.1.14-x64-setup.exe` — Windows x64
  - `jcat-1.1.14-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.14-setup.exe` — Windows auto-detect (x64 and ARM64 payloads in one NSIS)

## 한국어

- **메뉴:** 언어, 더 보기, 실행 클래스, 정렬 메뉴가 다시 펼쳐지며 열립니다.
- **설정:** macOS 제목 표시줄은 더 이상 시스템 드래그 영역이 아닙니다. 빈 곳을 끌면 창이 움직이고, 설정을 포함한 버튼은 클릭이 전달됩니다.
- **macOS:** 서명·공증되지 않았습니다. 처음에는 Finder에서 우클릭 → 열기.
- **Windows:** 코드 서명이 없어 SmartScreen이 뜰 수 있습니다. 이번 빌드는 Windows PC에서 직접 클릭 검증하지 않았습니다. CI의 설치·PE·실행 검사는 그대로입니다. ARM64는 실제 ARM64 기기 실행 검증이 아직 없습니다.
- **설치 파일:**
  - `jcat-1.1.14.dmg` — macOS Apple Silicon
  - `jcat-1.1.14-x64-setup.exe` — Windows x64
  - `jcat-1.1.14-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.14-setup.exe` — Windows 자동 인식(한 설치 파일에 x64와 ARM64)
