# Jcat 1.1.10

Builds are **not Apple-signed or notarized** and **not Windows-signed**. Verify downloads with `SHA256SUMS.txt`. Do not disable OS security features to open Jcat.

---

## 中文

- **按钮：** macOS 上「设置」「更多」、语言、运行和编译又能点开了。这些控件不再放在窗口拖拽区里，底色也不再是透明的，所以真正的点击能落到按钮上。
- **macOS：** 当前未签名、未公证。第一次请在访达中右键 Jcat → 打开。
- **Windows：** 当前未代码签名，SmartScreen 可能显示“未知发布者”。这次没有在一台 Windows 电脑上逐项点击验证；安装包仍由 CI 做安装、PE 架构和启动存活检查。ARM64 包尚未在原生 ARM64 设备上运行验证。
- **安装包：**
  - `jcat-1.1.10.dmg` — macOS Apple Silicon
  - `jcat-1.1.10-x64-setup.exe` — Windows x64
  - `jcat-1.1.10-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.10-setup.exe` — Windows 自动识别（同一安装包内含 x64 与 ARM64 负载）

## English

- **Buttons:** on macOS, Settings, More, language, Run, and Compile open again. Those controls are outside the window drag region and no longer use a transparent background, so a real click reaches the button.
- **macOS:** unsigned and not notarized. First open in Finder: right-click Jcat → Open.
- **Windows:** not code-signed; SmartScreen may show an unknown publisher. This build was not click-tested on a Windows PC. CI still runs install, PE-arch, and launch checks. The ARM64 installer has not been run on a native ARM64 device.
- **Installers:**
  - `jcat-1.1.10.dmg` — macOS Apple Silicon
  - `jcat-1.1.10-x64-setup.exe` — Windows x64
  - `jcat-1.1.10-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.10-setup.exe` — Windows auto-detect (x64 and ARM64 payloads in one NSIS)

## 한국어

- **버튼:** macOS에서 설정, 더 보기, 언어, 실행, 컴파일을 다시 열 수 있습니다. 이 컨트롤은 창 드래그 영역 밖에 있고 투명 배경이 아니라서 실제 클릭이 버튼에 닿습니다.
- **macOS:** 서명·공증되지 않았습니다. 처음에는 Finder에서 우클릭 → 열기.
- **Windows:** 코드 서명이 없어 SmartScreen이 뜰 수 있습니다. 이번 빌드는 Windows PC에서 직접 클릭 검증하지 않았습니다. CI의 설치·PE·실행 검사는 그대로입니다. ARM64는 실제 ARM64 기기 실행 검증이 아직 없습니다.
- **설치 파일:**
  - `jcat-1.1.10.dmg` — macOS Apple Silicon
  - `jcat-1.1.10-x64-setup.exe` — Windows x64
  - `jcat-1.1.10-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.10-setup.exe` — Windows 자동 인식(한 설치 파일에 x64와 ARM64)
