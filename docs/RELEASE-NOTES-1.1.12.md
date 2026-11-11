# Jcat 1.1.12

Builds are **not Apple-signed or notarized** and **not Windows-signed**. Verify downloads with `SHA256SUMS.txt`. Do not disable OS security features to open Jcat.

---

## 中文

- **多个类：** 一个文件里只要还有别的顶层类型，保存就不会再跟着类名改文件名。文件名只在「这一个文件里只有一个 public 顶层类型」时跟着它走。嵌套类不带动文件名。两个 public 顶层类型会标红，文件名保持不动。
- **macOS：** 当前未签名、未公证。第一次请在访达中右键 Jcat → 打开。
- **Windows：** 当前未代码签名，SmartScreen 可能显示“未知发布者”。这次没有在一台 Windows 电脑上逐项点击验证；安装包仍由 CI 做安装、PE 架构和启动存活检查。ARM64 包尚未在原生 ARM64 设备上运行验证。
- **安装包：**
  - `jcat-1.1.12.dmg` — macOS Apple Silicon
  - `jcat-1.1.12-x64-setup.exe` — Windows x64
  - `jcat-1.1.12-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.12-setup.exe` — Windows 自动识别（同一安装包内含 x64 与 ARM64 负载）

## English

- **Several types:** saving no longer renames a file that contains another top-level type. The file name follows a type only when that file has a single public top-level type. Nested types leave the file name alone. Two public top-level types are marked, and the file name stays.
- **macOS:** unsigned and not notarized. First open in Finder: right-click Jcat → Open.
- **Windows:** not code-signed; SmartScreen may show an unknown publisher. This build was not click-tested on a Windows PC. CI still runs install, PE-arch, and launch checks. The ARM64 installer has not been run on a native ARM64 device.
- **Installers:**
  - `jcat-1.1.12.dmg` — macOS Apple Silicon
  - `jcat-1.1.12-x64-setup.exe` — Windows x64
  - `jcat-1.1.12-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.12-setup.exe` — Windows auto-detect (x64 and ARM64 payloads in one NSIS)

## 한국어

- **여러 타입:** 파일에 다른 최상위 타입이 있으면 저장할 때 파일 이름을 바꾸지 않습니다. 파일 이름은 public 최상위 타입이 하나뿐일 때만 그 이름을 따라갑니다. 중첩 타입은 파일 이름에 영향을 주지 않습니다. public 최상위 타입이 둘이면 표시만 하고 파일 이름은 유지합니다.
- **macOS:** 서명·공증되지 않았습니다. 처음에는 Finder에서 우클릭 → 열기.
- **Windows:** 코드 서명이 없어 SmartScreen이 뜰 수 있습니다. 이번 빌드는 Windows PC에서 직접 클릭 검증하지 않았습니다. CI의 설치·PE·실행 검사는 그대로입니다. ARM64는 실제 ARM64 기기 실행 검증이 아직 없습니다.
- **설치 파일:**
  - `jcat-1.1.12.dmg` — macOS Apple Silicon
  - `jcat-1.1.12-x64-setup.exe` — Windows x64
  - `jcat-1.1.12-arm64-setup.exe` — Windows ARM64
  - `jcat-1.1.12-setup.exe` — Windows 자동 인식(한 설치 파일에 x64와 ARM64)
