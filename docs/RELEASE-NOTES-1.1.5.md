# Jcat 1.1.5

Builds are **not Apple-signed or notarized** and **not Windows-signed**. Verify downloads with `SHA256SUMS.txt`. Do not disable OS security features to open Jcat.

---

## 中文

- **标题：** 收起项目栏后，macOS 标题不再被挤成「J...」。红绿灯占掉的宽度现在算进标题槽。
- **展开：** 「展开」放在标签栏里，不再挡住打开的文件。它离窗口左缘的距离和项目栏内容一致。
- **macOS：** 当前未签名、未公证。第一次请在访达中右键 Jcat → 打开。
- **Windows：** 当前未代码签名，SmartScreen 可能显示“未知发布者”。展开按钮的位置 Mac 和 Windows 相同。这次没有在一台 Windows 电脑上逐项点击验证；安装包仍由 CI 做安装、PE 架构和启动存活检查。ARM64 包尚未在原生 ARM64 设备上运行验证。
- **安装包：**
  - `jcat-1.1.5.dmg` — macOS Apple Silicon
  - `jcat-1.1.5-x64-setup.exe` — Windows x64
  - `jcat-1.1.5-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.5-setup.exe` — Windows 自动识别（同一安装包内含 x64 与 ARM64 负载）

## English

- **Title:** collapsing the project tree no longer clips the macOS title down to “J...”. The title slot now includes the traffic-light inset.
- **Expand:** the control sits in the tab row instead of covering open files, with the same left inset as the project column.
- **macOS:** unsigned and not notarized. First open in Finder: right-click Jcat → Open.
- **Windows:** not code-signed; SmartScreen may show an unknown publisher. The expand control uses the same layout on macOS and Windows. This build was not click-tested on a Windows PC. CI still runs install, PE-arch, and launch checks. The ARM64 installer has not been run on a native ARM64 device.
- **Installers:**
  - `jcat-1.1.5.dmg` — macOS Apple Silicon
  - `jcat-1.1.5-x64-setup.exe` — Windows x64
  - `jcat-1.1.5-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.5-setup.exe` — Windows auto-detect (x64 and ARM64 payloads in one NSIS)

## 한국어

- **제목:** 프로젝트 트리를 접어도 macOS 제목이 「J...」로 잘리지 않습니다. 신호등 버튼이 차지하는 너비를 제목 칸에 넣었습니다.
- **펼치기:** 열린 파일을 가리지 않도록 탭 줄에 두고, 왼쪽 여백은 프로젝트 열과 같습니다.
- **macOS:** 서명·공증되지 않았습니다. 처음에는 Finder에서 우클릭 → 열기.
- **Windows:** 코드 서명이 없어 SmartScreen이 뜰 수 있습니다. 펼치기 배치는 macOS와 Windows가 같습니다. 이번 빌드는 Windows PC에서 직접 클릭 검증하지 않았습니다. CI의 설치·PE·실행 검사는 그대로입니다. ARM64는 실제 ARM64 기기 실행 검증이 아직 없습니다.
- **설치 파일:**
  - `jcat-1.1.5.dmg` — macOS Apple Silicon
  - `jcat-1.1.5-x64-setup.exe` — Windows x64
  - `jcat-1.1.5-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.5-setup.exe` — Windows 자동 인식(한 설치 파일에 x64와 ARM64)
